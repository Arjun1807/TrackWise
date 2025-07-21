import mongoose, { type Document, Schema } from "mongoose"

export interface IBudget extends Document {
  category: mongoose.Types.ObjectId
  budget: number
  period: "weekly" | "monthly" | "yearly"
  startDate: Date
  endDate?: Date
  user: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BudgetSchema = new Schema<IBudget>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    budget: {
      type: Number,
      required: [true, "Budget amount is required"],
      min: [0, "Budget must be positive"],
    },
    period: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      default: "monthly",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now,
    },
    endDate: {
      type: Date,
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

// Create compound index for unique budgets per user and category
BudgetSchema.index({ user: 1, category: 1, period: 1 }, { unique: true })

export default mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema)
