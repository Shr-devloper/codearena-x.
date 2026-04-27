import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
    language: {
      type: String,
      enum: ["javascript", "python", "cpp"],
      required: true,
    },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ["AC", "WA", "TLE", "MLE", "RE", "CE", "PENDING"],
      default: "PENDING",
    },
    /** summary of last judge message (WA/CE/RE) */
    judgeMessage: { type: String },
    runtimeMs: { type: Number },
    memoryKb: { type: Number },
    judgeToken: { type: String },
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ problem: 1, user: 1, createdAt: -1 });

export const Submission =
  mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
