import Booking from "../models/Booking.js";
import Property from "../models/Property.js";
import sendEmail from "../utils/sendEmail.js";
import {
  bookingCreatedGuestTemplate,
  bookingCreatedHostTemplate,
  bookingConfirmedGuestTemplate,
  bookingCancelledGuestTemplate,
  bookingCancelledHostTemplate,
} from "../utils/emailTemplates.js";

// ─── Helper: Calculate number of nights ──────────────────
const calcNights = (checkIn, checkOut) => {
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.ceil(diff / (1000 * 60 * 60 * 24)); // ms → days
};

// ── Store date as midnight UTC from a YYYY-MM-DD string ──
// This prevents timezone shifts when client sends date strings
const toMidnight = (dateInput) => {
  // If it's already a string like "2026-05-18", parse as UTC directly
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return new Date(dateInput + "T00:00:00.000Z");
  }
  // Fallback for other formats — extract date parts from local time
  const d = new Date(dateInput);
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
  );
};
// ─── Helper: Check date conflict ─────────────────────────
const hasDateConflict = async (
  propertyId,
  checkIn,
  checkOut,
  excludeId = null,
) => {
  const newCheckIn = toMidnight(checkIn);
  const newCheckOut = toMidnight(checkOut);

  // Find any active booking that overlaps with the requested dates
  // Overlap happens when:
  // existing.checkIn  < new.checkOut
  // AND
  // existing.checkOut > new.checkIn
  const query = {
    property: propertyId,
    status: { $in: ["pending", "confirmed"] },
    checkIn: { $lt: newCheckOut }, // existing start is before new end
    checkOut: { $gt: newCheckIn }, // existing end is after new start
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflict = await Booking.findOne(query);
  return !!conflict;
};

// ─── @desc    Create a new booking
// ─── @route   POST /api/bookings
// ─── @access  Private (Guest only)
export const createBooking = async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut, numGuests, specialRequests } =
      req.body;

    if (!propertyId || !checkIn || !checkOut || !numGuests) {
      return res.status(400).json({
        success: false,
        message: "Please provide propertyId, checkIn, checkOut and numGuests",
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (property.host.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own property",
      });
    }

    // ── Normalize both dates to midnight UTC ──────────────
    const checkInDate = toMidnight(checkIn);
    const checkOutDate = toMidnight(checkOut);
    const today = toMidnight(new Date());

    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past",
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in date",
      });
    }

    if (numGuests > property.maxGuests) {
      return res.status(400).json({
        success: false,
        message: `This property allows maximum ${property.maxGuests} guests`,
      });
    }

    // ── Check for ANY overlap with existing bookings ──────
    const conflict = await hasDateConflict(
      propertyId,
      checkInDate,
      checkOutDate,
    );

    if (conflict) {
      // Find the conflicting booking to show exact dates to user
      const conflictingBooking = await Booking.findOne({
        property: propertyId,
        status: { $in: ["pending", "confirmed"] },
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate },
      });

      const conflictCheckIn = conflictingBooking?.checkIn
        ? new Date(conflictingBooking.checkIn).toLocaleDateString("en-IN")
        : "";
      const conflictCheckOut = conflictingBooking?.checkOut
        ? new Date(conflictingBooking.checkOut).toLocaleDateString("en-IN")
        : "";

      return res.status(400).json({
        success: false,
        message: `These dates overlap with an existing booking (${conflictCheckIn} – ${conflictCheckOut}). Please choose different dates.`,
      });
    }

    const numNights = calcNights(checkInDate, checkOutDate);
    const totalPrice = numNights * property.price;

    const booking = await Booking.create({
      property: propertyId,
      guest: req.user._id,
      host: property.host,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numNights,
      numGuests,
      pricePerNight: property.price,
      totalPrice,
      specialRequests: specialRequests || "",
    });

    await booking.populate([
      { path: "property", select: "title location images price" },
      { path: "guest", select: "name email" },
      { path: "host", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Booking created successfully! 🎉",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get all bookings for logged in GUEST
// ─── @route   GET /api/bookings/my-bookings
// ─── @access  Private (Guest)
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id })
      .populate("property", "title location images price")
      .populate("host", "name avatar")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get all bookings on HOST's properties
// ─── @route   GET /api/bookings/host-bookings
// ─── @access  Private (Host)
export const getHostBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ host: req.user._id })
      .populate("property", "title location images")
      .populate("guest", "name email avatar phone")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get single booking by ID
// ─── @route   GET /api/bookings/:id
// ─── @access  Private (Guest or Host of that booking)
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("property", "title location images price amenities")
      .populate("guest", "name email avatar phone")
      .populate("host", "name email avatar phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only the guest or host of this booking can view it
    const isGuest = booking.guest._id.toString() === req.user._id.toString();
    const isHost = booking.host._id.toString() === req.user._id.toString();

    if (!isGuest && !isHost) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Cancel a booking
// ─── @route   PUT /api/bookings/:id/cancel
// ─── @access  Private (Guest who made it or Host)
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only guest or host can cancel
    const isGuest = booking.guest.toString() === req.user._id.toString();
    const isHost = booking.host.toString() === req.user._id.toString();

    if (!isGuest && !isHost) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    // Cannot cancel already cancelled or completed bookings
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed booking",
      });
    }

    // Update status to cancelled
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || "Cancelled by user";
    await booking.save();

    // ── Send cancellation emails to both parties ──────────
    const populatedBooking = await Booking.findById(booking._id)
      .populate("guest", "name email")
      .populate("host", "name email")
      .populate("property", "title location host");

    if (populatedBooking) {
      const cancelData = {
        booking: populatedBooking,
        guest: populatedBooking.guest,
        property: populatedBooking.property,
        reason: booking.cancellationReason || "",
      };

      // Email to Guest
      sendEmail({
        to: populatedBooking.guest.email,
        subject: `Booking Cancelled – ${populatedBooking.property.title}`,
        html: bookingCancelledGuestTemplate(cancelData),
      });

      // Email to Host
      sendEmail({
        to: populatedBooking.host.email,
        subject: `Booking Cancelled by Guest – ${populatedBooking.property.title}`,
        html: bookingCancelledHostTemplate(cancelData),
      });
    }
    // ─────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Confirm a booking (Host only)
// ─── @route   PUT /api/bookings/:id/confirm
// ─── @access  Private (Host only)
export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only the host of this property can confirm
    if (booking.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the host can confirm this booking",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}`,
      });
    }

    booking.status = "confirmed";
    await booking.save();
    // ── Send confirmation email to guest ─────────────────
    const populatedBooking = await Booking.findById(booking._id)
      .populate("guest", "name email")
      .populate("property", "title location");

    if (populatedBooking) {
      sendEmail({
        to: populatedBooking.guest.email,
        subject: `Booking Confirmed! – ${populatedBooking.property.title}`,
        html: bookingConfirmedGuestTemplate({
          booking: populatedBooking,
          guest: populatedBooking.guest,
          property: populatedBooking.property,
        }),
      });
    }
    // ─────────────────────────────────────────────────────

    await booking.populate([
      { path: "property", select: "title location" },
      { path: "guest", select: "name email" },
    ]);

    res.status(200).json({
      success: true,
      message: "Booking confirmed! ✅",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get all booked dates for a property
// ─── @route   GET /api/bookings/:propertyId/booked-dates
// ─── @access  Public (needed to show unavailable dates on calendar)
export const getBookedDates = async (req, res) => {
  try {
    const bookings = await Booking.find({
      property: req.params.propertyId,
      status: { $in: ["pending", "confirmed"] },
    }).select("checkIn checkOut");

    // Return array of date ranges so frontend can disable them on calendar
    const bookedDates = bookings.map((b) => ({
      checkIn: b.checkIn,
      checkOut: b.checkOut,
    }));

    res.status(200).json({
      success: true,
      bookedDates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
