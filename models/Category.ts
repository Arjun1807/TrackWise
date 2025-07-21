import mongoose, { type Document, Schema } from "mongoose"

export interface ICategory extends Document {
  name: string
  icon: string
  color: string
  type: "expense" | "income"
  budget?: number
  user: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    icon: {
      type: String,
      required: [true, "Category icon is required"],
      default: "📦",
    },
    color: {
      type: String,
      required: [true, "Category color is required"],
      default: "#8884d8",
    },
    type: {
      type: String,
      enum: ["expense", "income"],
      required: [true, "Category type is required"],
    },
    budget: {
      type: Number,
      min: 0,
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

// Create compound index for unique categories per user
CategorySchema.index({ name: 1, user: 1, type: 1 }, { unique: true })

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema)
