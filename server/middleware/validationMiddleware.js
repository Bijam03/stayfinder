import { body, param, query, validationResult } from "express-validator";

// ─── Helper: Run this after every validation chain ────────
// Collects all errors and sends them back at once
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors into a clean array
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  }

  next(); // No errors — continue to controller
};

// ════════════════════════════════════════════════════════
// AUTH VALIDATORS
// ════════════════════════════════════════════════════════

export const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(), // Converts to lowercase automatically

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .isLength({ max: 50 })
    .withMessage("Password cannot exceed 50 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase, one lowercase, and one number"
    ),

  body("role")
    .optional()
    .isIn(["guest", "host"])
    .withMessage("Role must be either guest or host"),

  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  handleValidationErrors,
];

export const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .isLength({ max: 50 })
    .withMessage("Name cannot exceed 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be a valid 10-digit number"),

  handleValidationErrors,
];

// ════════════════════════════════════════════════════════
// PROPERTY VALIDATORS
// ════════════════════════════════════════════════════════

export const validateCreateProperty = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5 })
    .withMessage("Title must be at least 5 characters")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters")
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((val) => Number(val) >= 1)
    .withMessage("Price must be at least 1"),

  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .custom((val) => {
      // location comes as JSON string from multipart form
      const loc = typeof val === "string" ? JSON.parse(val) : val;
      if (!loc.city) throw new Error("City is required in location");
      if (!loc.country) throw new Error("Country is required in location");
      return true;
    }),

  body("propertyType")
    .optional()
    .isIn(["apartment", "house", "villa", "studio", "hotel", "hostel"])
    .withMessage("Invalid property type"),

  body("maxGuests")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max guests must be at least 1"),

  body("bedrooms")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Bedrooms must be at least 1"),

  body("bathrooms")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Bathrooms must be at least 1"),

  body("amenities")
    .optional()
    .custom((val) => {
      const list = typeof val === "string" ? JSON.parse(val) : val;
      const allowed = [
        "wifi", "ac", "heating", "kitchen", "tv",
        "parking", "pool", "gym", "washing_machine",
        "balcony", "pet_friendly", "smoking_allowed",
      ];
      if (!Array.isArray(list)) throw new Error("Amenities must be an array");
      for (const item of list) {
        if (!allowed.includes(item))
          throw new Error(`Invalid amenity: ${item}`);
      }
      return true;
    }),

  handleValidationErrors,
];

export const validateUpdateProperty = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage("Title must be at least 5 characters")
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters")
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("price")
    .optional()
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((val) => Number(val) >= 1)
    .withMessage("Price must be at least 1"),

  body("propertyType")
    .optional()
    .isIn(["apartment", "house", "villa", "studio", "hotel", "hostel"])
    .withMessage("Invalid property type"),

  body("maxGuests")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max guests must be at least 1"),

  handleValidationErrors,
];

// ════════════════════════════════════════════════════════
// BOOKING VALIDATORS
// ════════════════════════════════════════════════════════

export const validateCreateBooking = [
  body("propertyId")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID format"),

  body("checkIn")
    .notEmpty()
    .withMessage("Check-in date is required")
    .isISO8601()
    .withMessage("Check-in must be a valid date (YYYY-MM-DD)")
    .custom((val) => {
      const checkIn = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkIn < today) {
        throw new Error("Check-in date cannot be in the past");
      }
      return true;
    }),

  body("checkOut")
    .notEmpty()
    .withMessage("Check-out date is required")
    .isISO8601()
    .withMessage("Check-out must be a valid date (YYYY-MM-DD)")
    .custom((val, { req }) => {
      const checkOut = new Date(val);
      const checkIn = new Date(req.body.checkIn);
      if (checkOut <= checkIn) {
        throw new Error("Check-out must be after check-in date");
      }
      // Max 30 nights per booking
      const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
      if (nights > 30) {
        throw new Error("Maximum booking duration is 30 nights");
      }
      return true;
    }),

  body("numGuests")
    .notEmpty()
    .withMessage("Number of guests is required")
    .isInt({ min: 1 })
    .withMessage("At least 1 guest is required")
    .isInt({ max: 20 })
    .withMessage("Maximum 20 guests allowed"),

  body("specialRequests")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Special requests cannot exceed 500 characters")
    .escape(), // Removes HTML tags — prevents XSS attacks

  handleValidationErrors,
];

export const validateCancelBooking = [
  param("id")
    .isMongoId()
    .withMessage("Invalid booking ID"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Cancellation reason cannot exceed 200 characters")
    .escape(),

  handleValidationErrors,
];

// ════════════════════════════════════════════════════════
// REVIEW VALIDATORS (for Phase 5)
// ════════════════════════════════════════════════════════

export const validateCreateReview = [
  body("propertyId")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Review comment is required")
    .isLength({ min: 10 })
    .withMessage("Comment must be at least 10 characters")
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters")
    .escape(), // Prevents XSS

  handleValidationErrors,
];

// ════════════════════════════════════════════════════════
// QUERY VALIDATORS (for search/filter)
// ════════════════════════════════════════════════════════

export const validatePropertyQuery = [
  query("minPrice")
    .optional()
    .isNumeric()
    .withMessage("Min price must be a number")
    .custom((val) => Number(val) >= 0)
    .withMessage("Min price cannot be negative"),

  query("maxPrice")
    .optional()
    .isNumeric()
    .withMessage("Max price must be a number")
    .custom((val, { req }) => {
      if (req.query.minPrice && Number(val) < Number(req.query.minPrice)) {
        throw new Error("Max price must be greater than min price");
      }
      return true;
    }),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive number"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("propertyType")
    .optional()
    .isIn(["apartment", "house", "villa", "studio", "hotel", "hostel"])
    .withMessage("Invalid property type"),

  handleValidationErrors,
];