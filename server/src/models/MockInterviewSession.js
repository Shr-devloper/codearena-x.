import mongoose from "mongoose";

const mockInterviewSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, required: true, trim: true, maxlength: 200 },
    durationMinutes: { type: Number, required: true, min: 5, max: 180 },
    question: { type: String, default: "" },
    followUps: [{ type: String }],
    answer: { type: String, default: "" },
    /** Stored GROQ evaluation payload: scores, feedback, improvements, … */
    feedback: { type: mongoose.Schema.Types.Mixed, default: null },
    status: { type: String, enum: ["active", "complete"], default: "active" },
  },
  { timestamps: true, collection: "mockinterviewsessions" }
);

export const MockInterviewSession =
  mongoose.models.MockInterviewSession ||
  mongoose.model("MockInterviewSession", mockInterviewSessionSchema);
