import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Budget from "@/models/Budget"
import { getUserFromToken } from "@/lib/auth-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const budget = await Budget.findOne({
      _id: params.id,
      user: user.id,
    }).populate("category", "name icon color")

    if (!budget) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json({ budget })
  } catch (error: any) {
    console.error("Get budget error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { budget: budgetAmount, startDate, endDate } = await req.json()

    // Find and update budget
    const budget = await Budget.findOneAndUpdate(
      { _id: params.id, user: user.id },
      {
        budget: budgetAmount,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      { new: true, runValidators: true },
    ).populate("category", "name icon color")

    if (!budget) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json({ budget })
  } catch (error: any) {
    console.error("Update budget error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const budget = await Budget.findOneAndDelete({
      _id: params.id,
      user: user.id,
    })

    if (!budget) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Budget deleted successfully" })
  } catch (error: any) {
    console.error("Delete budget error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
