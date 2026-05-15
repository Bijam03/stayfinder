import express from "express";
import { getHostDashboard } from "../controllers/dashboardController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/host",
  protect,
  authorizeRoles("host"),
  getHostDashboard
);

export default router;