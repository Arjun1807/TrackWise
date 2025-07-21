import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Budget from "@/models/Budget"
import Category from "@/models/Category"
import { getUserFromToken } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const period = url.searchParams.get("period")

    // Build query
    const query: any = { user: user.id }

    if (period && ["weekly", "monthly", "yearly"].includes(period)) {
      query.period = period
    }

    // Get budgets with category details
    const budgets = await Budget.find(query).populate("category", "name icon color")

    return NextResponse.json({ budgets })
  } catch (error: any) {
    console.error("Budgets error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { category, budget, period, startDate, endDate } = await req.json()

    // Verify category exists and belongs to user
    const categoryDoc = await Category.findOne({
      _id: category,
      user: user.id,
      type: "expense",
    })

    if (!categoryDoc) {
      return NextResponse.json({ message: "Invalid category" }, { status: 400 })
    }

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      category,
      period,
      user: user.id,
    })

    if (existingBudget) {
      return NextResponse.json({ message: "Budget already exists for this category and period" }, { status: 400 })
    }

    // Create new budget
    const newBudget = new Budget({
      category,
      budget,
      period,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      user: user.id,
    })

    await newBudget.save()

    // Populate category details
    await newBudget.populate("category", "name icon color")

    return NextResponse.json({ budget: newBudget })
  } catch (error: any) {
    console.error("Create budget error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
