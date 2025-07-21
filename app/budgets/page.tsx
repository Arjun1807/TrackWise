"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, AlertTriangle, CheckCircle, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useData } from "@/contexts/DataContext"
import { api } from "@/lib/api"

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [newBudget, setNewBudget] = useState({
    category: "",
    budget: "",
    period: "monthly",
  })

  const { refreshData, refreshTrigger } = useData()

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Get current month for expense calculation
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const [budgetsResponse, categoriesResponse, expensesResponse] = await Promise.all([
        api.getBudgets("monthly"),
        api.getCategories("expense"),
        api.getExpenses({
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
          limit: 1000,
        }),
      ])

      setBudgets(budgetsResponse.budgets)
      setCategories(categoriesResponse.categories)
      setExpenses(expensesResponse.expenses)
    } catch (error: any) {
      setError(error.message || "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSpentAmount = (categoryId: string) => {
    return expenses
      .filter((expense) => expense.category?._id === categoryId)
      .reduce((sum, expense) => sum + expense.amount, 0)
  }

  const handleAddBudget = async () => {
    if (newBudget.category && newBudget.budget) {
      try {
        const budgetData = {
          category: newBudget.category,
          budget: Number.parseFloat(newBudget.budget),
          period: newBudget.period,
          startDate: new Date().toISOString(),
        }

        const response = await api.createBudget(budgetData)
        setBudgets([...budgets, response.budget])
        setNewBudget({
          category: "",
          budget: "",
          period: "monthly",
        })
        setIsAddDialogOpen(false)
        refreshData()
      } catch (error: any) {
        setError(error.message || "Failed to create budget")
      }
    }
  }

  const handleEditBudget = async () => {
    if (selectedBudget && newBudget.budget) {
      try {
        const budgetData = {
          budget: Number.parseFloat(newBudget.budget),
        }

        const response = await api.updateBudget(selectedBudget._id, budgetData)
        const updatedBudgets = budgets.map((budget) => (budget._id === selectedBudget._id ? response.budget : budget))
        setBudgets(updatedBudgets)
        setIsEditDialogOpen(false)
        setSelectedBudget(null)
        refreshData()
      } catch (error: any) {
        setError(error.message || "Failed to update budget")
      }
    }
  }

  const handleDeleteBudget = async () => {
    if (selectedBudget) {
      try {
        await api.deleteBudget(selectedBudget._id)
        setBudgets(budgets.filter((budget) => budget._id !== selectedBudget._id))
        setIsDeleteDialogOpen(false)
        setSelectedBudget(null)
        refreshData()
      } catch (error: any) {
        setError(error.message || "Failed to delete budget")
      }
    }
  }

  const openEditDialog = (budget: any) => {
    setSelectedBudget(budget)
    setNewBudget({
      category: budget.category._id,
      budget: budget.budget.toString(),
      period: budget.period,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (budget: any) => {
    setSelectedBudget(budget)
    setIsDeleteDialogOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  // Calculate budget statistics
  const budgetsWithSpending = budgets.map((budget) => ({
    ...budget,
    spent: calculateSpentAmount(budget.category._id),
  }))

  const totalBudget = budgetsWithSpending.reduce((sum, budget) => sum + budget.budget, 0)
  const totalSpent = budgetsWithSpending.reduce((sum, budget) => sum + budget.spent, 0)
  const overBudgetCount = budgetsWithSpending.filter((budget) => budget.spent > budget.budget).length
  const onTrackCount = budgetsWithSpending.filter((budget) => budget.spent <= budget.budget * 0.8).length

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground">Set and track your spending limits</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>Set a spending limit for a category.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newBudget.category}
                    onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((cat) => !budgets.some((b) => b.category._id === cat._id))
                        .map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="budget">Budget Amount</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newBudget.budget}
                    onChange={(e) => setNewBudget({ ...newBudget, budget: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="period">Period</Label>
                  <Select
                    value={newBudget.period}
                    onValueChange={(value) => setNewBudget({ ...newBudget, period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddBudget}>
                  Create Budget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">
                {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of total budget
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overBudgetCount}</div>
              <p className="text-xs text-muted-foreground">Categories over limit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Track</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onTrackCount}</div>
              <p className="text-xs text-muted-foreground">Categories under 80%</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
            <CardDescription>Track your spending against your monthly budgets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {budgetsWithSpending.map((budget) => {
              const percentage = (budget.spent / budget.budget) * 100
              const isOverBudget = percentage > 100
              const isWarning = percentage > 80 && percentage <= 100
              const remaining = budget.budget - budget.spent

              return (
                <div key={budget._id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: budget.category.color }} />
                      <div>
                        <div className="font-medium">{budget.category.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">{budget.period} budget</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isOverBudget ? "text-red-600" : "text-foreground"}`}>
                            {formatCurrency(budget.spent)}
                          </span>
                          <span className="text-muted-foreground">/ {formatCurrency(budget.budget)}</span>
                          {isOverBudget && (
                            <Badge variant="destructive" className="text-xs">
                              Over
                            </Badge>
                          )}
                          {isWarning && !isOverBudget && (
                            <Badge variant="secondary" className="text-xs">
                              Warning
                            </Badge>
                          )}
                          {percentage <= 80 && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              On Track
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(budget)}>Edit Budget</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(budget)} className="text-red-600">
                            Delete Budget
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-3"
                    style={
                      {
                        "--progress-background": isOverBudget
                          ? "#ef4444"
                          : isWarning
                            ? "#f59e0b"
                            : budget.category.color,
                      } as React.CSSProperties
                    }
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{percentage.toFixed(1)}% used</span>
                    <span
                      className={`font-medium ${
                        isOverBudget
                          ? "text-red-600"
                          : remaining < budget.budget * 0.2
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {isOverBudget
                        ? `${formatCurrency(Math.abs(remaining))} over budget`
                        : `${formatCurrency(remaining)} remaining`}
                    </span>
                  </div>
                </div>
              )
            })}

            {budgetsWithSpending.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No budgets created yet. Create your first budget to start tracking your spending!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Tips */}
        {budgetsWithSpending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Budget Tips</CardTitle>
              <CardDescription>Smart suggestions to help you stay on track</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overBudgetCount > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-800 dark:text-red-200">
                        You're over budget in {overBudgetCount} {overBudgetCount === 1 ? "category" : "categories"}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Consider reducing spending or adjusting your budget limits.
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-200">Set realistic budgets</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Base your budgets on your actual spending patterns from previous months.
                    </div>
                  </div>
                </div>
                {onTrackCount > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">
                        Great job on staying within budget!
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                        You're doing well in {onTrackCount} {onTrackCount === 1 ? "category" : "categories"}. Keep it
                        up!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Budget Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>Update the budget amount for {selectedBudget?.category?.name}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-budget">Budget Amount</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newBudget.budget}
                  onChange={(e) => setNewBudget({ ...newBudget, budget: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleEditBudget}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the budget for "
                {selectedBudget?.category?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBudget} className="bg-red-600 hover:bg-red-700">
                Delete Budget
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
