import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Loader2, ShieldCheck, X } from "lucide-react";
import api from "../../services/api.js";
import { loadRazorpayScript } from "../../lib/loadRazorpay.js";
import GradientButton from "../ui/GradientButton.jsx";

/**
 * Opens Razorpay Checkout (test mode with rzp_test_* keys), then verifies on the server.
 */
export default function RazorpayCheckoutModal({
  open,
  onClose,
  userName,
  userEmail,
  onSuccess,
  onError,
}) {
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState("");

  async function startPay() {
    setLocalErr("");
    setBusy(true);
    try {
      await loadRazorpayScript();
      const { data: order } = await api.post("/payment/create-order");
      const key = order.key_id;
      if (!key || !order.order_id) {
        throw new Error("Server did not return a valid order");
      }

      const options = {
        key,
        order_id: order.order_id,
        currency: order.currency || "INR",
        name: "CodeArena X",
        description: "Pro plan — monthly guidance & limits",
        image: undefined,
        handler: async (response) => {
          setBusy(true);
          try {
            const { data } = await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onSuccess?.(data);
          } catch (e) {
            const msg = e.response?.data?.error || e.message || "Verification failed";
            onError?.(msg);
          } finally {
            setBusy(false);
          }
        },
        prefill: {
          name: userName || "",
          email: userEmail || "",
        },
        theme: { color: "#7c3aed" },
        modal: {
          ondismiss: () => {
            setBusy(false);
          },
        },
      };

      const inst = new window.Razorpay(options);
      inst.on("payment.failed", (res) => {
        const desc = res?.error?.description || res?.error?.reason || "Payment did not go through";
        onError?.(desc);
        setBusy(false);
      });
      inst.open();
      setBusy(false);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Could not start checkout";
      setLocalErr(msg);
      onError?.(msg);
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="glass-panel-strong relative z-10 w-full max-w-md overflow-hidden border border-violet-500/25 shadow-glow"
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-violet-600/20 to-cyan-600/10 px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">Upgrade</p>
                  <h2 className="font-display text-lg font-semibold text-white">CodeArena X Pro</h2>
                  <p className="mt-1 text-sm text-slate-400">Secure checkout via Razorpay (test mode with test keys).</p>
                </div>
                <button type="button" onClick={onClose} className="btn-ghost p-1" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-end justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div>
                  <p className="text-xs text-slate-500">Due today</p>
                  <p className="font-display text-3xl font-bold text-white">
                    ₹199 <span className="text-base font-normal text-slate-500">INR</span>
                  </p>
                </div>
                <ShieldCheck className="h-8 w-8 text-emerald-400/80" />
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2">
                  <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                  After success, your account is upgraded only after the server verifies the signature — never from the browser alone.
                </li>
                <li className="flex gap-2">
                  <span className="text-slate-600">Test card:</span> 4111 1111 1111 1111 · any future expiry · CVV 123
                </li>
              </ul>
              {localErr && <p className="text-sm text-rose-400">{localErr}</p>}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={onClose} className="btn-ghost order-2 sm:order-1">
                  Not now
                </button>
                <GradientButton
                  type="button"
                  className="order-1 w-full sm:order-2 sm:w-auto"
                  onClick={startPay}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Pay with Razorpay
                </GradientButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
