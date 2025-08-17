"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface OverviewCardsProps {
  data: {
    totalExpenses: number
    totalIncome: number
    remainingBudget: number
    largestExpense: number
  }
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const cards = [
    {
      title: "Total Income",
      value: formatCurrency(data.totalIncome),
      icon: TrendingUp,
      description: "This month",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(data.totalExpenses),
      icon: TrendingDown,
      description: "This month",
    },
    {
      title: "Remaining Budget",
      value: formatCurrency(data.remainingBudget),
      icon: Wallet,
      description: "Available to spend",
    },
    {
      title: "Largest Expense",
      value: formatCurrency(data.largestExpense),
      icon: DollarSign,
      description: "This month",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-muted-foreground">
              <span>{card.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
