import mongoose, { type Document, Schema } from "mongoose"

export interface IExpense extends Document {
  description: string
  amount: number
  category: mongoose.Types.ObjectId
  date: Date
  receipt?: string
  notes?: string
  user: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    receipt: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
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

// Create indexes for common queries
ExpenseSchema.index({ user: 1, date: -1 })
ExpenseSchema.index({ user: 1, category: 1 })

export default mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema)
