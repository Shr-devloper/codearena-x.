import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    tags: [{ type: String }],
    inputFormat: { type: String, default: "" },
    outputFormat: { type: String, default: "" },
    constraints: { type: String, default: "" },
    hints: [{ type: String }],
    starterCode: {
      javascript: String,
      python: String,
      cpp: String,
    },
    testCases: [testCaseSchema],
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Problem =
  mongoose.models.Problem || mongoose.model("Problem", problemSchema);
