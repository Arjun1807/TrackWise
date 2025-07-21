import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
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
    const type = url.searchParams.get("type")

    // Build query
    const query: any = { user: user.id }
    if (type && ["expense", "income"].includes(type)) {
      query.type = type
    }

    const categories = await Category.find(query).sort({ name: 1 })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("Categories error:", error.message)
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

    const { name, icon, color, type, budget } = await req.json()

    // Check if category already exists for this user
    const existingCategory = await Category.findOne({
      name,
      user: user.id,
      type,
    })

    if (existingCategory) {
      return NextResponse.json({ message: "Category already exists" }, { status: 400 })
    }

    // Create new category
    const category = new Category({
      name,
      icon,
      color,
      type,
      budget: type === "expense" ? budget : undefined,
      user: user.id,
    })

    await category.save()

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error("Create category error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
