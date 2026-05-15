import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updateAvatar,
  forgotPassword,    
  resetPassword, 
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
} from "../middleware/validationMiddleware.js"; 
import { upload } from "../config/cloudinary.js"; 

const router = express.Router();

// Validators sit BETWEEN the route and the controller
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);
router.put("/update-profile", protect, validateUpdateProfile, updateProfile);
router.put("/update-avatar", protect, upload.single("avatar"), updateAvatar);

export default router;