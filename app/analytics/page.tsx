"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, BarChart3, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useData } from "@/contexts/DataContext"

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("6-months")
  const [selectedMetric, setSelectedMetric] = useState("overview")
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const { refreshTrigger } = useData()

  useEffect(() => {
    fetchAnalyticsData()
  }, [refreshTrigger, selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      const response = await fetch(`/api/analytics/overview?period=${selectedPeriod}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }

      const data = await response.json()
      setAnalyticsData(data)
    } catch (error: any) {
      console.error("Failed to fetch analytics data:", error)
      setError(error.message || "Failed to load analytics data")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
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
            <Button onClick={fetchAnalyticsData}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!analyticsData) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p>No analytics data available</p>
        </div>
      </DashboardLayout>
    )
  }

  const currentMonth = analyticsData.monthlyTrends[analyticsData.monthlyTrends.length - 1] || {
    income: 0,
    expenses: 0,
    savings: 0,
  }
  const previousMonth = analyticsData.monthlyTrends[analyticsData.monthlyTrends.length - 2] || {
    income: 0,
    expenses: 0,
    savings: 0,
  }

  const incomeChange =
    previousMonth.income > 0 ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100 : 0
  const expenseChange =
    previousMonth.expenses > 0 ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100 : 0
  const savingsChange =
    previousMonth.savings > 0 ? ((currentMonth.savings - previousMonth.savings) / previousMonth.savings) * 100 : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Deep insights into your financial patterns and trends</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3-months">3 Months</SelectItem>
                <SelectItem value="6-months">6 Months</SelectItem>
                <SelectItem value="1-year">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[140px]">
                <BarChart3 className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="categories">Categories</SelectItem>
                <SelectItem value="trends">Trends</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonth.income)}</div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">vs last month</span>
                <span className={`font-medium ${incomeChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {incomeChange >= 0 ? "+" : ""}
                  {incomeChange.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonth.expenses)}</div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">vs last month</span>
                <span className={`font-medium ${expenseChange <= 0 ? "text-green-600" : "text-red-600"}`}>
                  {expenseChange >= 0 ? "+" : ""}
                  {expenseChange.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonth.savings)}</div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">vs last month</span>
                <span className={`font-medium ${savingsChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {savingsChange >= 0 ? "+" : ""}
                  {savingsChange.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentMonth.income > 0 ? ((currentMonth.savings / currentMonth.income) * 100).toFixed(1) : 0}%
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">Target: 20%</span>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  {currentMonth.income > 0 && (currentMonth.savings / currentMonth.income) * 100 >= 20
                    ? "Above Target"
                    : "Below Target"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Income vs Expenses Trend */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Financial Trends</CardTitle>
              <CardDescription>Income, expenses, and savings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.monthlyTrends}>
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
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stackId="3"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
              <CardDescription>Current period spending breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.expenseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {analyticsData.expenseDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-1">
                              <div className="font-medium">{data.category}</div>
                              <div className="text-sm">
                                {formatCurrency(data.amount)} ({data.percentage}%)
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {analyticsData.expenseDistribution.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.category}</span>
                    <span className="ml-auto font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Savings Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Savings Rate Trend</CardTitle>
              <CardDescription>Monthly savings rate percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.savingsRate}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-1">
                              <div className="font-medium">{label}</div>
                              <div className="text-sm">Savings Rate: {payload[0].value}%</div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
