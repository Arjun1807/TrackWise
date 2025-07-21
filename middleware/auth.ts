import type { NextApiRequest, NextApiResponse } from "next"
import jwt from "jsonwebtoken"
import User from "../models/User"

export interface AuthRequest extends NextApiRequest {
  user?: any
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export default async function authMiddleware(req: AuthRequest, res: NextApiResponse, next: () => void) {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1]

    // Check if no token
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }

    // Add user from payload
    req.user = await User.findById(decoded.id).select("-password")

    next()
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" })
  }
}
