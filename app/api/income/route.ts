import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Income from "@/models/Income"
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
    const sourceId = url.searchParams.get("source")
    const recurring = url.searchParams.get("recurring")
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

    if (sourceId) {
      query.source = sourceId
    }

    if (recurring === "true") {
      query.recurring = true
    } else if (recurring === "false") {
      query.recurring = false
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get income with source details
    const incomeItems = await Income.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("source", "name icon color")

    // Get total count for pagination
    const total = await Income.countDocuments(query)

    return NextResponse.json({
      income: incomeItems,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Income error:", error.message)
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

    const { description, amount, source, date, recurring, notes } = await req.json()

    // Verify source category exists and belongs to user
    const sourceCategory = await Category.findOne({
      _id: source,
      user: user.id,
      type: "income",
    })

    if (!sourceCategory) {
      return NextResponse.json({ message: "Invalid source category" }, { status: 400 })
    }

    // Create new income
    const income = new Income({
      description,
      amount,
      source,
      date: new Date(date),
      recurring: !!recurring,
      notes,
      user: user.id,
    })

    await income.save()

    // Populate source details
    await income.populate("source", "name icon color")

    return NextResponse.json({ income })
  } catch (error: any) {
    console.error("Create income error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
