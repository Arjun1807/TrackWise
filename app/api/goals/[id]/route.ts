import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import FinancialGoal from "@/models/FinancialGoal"
import { getUserFromToken } from "@/lib/auth-helpers"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const goal = await FinancialGoal.findOne({
      _id: params.id,
      user: user.id,
    })

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({ goal })
  } catch (error: any) {
    console.error("Get goal error:", error.message)
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

    const { name, target, icon, description, targetDate, category } = await req.json()

    // Find and update goal
    const goal = await FinancialGoal.findOneAndUpdate(
      { _id: params.id, user: user.id },
      {
        name,
        target,
        icon,
        description,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        category,
      },
      { new: true, runValidators: true },
    )

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({ goal })
  } catch (error: any) {
    console.error("Update goal error:", error.message)
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

    const goal = await FinancialGoal.findOneAndDelete({
      _id: params.id,
      user: user.id,
    })

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Goal deleted successfully" })
  } catch (error: any) {
    console.error("Delete goal error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
