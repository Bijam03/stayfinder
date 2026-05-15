import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getAdminStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  getAllProperties,
  deleteProperty,
  togglePropertyAvailability,
  getAllBookings,
  adminCancelBooking,
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require login + admin role
router.use(protect, authorizeRoles('admin'));

// Dashboard
router.get('/stats', getAdminStats);

// Users
router.get('/users',              getAllUsers);
router.get('/users/:id',          getUserById);
router.put('/users/:id/role',     updateUserRole);
router.put('/users/:id/toggle',   toggleUserActive);
router.delete('/users/:id',       deleteUser);

// Properties
router.get('/properties',                      getAllProperties);
router.delete('/properties/:id',               deleteProperty);
router.put('/properties/:id/toggle',           togglePropertyAvailability);

// Bookings
router.get('/bookings',           getAllBookings);
router.put('/bookings/:id/cancel', adminCancelBooking);

export default router;