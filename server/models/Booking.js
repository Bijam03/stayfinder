import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // Which property is being booked
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
    },

    // Who is making the booking
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guest is required"],
    },

    // Who owns the property
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host is required"],
    },

    checkIn: {
      type: Date,
      required: [true, "Check-in date is required"],
    },

    checkOut: {
      type: Date,
      required: [true, "Check-out date is required"],
    },

    // Number of nights = calculated automatically
    numNights: {
      type: Number,
      required: true,
    },

    // Number of guests staying
    numGuests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "At least 1 guest required"],
    },

    // Price per night at time of booking
    pricePerNight: {
      type: Number,
      required: true,
    },

    // Total = pricePerNight × numNights
    totalPrice: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    // Special requests from guest
    specialRequests: {
      type: String,
      maxlength: [500, "Special requests cannot exceed 500 characters"],
      default: "",
    },

    // When was it cancelled and why
    cancelledAt: {
      type: Date,
    },

    cancellationReason: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentId: { type: String, default: "" }, // Razorpay payment_id
    razorpayOrderId: { type: String, default: "" }, // Razorpay order_id
    paidAt: { type: Date },
  },

  {
    timestamps: true,
  },
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
