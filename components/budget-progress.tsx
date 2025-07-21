"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface BudgetProgressProps {
  budgets: Array<{
    category: string
    budget: number
    spent: number
    color: string
  }>
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
        <CardDescription>Track your spending against your monthly budgets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {budgets.map((budget, index) => {
          const percentage = (budget.spent / budget.budget) * 100
          const isOverBudget = percentage > 100

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: budget.color }} />
                  <span className="font-medium">{budget.category}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${isOverBudget ? "text-red-600" : "text-foreground"}`}>
                    {formatCurrency(budget.spent)}
                  </span>
                  <span className="text-muted-foreground"> / {formatCurrency(budget.budget)}</span>
                </div>
              </div>
              <Progress
                value={Math.min(percentage, 100)}
                className="h-2"
                style={
                  {
                    "--progress-background": isOverBudget ? "#ef4444" : budget.color,
                  } as React.CSSProperties
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{percentage.toFixed(1)}% used</span>
                <span className={isOverBudget ? "text-red-600 font-medium" : ""}>
                  {isOverBudget
                    ? `${formatCurrency(budget.spent - budget.budget)} over budget`
                    : `${formatCurrency(budget.budget - budget.spent)} remaining`}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
