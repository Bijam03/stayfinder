import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"; 
import propertyRoutes from "./routes/propertyRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js"; 
import startReminderJob from './jobs/reminderJob.js';
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from './routes/adminRoutes.js';

// ES Module path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Update CORS for production
const origin = process.env.NODE_ENV === "production" 
  ? process.env.FRONTEND_URL 
  : "http://localhost:5173";

app.use(
  cors({
    origin: origin,
    credentials: true,
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes); 
app.use("/api/payments", paymentRoutes);
app.use('/api/admin', adminRoutes); 

// ─── Production Setup ─────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  // Set static folder (where React build lives)
  const clientBuildPath = path.join(__dirname, "../client/dist");
  app.use(express.static(clientBuildPath));

  // Any route that is not an API route → serve index.html
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, "index.html"));
  });
} else {
  // Test Route for development
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "🏠 StayFinder API is running...",
    });
  });
}

// ─── 404 Handler (only reached if not serving frontend) ───
app.use((req, res, next) => {
  res.status(404).json({ message: "❌ Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  startReminderJob();
});