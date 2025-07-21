import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import FinancialGoal from "@/models/FinancialGoal"
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
    const category = url.searchParams.get("category")

    // Build query
    const query: any = { user: user.id }

    if (category) {
      query.category = category
    }

    const goals = await FinancialGoal.find(query).sort({ targetDate: 1 })

    return NextResponse.json({ goals })
  } catch (error: any) {
    console.error("Goals error:", error.message)
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

    const { name, target, icon, description, targetDate, category } = await req.json()

    // Create new goal
    const goal = new FinancialGoal({
      name,
      target,
      current: 0,
      icon,
      description,
      targetDate: new Date(targetDate),
      category,
      user: user.id,
    })

    await goal.save()

    return NextResponse.json({ goal })
  } catch (error: any) {
    console.error("Create goal error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
