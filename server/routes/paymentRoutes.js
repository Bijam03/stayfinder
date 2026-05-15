import express        from "express";
import { protect }    from "../middleware/authMiddleware.js";
import {
  createOrder,
  verifyPayment,
  getPaymentStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", protect, createOrder);
router.post("/verify",        protect, verifyPayment);
router.get("/status/:bookingId", protect, getPaymentStatus);

export default router;