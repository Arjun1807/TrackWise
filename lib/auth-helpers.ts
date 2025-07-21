import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import User from "@/models/User"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function getUserFromToken(req: NextRequest) {
  try {
    // Get token from header
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return null
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }

    // Get user
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      timezone: user.timezone,
      currency: user.currency,
    }
  } catch (error) {
    return null
  }
}
