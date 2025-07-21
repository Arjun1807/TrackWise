import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import FinancialGoal from "@/models/FinancialGoal"
import { getUserFromToken } from "@/lib/auth-helpers"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 })
    }

    // Find the goal
    const goal = await FinancialGoal.findOne({
      _id: params.id,
      user: user.id,
    })

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    // Update the goal with the new amount
    goal.current = Math.min(goal.current + amount, goal.target)
    await goal.save()

    return NextResponse.json({
      goal,
      progress: Math.round((goal.current / goal.target) * 100),
    })
  } catch (error: any) {
    console.error("Add funds error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
