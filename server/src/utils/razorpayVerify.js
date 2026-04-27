import crypto from "node:crypto";

/**
 * Server-side HMAC verify for Razorpay `payment` callback fields.
 * @see https://razorpay.com/docs/webhooks/validate-razorpay-signature
 */
export function verifyRazorpayPaymentSignature(orderId, paymentId, signature, keySecret) {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(body, "utf8").digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}
