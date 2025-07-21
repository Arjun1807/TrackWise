"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { useData } from "@/contexts/DataContext"

export default function ReportsPage() {
  const [reportData, setReportData] = useState({
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      expenseGrowth: 0,
      incomeGrowth: 0,
      savingsRate: 0,
    },
    monthlyBreakdown: [],
    topExpenseCategories: [],
    transactions: {
      expenses: [],
      income: [],
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { refreshTrigger } = useData()
  const [selectedPeriod, setSelectedPeriod] = useState("last-3-months")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -90),
    to: new Date(),
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query params for date range
      const params = new URLSearchParams()
      if (selectedPeriod === "custom" && dateRange?.from && dateRange?.to) {
        params.append("startDate", dateRange.from.toISOString())
        params.append("endDate", dateRange.to.toISOString())
      } else {
        // Calculate date range based on selected period
        const now = new Date()
        const startDate = new Date()

        switch (selectedPeriod) {
          case "last-month":
            startDate.setMonth(now.getMonth() - 1)
            break
          case "last-3-months":
            startDate.setMonth(now.getMonth() - 3)
            break
          case "last-6-months":
            startDate.setMonth(now.getMonth() - 6)
            break
          case "last-year":
            startDate.setFullYear(now.getFullYear() - 1)
            break
          default:
            startDate.setMonth(now.getMonth() - 3) // Default to 3 months
        }

        params.append("startDate", startDate.toISOString())
        params.append("endDate", now.toISOString())
      }

      const token = localStorage.getItem("token")
      const response = await fetch(`/api/reports?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch report data")
      }

      const data = await response.json()
      setReportData(data)
    } catch (err) {
      setError("Failed to load report data")
      console.error("Error fetching report data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [refreshTrigger, selectedPeriod, dateRange])

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams()
      params.append("format", "csv")

      if (selectedPeriod === "custom" && dateRange?.from && dateRange?.to) {
        params.append("startDate", dateRange.from.toISOString())
        params.append("endDate", dateRange.to.toISOString())
      } else {
        const now = new Date()
        const startDate = new Date()

        switch (selectedPeriod) {
          case "last-month":
            startDate.setMonth(now.getMonth() - 1)
            break
          case "last-3-months":
            startDate.setMonth(now.getMonth() - 3)
            break
          case "last-6-months":
            startDate.setMonth(now.getMonth() - 6)
            break
          case "last-year":
            startDate.setFullYear(now.getFullYear() - 1)
            break
          default:
            startDate.setMonth(now.getMonth() - 3)
        }

        params.append("startDate", startDate.toISOString())
        params.append("endDate", now.toISOString())
      }

      const token = localStorage.getItem("token")
      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to export CSV")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `financial-report-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting CSV:", error)
      setError("Failed to export CSV file")
    }
  }

  const handleExportPDF = async () => {
    try {
      // Generate PDF content using the browser's print functionality
      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Financial Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .summary-card h3 { margin: 0 0 10px 0; color: #333; }
            .summary-card .amount { font-size: 24px; font-weight: bold; }
            .income { color: #22c55e; }
            .expense { color: #ef4444; }
            .savings { color: #3b82f6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .category-list { margin-bottom: 30px; }
            .category-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Financial Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>Period: ${
              selectedPeriod === "custom" && dateRange?.from && dateRange?.to
                ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                : selectedPeriod.replace("-", " ")
            }</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>Total Income</h3>
              <div class="amount income">${formatCurrency(reportData.summary.totalIncome)}</div>
              <small>Growth: ${reportData.summary.incomeGrowth}%</small>
            </div>
            <div class="summary-card">
              <h3>Total Expenses</h3>
              <div class="amount expense">${formatCurrency(reportData.summary.totalExpenses)}</div>
              <small>Growth: ${reportData.summary.expenseGrowth}%</small>
            </div>
            <div class="summary-card">
              <h3>Net Savings</h3>
              <div class="amount savings">${formatCurrency(reportData.summary.netSavings)}</div>
              <small>Savings Rate: ${reportData.summary.savingsRate}%</small>
            </div>
          </div>

          <h2>Monthly Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Savings</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.monthlyBreakdown
                .map(
                  (month: any) => `
                <tr>
                  <td>${month.month}</td>
                  <td class="income">${formatCurrency(month.income)}</td>
                  <td class="expense">${formatCurrency(month.expenses)}</td>
                  <td class="savings">${formatCurrency(month.savings)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <h2>Top Expense Categories</h2>
          <div class="category-list">
            ${reportData.topExpenseCategories
              .map(
                (category: any, index: number) => `
              <div class="category-item">
                <span>${index + 1}. ${category.category}</span>
                <span>${formatCurrency(category.amount)} (${category.percentage}%)</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setError("Failed to generate PDF")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading report data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={fetchReportData} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Detailed insights into your financial activity</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Report Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Period:</span>
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                    <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedPeriod === "custom" && <DatePickerWithRange date={dateRange} setDate={setDateRange} />}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.totalIncome)}</div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">vs last period</span>
                <span
                  className={`font-medium ${reportData.summary.incomeGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {reportData.summary.incomeGrowth >= 0 ? "+" : ""}
                  {reportData.summary.incomeGrowth}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(reportData.summary.totalExpenses)}</div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">vs last period</span>
                <span
                  className={`font-medium ${reportData.summary.expenseGrowth <= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {reportData.summary.expenseGrowth >= 0 ? "+" : ""}
                  {reportData.summary.expenseGrowth}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.summary.netSavings)}</div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">Savings rate:</span>
                <span className="font-medium text-blue-600">{reportData.summary.savingsRate}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Income, expenses, and savings by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.monthlyBreakdown.map((month: any, index: number) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 rounded-lg border bg-card">
                  <div>
                    <div className="font-medium">{month.month}</div>
                    <div className="text-sm text-muted-foreground">Month</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600">{formatCurrency(month.income)}</div>
                    <div className="text-sm text-muted-foreground">Income</div>
                  </div>
                  <div>
                    <div className="font-bold text-red-600">{formatCurrency(month.expenses)}</div>
                    <div className="text-sm text-muted-foreground">Expenses</div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-600">{formatCurrency(month.savings)}</div>
                    <div className="text-sm text-muted-foreground">Savings</div>
                  </div>
                </div>
              ))}
              {reportData.monthlyBreakdown.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No data available for the selected period.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
            <CardDescription>Your highest spending categories this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topExpenseCategories.map((category: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{category.category}</div>
                      <div className="text-sm text-muted-foreground">{category.percentage}% of total expenses</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(category.amount)}</div>
                  </div>
                </div>
              ))}
              {reportData.topExpenseCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No expense categories found for the selected period.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
