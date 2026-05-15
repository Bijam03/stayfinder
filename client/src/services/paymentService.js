import api from "./api.js";

// Step 1 — Create order on backend
export const createOrder = async (bookingId) => {
  const { data } = await api.post("/payments/create-order", { bookingId });
  return data;
};

// Step 2 — Verify payment on backend
export const verifyPayment = async (paymentData) => {
  const { data } = await api.post("/payments/verify", paymentData);
  return data;
};

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true); // already loaded
    const script    = document.createElement("script");
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
};