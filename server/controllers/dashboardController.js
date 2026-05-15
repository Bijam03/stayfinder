import Booking from "../models/Booking.js";
import Property from "../models/Property.js";
import Review from "../models/Review.js";

// ─── @desc    Get host dashboard stats
// ─── @route   GET /api/dashboard/host
// ─── @access  Private (Host only)
export const getHostDashboard = async (req, res) => {
  try {
    const hostId = req.user._id;

    // ── 1. Get all properties by this host ──────────────
    const properties = await Property.find({ host: hostId });
    const propertyIds = properties.map((p) => p._id);

    // ── 2. Get all bookings on host's properties ─────────
    const allBookings = await Booking.find({
      host: hostId,
    }).populate("property", "title images price");

    // ── 3. Total earnings (confirmed + completed only) ───
    const totalEarnings = allBookings
      .filter(
        (b) => b.status === "confirmed" || b.status === "completed"
      )
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // ── 4. Booking counts by status ──────────────────────
    const bookingStats = {
      total:     allBookings.length,
      pending:   allBookings.filter((b) => b.status === "pending").length,
      confirmed: allBookings.filter((b) => b.status === "confirmed").length,
      completed: allBookings.filter((b) => b.status === "completed").length,
      cancelled: allBookings.filter((b) => b.status === "cancelled").length,
    };

    // ── 5. Monthly earnings for last 6 months ────────────
    const monthlyEarnings = getLast6MonthsEarnings(allBookings);

    // ── 6. Occupancy rate this month ─────────────────────
    const occupancyRate = getOccupancyRate(allBookings, propertyIds.length);

    // ── 7. Top performing property ───────────────────────
    const topProperty = getTopProperty(allBookings, properties);

    // ── 8. Recent 5 bookings ─────────────────────────────
    const recentBookings = await Booking.find({ host: hostId })
      .populate("property", "title images")
      .populate("guest", "name email avatar")
      .sort("-createdAt")
      .limit(5);

    // ── 9. Total reviews across all properties ───────────
    const totalReviews = await Review.countDocuments({
      property: { $in: propertyIds },
    });

    // ── 10. Average rating across all properties ─────────
    const avgRatingResult = await Review.aggregate([
      { $match: { property: { $in: propertyIds } } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);
    const avgRating =
      avgRatingResult.length > 0
        ? Math.round(avgRatingResult[0].avg * 10) / 10
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalEarnings,
        totalProperties: properties.length,
        bookingStats,
        occupancyRate,
        totalReviews,
        avgRating,
        monthlyEarnings,
        topProperty,
        recentBookings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Helper: Last 6 months earnings ──────────────────────
const getLast6MonthsEarnings = (bookings) => {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();

    // Sum earnings for bookings created in this month
    const earnings = bookings
      .filter((b) => {
        if (b.status === "cancelled") return false;
        const created = new Date(b.createdAt);
        return (
          created.getMonth() === date.getMonth() &&
          created.getFullYear() === year
        );
      })
      .reduce((sum, b) => sum + b.totalPrice, 0);

    months.push({
      month: monthName,
      year,
      earnings,
    });
  }

  return months;
};

// ─── Helper: Occupancy rate this month ───────────────────
const getOccupancyRate = (bookings, numProperties) => {
  if (numProperties === 0) return 0;

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const totalAvailableDays = daysInMonth * numProperties;

  // Count days booked this month
  let bookedDays = 0;
  bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .forEach((b) => {
      const checkIn  = new Date(Math.max(new Date(b.checkIn), firstDay));
      const checkOut = new Date(Math.min(new Date(b.checkOut), lastDay));
      if (checkOut > checkIn) {
        const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        bookedDays += days;
      }
    });

  return Math.min(
    Math.round((bookedDays / totalAvailableDays) * 100),
    100
  );
};

// ─── Helper: Top performing property ─────────────────────
const getTopProperty = (bookings, properties) => {
  if (properties.length === 0) return null;

  // Sum earnings per property
  const earningMap = {};
  bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .forEach((b) => {
      const pid = b.property?._id?.toString() || b.property?.toString();
      if (pid) {
        earningMap[pid] = (earningMap[pid] || 0) + b.totalPrice;
      }
    });

  // Find property with highest earnings
  let topId = null;
  let topAmount = 0;
  Object.entries(earningMap).forEach(([pid, amount]) => {
    if (amount > topAmount) {
      topAmount = amount;
      topId = pid;
    }
  });

  if (!topId) return null;

  const topProp = properties.find((p) => p._id.toString() === topId);
  return topProp
    ? {
        _id: topProp._id,
        title: topProp.title,
        earnings: topAmount,
        image: topProp.images?.[0]?.url || null,
        price: topProp.price,
      }
    : null;
};