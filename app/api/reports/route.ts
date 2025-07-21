import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Expense from "@/models/Expense"
import Income from "@/models/Income"
import { getUserFromToken } from "@/lib/auth-helpers"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    const dateFilter: any = { user: new mongoose.Types.ObjectId(user.id) }
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    // Fetch expenses and income with category details
    const [expenses, income] = await Promise.all([
      Expense.find(dateFilter).populate("category", "name icon color").sort({ date: -1 }),
      Income.find(dateFilter).populate("source", "name icon color").sort({ date: -1 }),
    ])

    // Calculate summary
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0)
    const netSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

    // Group by month for breakdown
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {}

    // Process income by month
    income.forEach((inc) => {
      const month = new Date(inc.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 }
      monthlyData[month].income += inc.amount
    })

    // Process expenses by month
    expenses.forEach((exp) => {
      const month = new Date(exp.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 }
      monthlyData[month].expenses += exp.amount
    })

    const monthlyBreakdown = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Group expenses by category
    const categoryTotals: { [key: string]: number } = {}
    expenses.forEach((exp) => {
      const categoryName = exp.category?.name || "Other"
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + exp.amount
    })

    const topExpenseCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount: amount as number,
        percentage: totalExpenses > 0 ? Number(((amount as number) / totalExpenses) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Calculate growth rates (comparing with previous period)
    const periodLength =
      startDate && endDate
        ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 90

    const previousStartDate = new Date(new Date(startDate || new Date()).getTime() - periodLength * 24 * 60 * 60 * 1000)
    const previousEndDate = new Date(startDate || new Date())

    const previousDateFilter = {
      user: new mongoose.Types.ObjectId(user.id),
      date: {
        $gte: previousStartDate,
        $lte: previousEndDate,
      },
    }

    const [previousExpenses, previousIncome] = await Promise.all([
      Expense.find(previousDateFilter),
      Income.find(previousDateFilter),
    ])

    const previousTotalExpenses = previousExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const previousTotalIncome = previousIncome.reduce((sum, inc) => sum + inc.amount, 0)

    const expenseGrowth =
      previousTotalExpenses > 0
        ? Number(((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100).toFixed(1)
        : 0
    const incomeGrowth =
      previousTotalIncome > 0 ? Number(((totalIncome - previousTotalIncome) / previousTotalIncome) * 100).toFixed(1) : 0

    const reportData = {
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        expenseGrowth: Number(expenseGrowth),
        incomeGrowth: Number(incomeGrowth),
        savingsRate: Number(savingsRate.toFixed(1)),
      },
      monthlyBreakdown,
      topExpenseCategories,
      totalTransactions: expenses.length + income.length,
      dateRange: {
        start: startDate || null,
        end: endDate || null,
      },
      transactions: {
        expenses: expenses.map((exp) => ({
          id: exp._id,
          description: exp.description,
          amount: exp.amount,
          category: exp.category?.name || "Other",
          date: exp.date,
          type: "expense",
        })),
        income: income.map((inc) => ({
          id: inc._id,
          description: inc.description,
          amount: inc.amount,
          category: inc.source?.name || "Other",
          date: inc.date,
          type: "income",
        })),
      },
    }

    return NextResponse.json(reportData)
  } catch (error: any) {
    console.error("Error fetching report data:", error)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
