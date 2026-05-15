import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Property from "../models/Property.js";

// ─── @desc    Create a review
// ─── @route   POST /api/reviews
// ─── @access  Private (Guest only)
export const createReview = async (req, res) => {
  try {
    const { propertyId, rating, comment } = req.body;

    // ── Check property exists ──
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // ── Host cannot review their own property ──
    if (property.host.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot review your own property",
      });
    }

    // ── Check guest has a completed booking for this property ──
    const completedBooking = await Booking.findOne({
      property: propertyId,
      guest: req.user._id,
      status: "completed",
    });

    // ── Also allow confirmed bookings whose checkout has passed ──
    const pastBooking = await Booking.findOne({
      property: propertyId,
      guest: req.user._id,
      status: "confirmed",
      checkOut: { $lt: new Date() }, // checkout date is in the past
    });

    if (!completedBooking && !pastBooking) {
      return res.status(400).json({
        success: false,
        message:
          "You can only review a property after completing your stay",
      });
    }

    // ── Check if already reviewed ──
    const existing = await Review.findOne({
      property: propertyId,
      author: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "You have already reviewed this property. You can edit your existing review.",
      });
    }

    // ── Create the review ──
    const review = await Review.create({
      property: propertyId,
      author: req.user._id,
      rating,
      comment,
    });

    await review.populate("author", "name avatar");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully! ⭐",
      review,
    });
  } catch (error) {
    // Handle duplicate review error from MongoDB unique index
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this property",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Get all reviews for a property
// ─── @route   GET /api/reviews/:propertyId
// ─── @access  Public
export const getPropertyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      property: req.params.propertyId,
    })
      .populate("author", "name avatar")
      .sort("-createdAt");

    // Calculate rating breakdown (how many 1★, 2★, 3★, 4★, 5★)
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      breakdown[r.rating]++;
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      breakdown,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Update own review
// ─── @route   PUT /api/reviews/:id
// ─── @access  Private (Review author only)
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Only the author can update their review
    if (review.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own review",
      });
    }

    const { rating, comment } = req.body;

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save(); // This triggers post-save → updates property rating

    await review.populate("author", "name avatar");

    res.status(200).json({
      success: true,
      message: "Review updated successfully ✅",
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Delete own review
// ─── @route   DELETE /api/reviews/:id
// ─── @access  Private (Review author only)
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Only the author can delete their review
    if (review.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    // findOneAndDelete triggers the post hook → updates property rating
    await Review.findOneAndDelete({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully 🗑️",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── @desc    Check if logged in user can review a property
// ─── @route   GET /api/reviews/:propertyId/can-review
// ─── @access  Private
export const canReview = async (req, res) => {
  try {
    // Check if user has a completed/past booking
    const booking = await Booking.findOne({
      property: req.params.propertyId,
      guest: req.user._id,
      $or: [
        { status: "completed" },
        {
          status: "confirmed",
          checkOut: { $lt: new Date() },
        },
      ],
    });

    // Check if user already reviewed
    const existing = await Review.findOne({
      property: req.params.propertyId,
      author: req.user._id,
    });

    res.status(200).json({
      success: true,
      canReview: !!booking && !existing,
      hasBooking: !!booking,
      hasReviewed: !!existing,
      existingReview: existing || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};