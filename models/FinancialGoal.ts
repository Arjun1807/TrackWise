import mongoose, { type Document, Schema } from "mongoose"

export interface IFinancialGoal extends Document {
  name: string
  target: number
  current: number
  icon: string
  description?: string
  targetDate: Date
  category: string
  user: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const FinancialGoalSchema = new Schema<IFinancialGoal>(
  {
    name: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
    },
    target: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [0, "Target must be positive"],
    },
    current: {
      type: Number,
      default: 0,
      min: 0,
    },
    icon: {
      type: String,
      default: "🎯",
    },
    description: {
      type: String,
      trim: true,
    },
    targetDate: {
      type: Date,
      required: [true, "Target date is required"],
    },
    category: {
      type: String,
      required: [true, "Goal category is required"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
  },
  {
    timestamps: true,
  },
)

// Create index for user's goals
FinancialGoalSchema.index({ user: 1 })

export default mongoose.models.FinancialGoal || mongoose.model<IFinancialGoal>("FinancialGoal", FinancialGoalSchema)
