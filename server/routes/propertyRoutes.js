import express from "express";
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  getMyListings,
  updateProperty,
  deleteProperty,
  deletePropertyImage,
} from "../controllers/propertyController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { upload } from "../config/cloudinary.js";
import {
  validateCreateProperty,
  validateUpdateProperty,
  validatePropertyQuery,
} from "../middleware/validationMiddleware.js"; // ← ADD THIS

const router = express.Router();

// Validators added to each route
router.get("/", validatePropertyQuery, getAllProperties);
router.get("/my-listings", protect, authorizeRoles("host"), getMyListings);
router.get("/:id", getPropertyById);

router.post(
  "/",
  protect,
  authorizeRoles("host"),
  upload.array("images", 10),
  validateCreateProperty, // ← runs AFTER upload, BEFORE controller
  createProperty
);

router.put(
  "/:id",
  protect,
  authorizeRoles("host"),
  upload.array("images", 10),
  validateUpdateProperty,
  updateProperty
);

router.delete("/:id", protect, authorizeRoles("host"), deleteProperty);
router.delete(
  "/:id/image/:public_id",
  protect,
  authorizeRoles("host"),
  deletePropertyImage
);

export default router;