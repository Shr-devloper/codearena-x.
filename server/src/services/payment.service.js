import { User } from "../models/User.js";
import { getRazorpay, proAmountPaise, proCurrency } from "../config/razorpay.js";
import { env, isRazorpayConfigured } from "../config/env.js";
import { verifyRazorpayPaymentSignature } from "../utils/razorpayVerify.js";

const MAX_STORED_IDS = 30;

/**
 * Simulated upgrade: only for dev when PAYMENT_ALLOW_SIMULATED_UPGRADE=true.
 */
export async function simulateUpgradePro(userId) {
  const user = await User.findByIdAndUpdate(
    userId,
    { plan: "pro", planActivatedAt: new Date() },
    { new: true }
  ).select("-passwordHash");
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}

/**
 * Create a Razorpay order for Pro upgrade (amount from env, INR).
 * @param {import("mongoose").Types.ObjectId} userId
 * @param {{ email: string, name: string }} userFields
 */
export async function createProOrder(userId, userFields) {
  if (!isRazorpayConfigured()) {
    const err = new Error("Razorpay is not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)");
    err.status = 503;
    throw err;
  }
  const rzp = getRazorpay();
  if (!rzp) {
    const err = new Error("Razorpay client unavailable");
    err.status = 503;
    throw err;
  }
  const amount = proAmountPaise();
  const currency = proCurrency();
  const receipt = `cax${String(userId).slice(-8)}${Date.now().toString(36)}`.slice(0, 40);
  const order = await rzp.orders.create({
    amount,
    currency,
    receipt,
    payment_capture: 1,
    notes: {
      userId: String(userId),
      email: (userFields.email || "").slice(0, 256),
      product: "codearena_x_pro",
    },
  });
  if (!order?.id) {
    const err = new Error("Could not create payment order");
    err.status = 502;
    throw err;
  }
  return {
    order_id: order.id,
    key_id: env.RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
  };
}

/**
 * Verify signature, order ownership, then upgrade. Idempotent for duplicate client calls.
 */
export async function verifyProPayment(
  userId,
  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
) {
  if (!isRazorpayConfigured() || !env.RAZORPAY_KEY_SECRET) {
    const err = new Error("Razorpay is not configured");
    err.status = 503;
    throw err;
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    const err = new Error("razorpay_order_id, razorpay_payment_id, and razorpay_signature are required");
    err.status = 400;
    throw err;
  }

  if (
    !verifyRazorpayPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      env.RAZORPAY_KEY_SECRET
    )
  ) {
    const err = new Error("Invalid payment signature");
    err.status = 400;
    err.code = "INVALID_SIGNATURE";
    throw err;
  }

  const rzp = getRazorpay();
  const order = await rzp.orders.fetch(razorpay_order_id);
  if (String(order?.notes?.userId) !== String(userId)) {
    const err = new Error("This order is not for the signed-in account");
    err.status = 400;
    err.code = "ORDER_MISMATCH";
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (user.razorpayPaymentIds?.includes(razorpay_payment_id)) {
    return {
      success: true,
      alreadyProcessed: true,
      plan: user.plan,
      planActivatedAt: user.planActivatedAt,
    };
  }

  const paid = await rzp.payments.fetch(razorpay_payment_id);
  if (String(paid?.order_id) !== String(razorpay_order_id)) {
    const err = new Error("Payment does not match order");
    err.status = 400;
    err.code = "PAYMENT_ORDER_MISMATCH";
    throw err;
  }
  if (paid.status !== "captured" && paid.status !== "authorized") {
    const err = new Error(`Payment not complete (status: ${paid.status || "unknown"})`);
    err.status = 400;
    err.code = "PAYMENT_INCOMPLETE";
    throw err;
  }

  const now = new Date();
  const lastPayment = {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    amountPaise: paid.amount,
    currency: paid.currency || proCurrency(),
    paidAt: now,
  };

  if (user.plan === "pro") {
    const nextIds = appendPaymentId(user.razorpayPaymentIds, razorpay_payment_id);
    await User.updateOne(
      { _id: userId },
      { $set: { razorpayPaymentIds: nextIds, lastRazorpayPayment: lastPayment } }
    );
    return {
      success: true,
      alreadyPro: true,
      plan: "pro",
      planActivatedAt: user.planActivatedAt,
    };
  }

  const nextIds = appendPaymentId(user.razorpayPaymentIds, razorpay_payment_id);
  const res = await User.findOneAndUpdate(
    { _id: userId, plan: "free" },
    {
      $set: {
        plan: "pro",
        planActivatedAt: now,
        razorpayPaymentIds: nextIds,
        lastRazorpayPayment: lastPayment,
      },
    },
    { new: true }
  );

  if (!res) {
    const again = await User.findById(userId);
    if (again?.plan === "pro") {
      return { success: true, alreadyProcessed: true, plan: "pro", planActivatedAt: again.planActivatedAt };
    }
    const err = new Error("Could not update plan — try verify again in a few seconds");
    err.status = 409;
    throw err;
  }

  return {
    success: true,
    plan: "pro",
    planActivatedAt: now,
  };
}

function appendPaymentId(ids, paymentId) {
  const all = [...(ids || []), paymentId].filter((v, i, a) => a.indexOf(v) === i);
  return all.slice(-MAX_STORED_IDS);
}

const MOCK_DESCRIPTORS = [
  { desc: "Pro plan — annual (simulated)", amount: 0 },
  { desc: "Pro plan — proration credit (simulated)", amount: 0 },
  { desc: "Add-on: mentorship credits boost (simulated)", amount: 0 },
];

/**
 * Billing rows for the UI. Prepends a real Razorpay line when available.
 */
export function getMockBillingHistory(user) {
  const u = user;
  const real = u.lastRazorpayPayment?.paymentId
    ? [
        {
          id: u.lastRazorpayPayment.paymentId,
          date: (u.lastRazorpayPayment.paidAt || new Date()).toISOString(),
          amount: (u.lastRazorpayPayment.amountPaise || 0) / 100,
          currency: u.lastRazorpayPayment.currency || "INR",
          status: "paid",
          description: "CodeArena X Pro — Razorpay (verified)",
        },
      ]
    : [];
  const base = new Date();
  const simItems = [0, 1, 2].map((i) => {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i);
    const id = `sim_${u._id}_${i}`;
    return {
      id,
      date: d.toISOString(),
      amount: MOCK_DESCRIPTORS[i].amount,
      currency: "USD",
      status: "paid",
      description: `${MOCK_DESCRIPTORS[i].desc} · ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
    };
  });
  return {
    simulation: !u.lastRazorpayPayment?.paymentId,
    razorpay: Boolean(u.lastRazorpayPayment?.paymentId),
    plan: u.plan,
    planActivatedAt: u.planActivatedAt,
    invoices: [...real, ...simItems].slice(0, 5),
  };
}
