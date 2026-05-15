import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import startReminderJob from './jobs/reminderJob.js';
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from './routes/adminRoutes.js';


// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

// Create the Express app (this IS your server)
const app = express();

// ─── Middleware (Tools the server uses on every request) ───
app.use(express.json());                    // Read JSON data from requests
app.use(express.urlencoded({ extended: true })); // Read form data
app.use(cookieParser());                    // Read cookies

// Allow frontend to talk to backend
const allowedOrigin = process.env.NODE_ENV === "production"
  ? process.env.CLIENT_URL
  : "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// ─── Test Route ────────────────────────────────────────────
// When someone visits http://localhost:5000 — show this message
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🏠 StayFinder API is running...",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 Handler ──────────────────────────────────────────
// If someone visits a route that doesn't exist
app.use((req, res, next) => {
  res.status(404).json({ message: "❌ Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────
// THIS MUST BE THE LAST MIDDLEWARE - takes 4 parameters (err, req, res, next)
app.use((err, req, res, next) => {
  console.error(err); // Log error for debugging
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  startReminderJob();
});