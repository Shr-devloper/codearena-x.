/**
 * Loads https://checkout.razorpay.com/v1/checkout.js once.
 * @returns {Promise<void>}
 */
export function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if (window.Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-checkout="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.dataset.razorpayCheckout = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay checkout"));
    document.body.appendChild(s);
  });
}
