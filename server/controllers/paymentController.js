import crypto       from "crypto";
import razorpay     from "../config/razorpay.js";
import Booking      from "../models/Booking.js";
import Property     from "../models/Property.js";
import sendEmail    from "../utils/sendEmail.js";
import {
  bookingConfirmedGuestTemplate,
  bookingCreatedHostTemplate,
} from "../utils/emailTemplates.js";

// ══════════════════════════════════════════════════════
//  STEP 1 — Create Razorpay Order
//  POST /api/payments/create-order
// ══════════════════════════════════════════════════════
export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    // Find the pending booking
    const booking = await Booking.findById(bookingId)
      .populate("property", "title")
      .populate("guest",    "name email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only the guest who made the booking can pay
    if (booking.guest._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pay for this booking",
      });
    }

    // Only unpaid + pending bookings can be paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking is already paid",
      });
    }

    // Create Razorpay order
    // Razorpay requires amount in PAISE (1 INR = 100 paise)
    const options = {
      amount:   booking.totalPrice * 100,
      currency: "INR",
      receipt:  `receipt_${bookingId}`,
      notes: {
        bookingId:    bookingId,
        propertyName: booking.property.title,
        guestName:    booking.guest.name,
        guestEmail:   booking.guest.email,
      },
    };

    const order = await razorpay.orders.create(options);

    // Save Razorpay order ID to booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({
      success:  true,
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      bookingId,
      keyId:    process.env.RAZORPAY_KEY_ID,
      prefill: {
        name:    booking.guest.name,
        email:   booking.guest.email,
        contact: booking.guest.phone || "",
      },
      propertyName: booking.property.title,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
//  STEP 2 — Verify Payment & Confirm Booking
//  POST /api/payments/verify
// ══════════════════════════════════════════════════════
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id ||
        !razorpay_signature || !bookingId) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    // ── Verify signature (HMAC SHA256) ──────────────────
    const body      = razorpay_order_id + "|" + razorpay_payment_id;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success:  false,
        message:  "Payment verification failed. Invalid signature.",
      });
    }

    // ── Signature valid — update booking ─────────────────
    const booking = await Booking.findById(bookingId)
      .populate("guest",    "name email phone")
      .populate("host",     "name email")
      .populate("property", "title location");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.paymentStatus    = "paid";
    booking.paymentId        = razorpay_payment_id;
    booking.razorpayOrderId  = razorpay_order_id;
    booking.paidAt           = new Date();
    booking.status           = "confirmed"; // ✅ Auto-confirm on payment
    await booking.save();

    // ── Send confirmation emails ─────────────────────────
    const emailData = {
      booking,
      guest:    booking.guest,
      property: booking.property,
    };

    // To Guest — booking confirmed + paid
    sendEmail({
      to:      booking.guest.email,
      subject: `Booking Confirmed & Payment Successful – ${booking.property.title}`,
      html:    bookingConfirmedGuestTemplate(emailData),
    });

    // To Host — new confirmed booking received
    sendEmail({
      to:      booking.host.email,
      subject: `New Confirmed Booking – ${booking.property.title}`,
      html:    bookingCreatedHostTemplate(emailData),
    });

    res.status(200).json({
      success: true,
      message: "Payment verified! Booking confirmed successfully.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════
//  GET Payment status for a booking
//  GET /api/payments/status/:bookingId
// ══════════════════════════════════════════════════════
export const getPaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .select("paymentStatus paymentId paidAt totalPrice status");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};