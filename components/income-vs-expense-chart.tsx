"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface IncomeVsExpenseChartProps {
  expenseData: Array<{ month: string; amount: number }>
  incomeData: Array<{ month: string; amount: number }>
}

export function IncomeVsExpenseChart({ expenseData, incomeData }: IncomeVsExpenseChartProps) {
  // Combine the data
  const combinedData = expenseData.map((expense, index) => ({
    month: expense.month,
    income: incomeData[index]?.amount || 0,
    expenses: expense.amount,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
        <CardDescription>Monthly comparison of your income and expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={combinedData}>
            <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="font-medium">{label}</div>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="capitalize">{entry.dataKey}:</span>
                            <span className="font-bold">₹{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
