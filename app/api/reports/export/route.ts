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
    const format = url.searchParams.get("format") || "csv"
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")

    const dateFilter: any = { user: new mongoose.Types.ObjectId(user.id) }
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    // Fetch all transactions
    const [expenses, income] = await Promise.all([
      Expense.find(dateFilter).populate("category", "name").sort({ date: -1 }),
      Income.find(dateFilter).populate("source", "name").sort({ date: -1 }),
    ])

    if (format === "csv") {
      // Generate CSV
      const csvHeaders = "Date,Type,Description,Category,Amount\n"

      const expenseRows = expenses
        .map(
          (exp) =>
            `${exp.date.toISOString().split("T")[0]},Expense,"${exp.description}","${exp.category?.name || "Other"}",${exp.amount}`,
        )
        .join("\n")

      const incomeRows = income
        .map(
          (inc) =>
            `${inc.date.toISOString().split("T")[0]},Income,"${inc.description}","${inc.source?.name || "Other"}",${inc.amount}`,
        )
        .join("\n")

      const csvContent = csvHeaders + expenseRows + (expenseRows && incomeRows ? "\n" : "") + incomeRows

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="financial-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // For PDF, return JSON data that frontend can use to generate PDF
    return NextResponse.json({
      expenses: expenses.map((exp) => ({
        date: exp.date,
        description: exp.description,
        category: exp.category?.name || "Other",
        amount: exp.amount,
        type: "expense",
      })),
      income: income.map((inc) => ({
        date: inc.date,
        description: inc.description,
        category: inc.source?.name || "Other",
        amount: inc.amount,
        type: "income",
      })),
      summary: {
        totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        totalIncome: income.reduce((sum, inc) => sum + inc.amount, 0),
        totalTransactions: expenses.length + income.length,
        dateRange: { start: startDate, end: endDate },
      },
    })
  } catch (error: any) {
    console.error("Export error:", error)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
