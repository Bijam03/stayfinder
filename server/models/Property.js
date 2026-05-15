import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Who owns this property — links to User model
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User collection
      required: true,
    },

    price: {
      type: Number,
      required: [true, "Price per night is required"],
      min: [1, "Price must be at least 1"],
    },

    // Location details stored as an object
    location: {
      address: { type: String, default: "" },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: { type: String, default: "" },
      country: {
        type: String,
        required: [true, "Country is required"],
        default: "India",
      },
      zipCode: { type: String, default: "" },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },

    // Array of image URLs from Cloudinary
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true }, // Needed to delete from Cloudinary
      },
    ],

    // List of amenities the property offers
    amenities: [
      {
        type: String,
        enum: [
          "wifi",
          "ac",
          "heating",
          "kitchen",
          "tv",
          "parking",
          "pool",
          "gym",
          "washing_machine",
          "balcony",
          "pet_friendly",
          "smoking_allowed",
        ],
      },
    ],

    propertyType: {
      type: String,
      enum: ["apartment", "house", "villa", "studio", "hotel", "hostel"],
      default: "apartment",
    },

    // How many guests can stay
    maxGuests: {
      type: Number,
      default: 1,
      min: [1, "At least 1 guest must be allowed"],
    },

    bedrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },

    // Average rating — calculated from reviews
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Total number of reviews
    numReviews: {
      type: Number,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// ── Index for faster location search ──
propertySchema.index({ "location.city": 1 });
propertySchema.index({ price: 1 });

const Property = mongoose.model("Property", propertySchema);
export default Property;
