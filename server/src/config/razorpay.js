import Razorpay from "razorpay";
import { env, isRazorpayConfigured } from "./env.js";

let _instance;

/**
 * Lazily create Razorpay client. Only call when {@link isRazorpayConfigured} is true.
 * @returns {import("razorpay") | null}
 */
export function getRazorpay() {
  if (!isRazorpayConfigured()) {
    return null;
  }
  if (!_instance) {
    _instance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return _instance;
}

/** Pro upgrade amount in paise (e.g. 19900 = ₹199) */
export function proAmountPaise() {
  return env.RAZORPAY_PRO_AMOUNT_PAISE;
}

export function proCurrency() {
  return env.RAZORPAY_CURRENCY;
}
