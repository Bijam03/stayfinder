// import express from "express";
// import {
//   createBooking,
//   getMyBookings,
//   getHostBookings,
//   getBookingById,
//   cancelBooking,
//   confirmBooking,
//   getBookedDates,
// } from "../controllers/bookingController.js";
// import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // ── Public ────────────────────────────────────────────────
// // Get booked dates for calendar display
// router.get("/:propertyId/booked-dates", getBookedDates);

// // ── Private — Guest ───────────────────────────────────────
// router.post("/", protect, authorizeRoles("guest"), createBooking);
// router.get("/my-bookings", protect, authorizeRoles("guest"), getMyBookings);
// router.put("/:id/cancel", protect, cancelBooking);

// // ── Private — Host ────────────────────────────────────────
// router.get(
//   "/host-bookings",
//   protect,
//   authorizeRoles("host"),
//   getHostBookings
// );
// router.put(
//   "/:id/confirm",
//   protect,
//   authorizeRoles("host"),
//   confirmBooking
// );

// // ── Private — Guest or Host ───────────────────────────────
// router.get("/:id", protect, getBookingById);

// export default router;


// new code with validation middleware added: 

import express from "express";
import {
  createBooking,
  getMyBookings,
  getHostBookings,
  getBookingById,
  cancelBooking,
  confirmBooking,
  getBookedDates,
} from "../controllers/bookingController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  validateCreateBooking,
  validateCancelBooking,
} from "../middleware/validationMiddleware.js"; // ← ADD THIS

const router = express.Router();

router.get("/:propertyId/booked-dates", getBookedDates);

router.post("/", protect, authorizeRoles("guest"), validateCreateBooking, createBooking);
router.get("/my-bookings", protect, authorizeRoles("guest"), getMyBookings);
router.put("/:id/cancel", protect, validateCancelBooking, cancelBooking);
router.get("/host-bookings", protect, authorizeRoles("host"), getHostBookings);
router.put("/:id/confirm", protect, authorizeRoles("host"), confirmBooking);
router.get("/:id", protect, getBookingById);

export default router;