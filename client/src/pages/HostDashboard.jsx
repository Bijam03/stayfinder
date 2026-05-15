import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getHostDashboard } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { formatDate } from "../utils/dateUtils";
import {
  FaRupeeSign,
  FaHome,
  FaCalendarAlt,
  FaStar,
  FaArrowUp,
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUserFriends,
} from "react-icons/fa";

// ── Status badge styles ───────────────────────────────────
const statusStyles = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

// ── Earnings Bar Chart ────────────────────────────────────
const EarningsChart = ({ data }) => {
  const maxEarnings = Math.max(...data.map((d) => d.earnings), 1);

  return (
    <div className="flex items-end justify-between gap-2 h-36">
      {data.map((item, i) => {
        const heightPercent =
          maxEarnings > 0 ? (item.earnings / maxEarnings) * 100 : 0;
        const isCurrentMonth = i === data.length - 1;

        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            {/* Earnings tooltip on hover */}
            <div className="relative group flex flex-col items-center w-full">
              {item.earnings > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-10">
                  ₹{item.earnings.toLocaleString()}
                </div>
              )}
              {/* Bar */}
              <div
                className={`w-full rounded-t-lg transition-all duration-700 ${isCurrentMonth
                    ? "bg-rose-500"
                    : item.earnings > 0
                      ? "bg-rose-200"
                      : "bg-gray-100"
                  }`}
                style={{
                  height: `${Math.max(heightPercent, item.earnings > 0 ? 8 : 4)}%`,
                  minHeight: "4px",
                }}
              />
            </div>
            {/* Month label */}
            <span
              className={`text-xs font-medium ${isCurrentMonth ? "text-rose-500" : "text-gray-400"
                }`}
            >
              {item.month}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Occupancy Ring ────────────────────────────────────────
const OccupancyRing = ({ rate }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (rate / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="10"
        />
        {/* Progress circle */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000"
        />
      </svg>
      {/* Center text */}
      <div className="absolute text-center">
        <p className="text-xl font-bold text-gray-800">{rate}%</p>
      </div>
    </div>
  );
};

// ── Main Dashboard Component ──────────────────────────────
const HostDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await getHostDashboard();
      setStats(data.stats);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-28"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl h-64 lg:col-span-2"></div>
              <div className="bg-white rounded-2xl h-64"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { bookingStats } = stats;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Welcome Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Here's how your properties are performing
            </p>
          </div>
          <Link
            to="/create-property"
            className="hidden sm:flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-medium transition text-sm"
          >
            + Add Property
          </Link>
        </div>

        {/* ── Top Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total Earnings */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 col-span-2 sm:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <FaArrowUp size={10} />
                  Confirmed + Completed
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <FaRupeeSign className="text-green-500" size={16} />
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookingStats.total}
                </p>
                <p className="text-xs text-yellow-500 mt-1">
                  {bookingStats.pending} pending
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaCalendarAlt className="text-blue-500" size={16} />
              </div>
            </div>
          </div>

          {/* Total Properties */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Properties</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalProperties}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Active listings
                </p>
              </div>
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <FaHome className="text-rose-500" size={16} />
              </div>
            </div>
          </div>

          {/* Avg Rating */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avgRating > 0 ? stats.avgRating : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.totalReviews} reviews
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <FaStar className="text-yellow-500" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle Row: Chart + Occupancy ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Monthly Earnings Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Monthly Earnings
                </h2>
                <p className="text-sm text-gray-400">Last 6 months</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-xs text-gray-400">This month</span>
                <div className="w-3 h-3 rounded-full bg-rose-200 ml-2"></div>
                <span className="text-xs text-gray-400">Past months</span>
              </div>
            </div>
            {stats.monthlyEarnings.every((m) => m.earnings === 0) ? (
              <div className="h-36 flex items-center justify-center text-gray-400 text-sm">
                No earnings data yet
              </div>
            ) : (
              <EarningsChart data={stats.monthlyEarnings} />
            )}
            {/* Total for current month */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">
                {stats.monthlyEarnings[stats.monthlyEarnings.length - 1]?.month}{" "}
                earnings
              </span>
              <span className="font-semibold text-gray-800">
                ₹
                {stats.monthlyEarnings[
                  stats.monthlyEarnings.length - 1
                ]?.earnings.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Occupancy + Top Property */}
          <div className="space-y-4">

            {/* Occupancy Rate */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Occupancy Rate
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                This month across all properties
              </p>
              <div className="flex items-center justify-center">
                <OccupancyRing rate={stats.occupancyRate} />
              </div>
              <p className="text-center text-sm text-gray-500 mt-3">
                {stats.occupancyRate === 0
                  ? "No bookings this month"
                  : stats.occupancyRate >= 70
                    ? "Great occupancy! 🎉"
                    : stats.occupancyRate >= 40
                      ? "Good performance"
                      : "Room to grow 💪"}
              </p>
            </div>

            {/* Top Property */}
            {stats.topProperty && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                  <FaChartBar className="text-rose-400" size={13} />
                  Top Earning Property
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                    {stats.topProperty.image ? (
                      <img
                        src={stats.topProperty.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        🏠
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {stats.topProperty.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ₹{stats.topProperty.price?.toLocaleString()}/night
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Total earned</span>
                  <span className="text-sm font-bold text-green-600">
                    ₹{stats.topProperty.earnings.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Booking Status Breakdown ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            Booking Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Pending",
                count: bookingStats.pending,
                icon: FaClock,
                color: "text-yellow-500",
                bg: "bg-yellow-50",
              },
              {
                label: "Confirmed",
                count: bookingStats.confirmed,
                icon: FaCheckCircle,
                color: "text-green-500",
                bg: "bg-green-50",
              },
              {
                label: "Completed",
                count: bookingStats.completed,
                icon: FaUserFriends,
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
              {
                label: "Cancelled",
                count: bookingStats.cancelled,
                icon: FaTimesCircle,
                color: "text-red-500",
                bg: "bg-red-50",
              },
            ].map(({ label, count, icon: Icon, color, bg }) => (
              <div
                key={label}
                className={`${bg} rounded-xl p-4 flex items-center gap-3`}
              >
                <Icon className={color} size={22} />
                <div>
                  <p className="text-xl font-bold text-gray-800">{count}</p>
                  <p className={`text-xs font-medium ${color}`}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {bookingStats.total > 0 && (
            <div className="mt-5">
              <div className="flex rounded-full overflow-hidden h-3">
                {bookingStats.pending > 0 && (
                  <div
                    className="bg-yellow-400 transition-all"
                    style={{
                      width: `${(bookingStats.pending / bookingStats.total) * 100}%`,
                    }}
                  />
                )}
                {bookingStats.confirmed > 0 && (
                  <div
                    className="bg-green-400 transition-all"
                    style={{
                      width: `${(bookingStats.confirmed / bookingStats.total) * 100}%`,
                    }}
                  />
                )}
                {bookingStats.completed > 0 && (
                  <div
                    className="bg-blue-400 transition-all"
                    style={{
                      width: `${(bookingStats.completed / bookingStats.total) * 100}%`,
                    }}
                  />
                )}
                {bookingStats.cancelled > 0 && (
                  <div
                    className="bg-red-400 transition-all"
                    style={{
                      width: `${(bookingStats.cancelled / bookingStats.total) * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>{bookingStats.total} total</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Recent Bookings ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Bookings
            </h2>
            <Link
              to="/host-bookings"
              className="text-sm text-rose-500 hover:underline font-medium"
            >
              View all →
            </Link>
          </div>

          {stats.recentBookings.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500">No bookings yet</p>
              <p className="text-gray-400 text-sm mt-1">
                They'll show up here when guests book your properties
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition"
                >
                  {/* Property image */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                    {booking.property?.images?.[0] ? (
                      <img
                        src={booking.property.images[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        🏠
                      </div>
                    )}
                  </div>

                  {/* Booking info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {booking.property?.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {booking.guest?.name} ·{" "}
                      {formatDate(booking.checkIn, "dd MMM")} →{" "}
                      {formatDate(booking.checkOut, "dd MMM yyyy")}
                    </p>
                  </div>

                  {/* Price + status */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      ₹{booking.totalPrice?.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[booking.status]
                        }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
          <Link
            to="/create-property"
            className="bg-white hover:bg-rose-50 border border-gray-100 hover:border-rose-200 rounded-2xl p-5 text-center transition group"
          >
            <div className="text-3xl mb-2">🏠</div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-rose-500">
              Add New Property
            </p>
          </Link>
          <Link
            to="/host-bookings"
            className="bg-white hover:bg-rose-50 border border-gray-100 hover:border-rose-200 rounded-2xl p-5 text-center transition group"
          >
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-rose-500">
              Manage Bookings
            </p>
          </Link>
          <Link
            to="/my-listings"
            className="bg-white hover:bg-rose-50 border border-gray-100 hover:border-rose-200 rounded-2xl p-5 text-center transition group"
          >
            <div className="text-3xl mb-2">📝</div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-rose-500">
              Edit Listings
            </p>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default HostDashboard;