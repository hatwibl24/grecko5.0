import React, { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Loader2, AlertCircle, CheckCircle2, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentButtonsProps {
  courseId: string;
  userId: string;
  price: number | string; 
  onSuccess?: () => void;
}

export const PaymentButtons: React.FC<PaymentButtonsProps> = ({ courseId, userId, price, onSuccess }) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Ensure price is a number for toFixed
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  const handleApprove = async (orderID: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("You must be logged in to make a purchase.");
      }

      // 2. Call the backend with the Authorization header
      // If orderID is "FREE", the backend will skip PayPal verification
      const res = await fetch(
        "https://uopitdnufrnxkhhhdtxk.supabase.co/functions/v1/verify-payment",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ orderID, courseId, userId }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment verification failed");
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  // If successfully purchased/enrolled, show success state immediately
  if (success) {
    return (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Course unlocked successfully!</span>
        </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      
      {/* 1. FREE COURSE LOGIC ($0.00) */}
      {numericPrice === 0 ? (
        <button
            onClick={() => handleApprove("FREE")}
            disabled={loading}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? (
                <> <Loader2 className="w-5 h-5 animate-spin" /> Enrolling... </>
            ) : (
                <> <Gift className="w-5 h-5" /> Enroll for Free </>
            )}
        </button>
      ) : (
        /* 2. PAID COURSE LOGIC (PayPal) */
        <>
            {/* Show loader while PayPal script is loading */}
            {(isPending || loading) && (
                <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
            )}

            {/* PayPal Buttons */}
            {!loading && (
                <PayPalButtons
                style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                createOrder={(data, actions) => {
                    return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                        {
                        amount: { 
                            currency_code: "USD",
                            value: numericPrice.toFixed(2) 
                        },
                        description: `Course ID: ${courseId}`
                        },
                    ],
                    });
                }}
                onApprove={async (data, actions) => {
                    // Capture the order first
                    if (actions.order) await actions.order.capture();
                    // Then verify with backend using the order ID
                    if (data.orderID) await handleApprove(data.orderID);
                }}
                onCancel={() => {
                    console.log("Payment Cancelled by user");
                    setLoading(false);
                }}
                onError={(err: any) => {
                    console.error("PayPal Button Error:", err);
                    const msg = err?.message || "PayPal encountered an error. Please try again.";
                    setError(msg);
                    setLoading(false);
                }}
                fundingSource={undefined} 
                />
            )}
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default PaymentButtons;