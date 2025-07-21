import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Expense from "@/models/Expense"
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
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const categoryId = url.searchParams.get("category")
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const page = Number.parseInt(url.searchParams.get("page") || "1")

    // Build query
    const query: any = { user: user.id }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) }
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) }
    }

    if (categoryId) {
      query.category = categoryId
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get expenses with category details
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name icon color")

    // Get total count for pagination
    const total = await Expense.countDocuments(query)

    return NextResponse.json({
      expenses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Expenses error:", error.message)
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

    const { description, amount, category, date, receipt, notes } = await req.json()

    // Verify category exists and belongs to user
    const categoryDoc = await Category.findOne({
      _id: category,
      user: user.id,
      type: "expense",
    })

    if (!categoryDoc) {
      return NextResponse.json({ message: "Invalid category" }, { status: 400 })
    }

    // Create new expense
    const expense = new Expense({
      description,
      amount,
      category,
      date: new Date(date),
      receipt,
      notes,
      user: user.id,
    })

    await expense.save()

    // Populate category details
    await expense.populate("category", "name icon color")

    return NextResponse.json({ expense })
  } catch (error: any) {
    console.error("Create expense error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
