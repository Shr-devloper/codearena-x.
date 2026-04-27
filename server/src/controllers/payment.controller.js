import { User } from "../models/User.js";
import { env } from "../config/env.js";
import * as payment from "../services/payment.service.js";
import { getPlanUsageState } from "../services/plan.service.js";

/**
 * DEV/DEMO only — disabled unless PAYMENT_ALLOW_SIMULATED_UPGRADE=true
 */
export async function postUpgrade(req, res, next) {
  try {
    if (!env.PAYMENT_ALLOW_SIMULATED_UPGRADE) {
      return res.status(403).json({
        error: "Use Razorpay checkout to upgrade. Simulated upgrade is turned off in server/.env.",
        code: "USE_RAZORPAY",
      });
    }
    if (req.user.plan === "pro") {
      return res.json({
        success: true,
        message: "Already on Pro",
        user: { plan: "pro", planActivatedAt: req.user.planActivatedAt },
        planUsage: await getPlanUsageState(req.user._id),
      });
    }
    const user = await payment.simulateUpgradePro(req.user._id);
    res.json({
      success: true,
      message: "Upgraded to Pro (simulation)",
      user: { plan: user.plan, planActivatedAt: user.planActivatedAt, email: user.email, name: user.name },
      planUsage: await getPlanUsageState(req.user._id),
    });
  } catch (e) {
    next(e);
  }
}

export async function postCreateOrder(req, res, next) {
  try {
    if (req.user.plan === "pro") {
      return res.status(400).json({ error: "You are already on Pro", code: "ALREADY_PRO" });
    }
    const o = await payment.createProOrder(req.user._id, {
      email: req.user.email,
      name: req.user.name,
    });
    res.json({
      order_id: o.order_id,
      key_id: o.key_id,
      amount: o.amount,
      currency: o.currency,
    });
  } catch (e) {
    next(e);
  }
}

export async function postVerify(req, res, next) {
  try {
    const out = await payment.verifyProPayment(req.user._id, req.body);
    const user = await User.findById(req.user._id).select("-passwordHash");
    const planUsage = await getPlanUsageState(req.user._id);
    res.json({
      ...out,
      user: user ? { plan: user.plan, planActivatedAt: user.planActivatedAt, email: user.email, name: user.name } : null,
      planUsage,
    });
  } catch (e) {
    next(e);
  }
}

export async function getBilling(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("plan planActivatedAt lastRazorpayPayment");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(payment.getMockBillingHistory(user));
  } catch (e) {
    next(e);
  }
}

export async function getPlan(req, res, next) {
  try {
    const planUsage = await getPlanUsageState(req.user._id);
    res.json({ planUsage });
  } catch (e) {
    next(e);
  }
}
