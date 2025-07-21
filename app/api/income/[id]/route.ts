import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Income from "@/models/Income"
import Category from "@/models/Category"
import { getUserFromToken } from "@/lib/auth-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const income = await Income.findOne({
      _id: params.id,
      user: user.id,
    }).populate("source", "name icon color")

    if (!income) {
      return NextResponse.json({ message: "Income not found" }, { status: 404 })
    }

    return NextResponse.json({ income })
  } catch (error: any) {
    console.error("Get income error:", error.message)
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

    const { description, amount, source, date, recurring, notes } = await req.json()

    // Verify source category exists and belongs to user
    if (source) {
      const sourceCategory = await Category.findOne({
        _id: source,
        user: user.id,
        type: "income",
      })

      if (!sourceCategory) {
        return NextResponse.json({ message: "Invalid source category" }, { status: 400 })
      }
    }

    // Find and update income
    const income = await Income.findOneAndUpdate(
      { _id: params.id, user: user.id },
      {
        description,
        amount,
        source,
        date: date ? new Date(date) : undefined,
        recurring: recurring !== undefined ? recurring : undefined,
        notes,
      },
      { new: true, runValidators: true },
    ).populate("source", "name icon color")

    if (!income) {
      return NextResponse.json({ message: "Income not found" }, { status: 404 })
    }

    return NextResponse.json({ income })
  } catch (error: any) {
    console.error("Update income error:", error.message)
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

    const income = await Income.findOneAndDelete({
      _id: params.id,
      user: user.id,
    })

    if (!income) {
      return NextResponse.json({ message: "Income not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Income deleted successfully" })
  } catch (error: any) {
    console.error("Delete income error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
