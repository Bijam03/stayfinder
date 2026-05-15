import { useState }                       from "react";
import { useNavigate }                    from "react-router-dom";
import toast                              from "react-hot-toast";
import { FaLock }                         from "react-icons/fa";
import {
  createOrder,
  verifyPayment,
  loadRazorpayScript,
} from "../../services/paymentService";

const PayButton = ({ booking, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const handlePayment = async () => {
    try {
      setLoading(true);

      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load payment gateway. Check your internet.");
        return;
      }

      // 2. Create order on backend
      const order = await createOrder(booking._id);

      // 3. Open Razorpay checkout
      const options = {
        key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency,
        name:        "StayFinder",
        description: `Booking for ${order.propertyName}`,
        order_id:    order.orderId,
        prefill:     order.prefill,
        theme:       { color: "#111111" },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled");
            setLoading(false);
          },
        },

        handler: async (response) => {
          try {
            // 4. Verify payment on backend
            const result = await verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              bookingId:           booking._id,
            });

            toast.success("Payment successful! Booking confirmed 🎉");
            onSuccess?.(result.booking);
            navigate("/my-bookings");
          } catch (err) {
            toast.error(
              err.response?.data?.message || "Payment verification failed"
            );
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      // Handle payment failure inside Razorpay modal
      rzp.on("payment.failed", (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

    } catch (error) {
      toast.error(error.response?.data?.message || "Payment initiation failed");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300
                 text-white font-medium py-4 rounded-2xl transition text-sm
                 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/40 border-t-white
                           rounded-full animate-spin" />
          Opening payment...
        </>
      ) : (
        <>
          <FaLock size={13} />
          Pay ₹{booking.totalPrice?.toLocaleString("en-IN")} Securely
        </>
      )}
    </button>
  );
};

export default PayButton;