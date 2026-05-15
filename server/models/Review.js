import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// ── One review per guest per property ──────────────────
// This prevents the same user from reviewing the same property twice
reviewSchema.index({ property: 1, author: 1 }, { unique: true });

// ── Auto update property rating after save ─────────────
// This runs every time a review is created or updated
reviewSchema.post("save", async function () {
  await updatePropertyRating(this.property);
});

// ── Auto update property rating after delete ───────────
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await updatePropertyRating(doc.property);
  }
});

// ── Helper: recalculate and save property rating ───────
const updatePropertyRating = async (propertyId) => {
  const Review = mongoose.model("Review");
  const Property = mongoose.model("Property");

  // Calculate average rating from all reviews for this property
  const result = await Review.aggregate([
    { $match: { property: propertyId } },
    {
      $group: {
        _id: "$property",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Property.findByIdAndUpdate(propertyId, {
      rating: Math.round(result[0].avgRating * 10) / 10, // Round to 1 decimal
      numReviews: result[0].numReviews,
    });
  } else {
    // No reviews left — reset to 0
    await Property.findByIdAndUpdate(propertyId, {
      rating: 0,
      numReviews: 0,
    });
  }
};

const Review = mongoose.model("Review", reviewSchema);
export default Review;