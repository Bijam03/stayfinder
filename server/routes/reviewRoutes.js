import express from "express";
import {
  createReview,
  getPropertyReviews,
  updateReview,
  deleteReview,
  canReview,
} from "../controllers/reviewController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateCreateReview } from "../middleware/validationMiddleware.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────
router.get("/:propertyId", getPropertyReviews);

// ── Private ───────────────────────────────────────────────
router.get("/:propertyId/can-review", protect, canReview);

router.post(
  "/",
  protect,
  authorizeRoles("guest"),
  validateCreateReview,
  createReview
);

router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

export default router;