import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    const { firstName, lastName, email, password } = await req.json()

    // Check if user already exists
    let user = await User.findOne({ email })

    if (user) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
    })

    await user.save()

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
      },
    })
  } catch (error: any) {
    console.error("Registration error:", error.message)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
