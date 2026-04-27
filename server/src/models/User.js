import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    googleId: { type: String, sparse: true, unique: true },
    picture: { type: String },
    /** free | pro — aligned with app logic (Razorpay sets pro after verified payment). */
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    planActivatedAt: { type: Date, default: null },
    /** Deduplication: successful Razorpay payment ids (capped in application code). */
    razorpayPaymentIds: { type: [String], default: () => [] },
    /** Latest successful Pro purchase (for billing UI). */
    lastRazorpayPayment: {
      orderId: { type: String, default: null },
      paymentId: { type: String, default: null },
      amountPaise: { type: Number, default: null },
      currency: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },
    /** UTC date YYYY-MM-DD for daily AI usage reset */
    aiUsageDate: { type: String, default: "" },
    aiCallsToday: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function toJSON() {
  const o = this.toObject();
  delete o.passwordHash;
  return o;
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
