import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    // Get token from header
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ message: "No token, authorization denied" }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }

    // Get user
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        timezone: user.timezone,
        currency: user.currency,
      },
    })
  } catch (error: any) {
    console.error("Auth error:", error.message)
    return NextResponse.json({ message: "Token is not valid" }, { status: 401 })
  }
}
