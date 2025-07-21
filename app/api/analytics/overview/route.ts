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
    const period = url.searchParams.get("period") || "6-months"

    // Calculate date ranges
    const now = new Date()
    let startDate: Date

    if (period === "3-months") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    } else if (period === "6-months") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    } else if (period === "1-year") {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    }

    // Get monthly trends
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user.id),
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user.id),
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    // Get expense distribution by category
    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user.id),
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          category: "$category.name",
          amount: "$total",
          color: "$category.color",
        },
      },
      {
        $sort: { amount: -1 },
      },
    ])

    // Calculate totals
    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user.id),
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ])

    const totalIncome = await Income.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user.id),
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ])

    // Format monthly data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyTrends = []

    // Create a map for easy lookup
    const expenseMap = new Map()
    const incomeMap = new Map()

    monthlyExpenses.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`
      expenseMap.set(key, item.total)
    })

    monthlyIncome.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`
      incomeMap.set(key, item.total)
    })

    // Generate data for each month in the period
    const monthsToShow = period === "3-months" ? 3 : period === "6-months" ? 6 : 12
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      const monthName = monthNames[date.getMonth()]

      const income = incomeMap.get(key) || 0
      const expenses = expenseMap.get(key) || 0

      monthlyTrends.push({
        month: monthName,
        income,
        expenses,
        savings: income - expenses,
      })
    }

    // Calculate savings rate
    const savingsRate = monthlyTrends.map((month) => ({
      month: month.month,
      rate: month.income > 0 ? Number(((month.savings / month.income) * 100).toFixed(1)) : 0,
    }))

    const currentTotalExpenses = totalExpenses.length > 0 ? totalExpenses[0].total : 0
    const currentTotalIncome = totalIncome.length > 0 ? totalIncome[0].total : 0

    return NextResponse.json({
      monthlyTrends,
      expenseDistribution: expensesByCategory.map((item) => ({
        category: item.category,
        amount: item.amount,
        color: item.color,
        percentage: currentTotalExpenses > 0 ? ((item.amount / currentTotalExpenses) * 100).toFixed(1) : "0",
      })),
      savingsRate,
      totalIncome: currentTotalIncome,
      totalExpenses: currentTotalExpenses,
      netSavings: currentTotalIncome - currentTotalExpenses,
    })
  } catch (error: any) {
    console.error("Analytics overview error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
