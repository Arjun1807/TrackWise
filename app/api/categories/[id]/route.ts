import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Category from "@/models/Category"
import { getUserFromToken } from "@/lib/auth-helpers"
import mongoose from "mongoose"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const user = await getUserFromToken(req)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const category = await Category.findOne({
      _id: params.id,
      user: user.id,
    })

    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error("Get category error:", error.message)
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

    const { name, icon, color, budget } = await req.json()

    // Find and update category
    const category = await Category.findOneAndUpdate(
      { _id: params.id, user: user.id },
      { name, icon, color, budget },
      { new: true, runValidators: true },
    )

    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error("Update category error:", error.message)
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

    // Start a session for transaction
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // Delete the category
      const category = await Category.findOneAndDelete({ _id: params.id, user: user.id }, { session })

      if (!category) {
        await session.abortTransaction()
        session.endSession()
        return NextResponse.json({ message: "Category not found" }, { status: 404 })
      }

      await session.commitTransaction()
      session.endSession()

      return NextResponse.json({ message: "Category deleted successfully" })
    } catch (error) {
      await session.abortTransaction()
      session.endSession()
      throw error
    }
  } catch (error: any) {
    console.error("Delete category error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
