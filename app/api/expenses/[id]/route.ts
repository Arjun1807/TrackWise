import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Expense from "@/models/Expense"
import Category from "@/models/Category"
import { getUserFromToken } from "@/lib/auth-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const expense = await Expense.findOne({
      _id: params.id,
      user: user.id,
    }).populate("category", "name icon color")

    if (!expense) {
      return NextResponse.json({ message: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ expense })
  } catch (error: any) {
    console.error("Get expense error:", error.message)
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

    const { description, amount, category, date, receipt, notes } = await req.json()

    // Verify category exists and belongs to user
    if (category) {
      const categoryDoc = await Category.findOne({
        _id: category,
        user: user.id,
        type: "expense",
      })

      if (!categoryDoc) {
        return NextResponse.json({ message: "Invalid category" }, { status: 400 })
      }
    }

    // Find and update expense
    const expense = await Expense.findOneAndUpdate(
      { _id: params.id, user: user.id },
      {
        description,
        amount,
        category,
        date: date ? new Date(date) : undefined,
        receipt,
        notes,
      },
      { new: true, runValidators: true },
    ).populate("category", "name icon color")

    if (!expense) {
      return NextResponse.json({ message: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ expense })
  } catch (error: any) {
    console.error("Update expense error:", error.message)
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

    const expense = await Expense.findOneAndDelete({
      _id: params.id,
      user: user.id,
    })

    if (!expense) {
      return NextResponse.json({ message: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Expense deleted successfully" })
  } catch (error: any) {
    console.error("Delete expense error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
