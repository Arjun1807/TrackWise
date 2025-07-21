import mongoose, { type Document, Schema } from "mongoose"

export interface IIncome extends Document {
  description: string
  amount: number
  source: mongoose.Types.ObjectId // References Category
  date: Date
  recurring: boolean
  notes?: string
  user: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const IncomeSchema = new Schema<IIncome>(
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
    source: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Source category is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    recurring: {
      type: Boolean,
      default: false,
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
IncomeSchema.index({ user: 1, date: -1 })
IncomeSchema.index({ user: 1, source: 1 })
IncomeSchema.index({ user: 1, recurring: 1 })

export default mongoose.models.Income || mongoose.model<IIncome>("Income", IncomeSchema)
