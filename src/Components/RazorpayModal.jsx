import { useState, useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/react";
import toast from "react-hot-toast";
import { ShieldCheckIcon, XIcon } from "lucide-react";
import { API_BASE } from "../lib/config";

// ─────────────────────────────────────────────────────────────────────────────
//  RazorpayModal
//
//  Opens the Razorpay checkout popup DIRECTLY when mounted — no intermediate
//  method-selector page. The Razorpay popup itself shows all payment methods:
//  UPI, Cards (Credit/Debit), Net Banking, Wallets, EMI, Pay Later.
//
//  Flow:
//  1. Modal mounts → auto-calls startPayment()
//  2. POST /api/razorpay/create-order  (Clerk JWT required)
//  3. Razorpay popup opens immediately with all payment methods
//  4. User pays inside Razorpay popup
//  5. handler() fires → POST /api/razorpay/verify-payment  (NO JWT)
//  6. onSuccess(method, paymentId) → Payment.jsx saves booking
// ─────────────────────────────────────────────────────────────────────────────

function RazorpayModal({ totalPrice, movieTitle, onClose, onSuccess }) {
  const { getToken } = useAuth();
  const { user }     = useUser();

  // step: loading | done | error
  const [step,    setStep]    = useState("loading");
  const [errMsg,  setErrMsg]  = useState("");
  const hasStarted            = useRef(false); // prevent double-fire in React StrictMode

  // ── Load Razorpay checkout.js ──────────────────────────────────────────────
  const loadSDK = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(); return; }
      const s    = document.createElement("script");
      s.src      = "https://checkout.razorpay.com/v1/checkout.js";
      s.async    = true;
      s.onload   = resolve;
      s.onerror  = () => reject(new Error("Failed to load Razorpay SDK — check internet"));
      document.body.appendChild(s);
    });

  // ── Poll until window.Razorpay is available ────────────────────────────────
  const waitForSDK = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(); return; }
      let n = 0;
      const t = setInterval(() => {
        n++;
        if (window.Razorpay) { clearInterval(t); resolve(); }
        else if (n > 20)     { clearInterval(t); reject(new Error("Razorpay SDK timeout")); }
      }, 300);
    });

  // ── Full payment flow ──────────────────────────────────────────────────────
  const startPayment = async () => {
    setStep("loading");
    setErrMsg("");

    try {
      // 1. Get Clerk token
      const token     = await getToken();
      const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
      const userName  = user?.fullName ?? user?.firstName ?? "Customer";
      const userId    = user?.id ?? "unknown";

      if (!token) throw new Error("Not signed in — please log in and try again.");

      // 2. Create Razorpay order on backend
      const orderRes = await fetch(`${API_BASE}/api/razorpay/create-order`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount:   Math.round(totalPrice * 100), // ₹ → paise
          currency: "INR",
          receipt:  `rcpt_${Date.now()}`,
          notes:    { userId, userEmail, movieTitle },
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.text();
        throw new Error(`Order creation failed (${orderRes.status}): ${err}`);
      }

      const { orderId, amount, currency, keyId } = await orderRes.json();
      console.log("✅ Razorpay order:", orderId);

      // 3. Ensure SDK is ready
      await loadSDK();
      await waitForSDK();

      // 4. Open Razorpay popup directly
      //    All payment methods (UPI, Card, NetBanking, Wallet, EMI) are shown
      //    natively by Razorpay — we don't need to configure them.
      const options = {
        key:         keyId,
        amount,                    // in paise (from server)
        currency,                  // "INR"
        order_id:    orderId,
        name:        "TixRush",
        description: movieTitle,

        // Pre-fill user info so Razorpay can show it in the popup
        prefill: {
          name:  userName,
          email: userEmail,
        },

        theme: { color: "#e8b86d" }, // TixRush gold

        // ── Called when user successfully pays ─────────────────────────────
        handler: async (razorpayResponse) => {
          console.log("💳 Payment done:", {
            paymentId: razorpayResponse.razorpay_payment_id,
            orderId:   razorpayResponse.razorpay_order_id,
          });

          setStep("loading");

          try {
            // 5. Verify HMAC-SHA256 signature on backend
            //    NO Authorization header — HMAC signature IS the proof
            const verifyRes = await fetch(`${API_BASE}/api/razorpay/verify-payment`, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId:   razorpayResponse.razorpay_order_id,
                razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                razorpaySignature: razorpayResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || "Payment verification failed");
            }

            // 6. All good — hand off to Payment.jsx
            setStep("done");
            toast.success("Payment verified! ✅");

            // Payment method comes back from Razorpay in test mode as undefined,
            // so we use a sensible default
            const payMethod = razorpayResponse.razorpay_payment_method ?? "ONLINE";

            setTimeout(() => {
              onSuccess(payMethod, razorpayResponse.razorpay_payment_id);
            }, 800);

          } catch (err) {
            console.error("❌ Verify error:", err.message);
            setStep("error");
            setErrMsg(err.message);
            toast.error("Verification failed: " + err.message);
          }
        },

        // ── User dismisses / closes the Razorpay popup ──────────────────────
        modal: {
          ondismiss: () => {
            console.log("ℹ️ Razorpay popup closed");
            setStep("loading"); // reset so retry works
            toast("Payment cancelled", { icon: "ℹ️" });
            onClose();           // close our wrapper modal too
          },
          animation:     true,
          backdropclose: false,  // don't close on outside click
          confirm_close: true,   // show "are you sure?" before closing
        },
      };

      const rzp = new window.Razorpay(options);

      // ── Payment failure (e.g. wrong card, UPI timeout) ───────────────────
      rzp.on("payment.failed", (res) => {
        console.error("❌ Payment failed:", res.error);
        toast.error(res.error?.description ?? "Payment failed — please try again.");
        setStep("error");
        setErrMsg(res.error?.description ?? "Payment failed");
      });

      // Open the popup — this is where the user sees UPI / Card / NetBanking etc.
      rzp.open();

    } catch (err) {
      console.error("❌ startPayment error:", err.message);
      setStep("error");
      setErrMsg(err.message);
      toast.error(err.message || "Could not start payment. Please try again.");
    }
  };

  // ── Auto-start when modal mounts ───────────────────────────────────────────
  useEffect(() => {
    if (hasStarted.current) return; // StrictMode guard
    hasStarted.current = true;
    startPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────
  //  RENDER — just a small status overlay while
  //  Razorpay popup is doing its thing
  // ─────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/80 backdrop-blur-sm"
      // Don't close on backdrop click while popup may be open
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#141824] border border-primary/30 rounded-2xl
                      w-full max-w-sm mx-4 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-primary/20 bg-primary/10">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-green-400" />
            <span className="text-white font-semibold text-sm">Secure Checkout</span>
          </div>
          {/* Only show close on error — don't let them close mid-payment */}
          {step === "error" && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-8 flex flex-col items-center gap-5 min-h-48">

          {/* Amount */}
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Amount</p>
            <p className="text-3xl font-bold text-white">
              ₹{totalPrice.toLocaleString("en-IN")}
            </p>
            <p className="text-gray-500 text-xs mt-1 max-w-xs truncate">{movieTitle}</p>
          </div>

          {/* Status area */}
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent
                              rounded-full animate-spin" />
              <p className="text-gray-300 text-sm">Opening Razorpay…</p>
              <p className="text-gray-500 text-xs text-center">
                The payment window will open automatically
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-500/20 border-2
                              border-green-500/60 flex items-center justify-center">
                <ShieldCheckIcon className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-green-400 font-bold text-lg">Payment Successful!</p>
              <p className="text-gray-500 text-xs">Saving your booking…</p>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/20 border-2
                              border-red-500/40 flex items-center justify-center">
                <XIcon className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-red-400 font-semibold">Payment Failed</p>
              {errMsg && (
                <p className="text-gray-500 text-xs max-w-xs">{errMsg}</p>
              )}
              <button
                onClick={startPayment}
                className="mt-2 px-6 py-2.5 bg-primary hover:bg-primary-dull
                           text-white text-sm font-semibold rounded-full
                           transition cursor-pointer active:scale-95"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Security note */}
          <p className="text-gray-600 text-xs flex items-center gap-1.5 mt-auto">
            <ShieldCheckIcon className="w-3 h-3 text-green-500" />
            Secured by Razorpay · 256-bit SSL
          </p>
        </div>
      </div>
    </div>
  );
}

export default RazorpayModal;