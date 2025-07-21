import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    const { email, password } = await req.json()

    // Check if user exists
    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 })
    }

    // Check password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 })
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    })

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        timezone: user.timezone,
        currency: user.currency,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
