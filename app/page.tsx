"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OverviewCards } from "@/components/overview-cards"
import { ExpenseChart } from "@/components/expense-chart"
import { IncomeChart } from "@/components/income-chart"
import { CategoryChart } from "@/components/category-chart"
import { IncomeVsExpenseChart } from "@/components/income-vs-expense-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { BudgetProgress } from "@/components/budget-progress"
import { useData } from "@/contexts/DataContext"
import { api } from "@/lib/api"

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [error, setError] = useState("")
  const { refreshTrigger } = useData()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError("")

        // Get current month dates
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        // Get last 6 months for charts
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

        const [
          expensesResponse,
          incomeResponse,
          categoriesResponse,
          budgetsResponse,
          monthlyExpensesResponse,
          monthlyIncomeResponse,
        ] = await Promise.all([
          // Current month expenses
          api.getExpenses({
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString(),
            limit: 10,
          }),
          // Current month income
          api.getIncome({
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString(),
            limit: 10,
          }),
          // Categories for expense breakdown
          api.getCategories("expense"),
          // Budgets
          api.getBudgets("monthly"),
          // Last 6 months expenses for chart
          api.getExpenses({
            startDate: sixMonthsAgo.toISOString(),
            endDate: now.toISOString(),
            limit: 1000,
          }),
          // Last 6 months income for chart
          api.getIncome({
            startDate: sixMonthsAgo.toISOString(),
            endDate: now.toISOString(),
            limit: 1000,
          }),
        ])

        // Calculate totals
        const totalExpenses = expensesResponse.expenses.reduce((sum, expense) => sum + expense.amount, 0)
        const totalIncome = incomeResponse.income.reduce((sum, income) => sum + income.amount, 0)
        const largestExpense =
          expensesResponse.expenses.length > 0 ? Math.max(...expensesResponse.expenses.map((e) => e.amount)) : 0

        // Debug logging
        console.log("API Responses:", {
          expensesResponse,
          incomeResponse,
          totalExpenses,
          totalIncome,
          largestExpense,
          remainingBudget: totalIncome - totalExpenses
        })

        // Process monthly data for charts
        const monthlyExpenses = processMonthlyData(monthlyExpensesResponse.expenses, "expense")
        const monthlyIncome = processMonthlyData(monthlyIncomeResponse.income, "income")

        // Process category expenses
        const categoryExpenses = processCategoryExpenses(expensesResponse.expenses)

        // Process budget data
        const budgetData = await processBudgetData(budgetsResponse.budgets, expensesResponse.expenses)

        // Combine recent transactions
        const recentTransactions = [
          ...expensesResponse.expenses.slice(0, 5).map((expense) => ({
            id: expense._id,
            ...expense,
            type: "expense",
            categoryIcon: expense.category?.icon || "📦",
          })),
          ...incomeResponse.income.slice(0, 5).map((income) => ({
            id: income._id,
            ...income,
            type: "income",
            categoryIcon: income.source?.icon || "💰",
            category: income.source?.name || "Income",
          })),
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)

        setDashboardData({
          totalExpenses,
          totalIncome,
          remainingBudget: totalIncome - totalExpenses,
          largestExpense,
          monthlyExpenses,
          monthlyIncome,
          categoryExpenses,
          budgets: budgetData,
          transactions: recentTransactions,
        })
      } catch (error: any) {
        console.error("Dashboard error:", error)
        setError(error.message || "Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [refreshTrigger]) // Add refreshTrigger as dependency

  const processMonthlyData = (data: any[], type: "expense" | "income") => {
    const monthlyData: { [key: string]: number } = {}

    data.forEach((item) => {
      const date = new Date(item.date)
      const monthKey = date.toLocaleDateString("en-US", { month: "short" })
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.amount
    })

    // Get last 6 months
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString("en-US", { month: "short" })
      months.push({
        month: monthKey,
        amount: monthlyData[monthKey] || 0,
      })
    }

    return months
  }

  const processCategoryExpenses = (expenses: any[]) => {
    const categoryTotals: { [key: string]: { amount: number; category: any } } = {}

    expenses.forEach((expense) => {
      const categoryName = expense.category?.name || "Other"
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = {
          amount: 0,
          category: expense.category,
        }
      }
      categoryTotals[categoryName].amount += expense.amount
    })

    return Object.entries(categoryTotals).map(([name, data]) => ({
      category: name,
      amount: data.amount,
      color: data.category?.color || "#8884d8",
    }))
  }

  const processBudgetData = async (budgets: any[], expenses: any[]) => {
    return budgets.map((budget) => {
      const categoryExpenses = expenses.filter((expense) => expense.category?._id === budget.category._id)
      const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)

      return {
        category: budget.category.name,
        budget: budget.budget,
        spent,
        color: budget.category.color,
      }
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>

        <OverviewCards data={dashboardData} />

        <div className="grid gap-6 md:grid-cols-2">
          <ExpenseChart data={dashboardData.monthlyExpenses} />
          <IncomeChart data={dashboardData.monthlyIncome} />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <IncomeVsExpenseChart
              expenseData={dashboardData.monthlyExpenses}
              incomeData={dashboardData.monthlyIncome}
            />
          </div>
          <div>
            <CategoryChart data={dashboardData.categoryExpenses} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RecentTransactions transactions={dashboardData.transactions} />
          <BudgetProgress budgets={dashboardData.budgets} />
        </div>
      </div>
    </DashboardLayout>
  )
}
