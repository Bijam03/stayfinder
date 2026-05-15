import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../services/bookingService";
import toast from "react-hot-toast";
import { formatDate } from "../utils/dateUtils";
import PayButton from "../components/property/PayButton";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaMoon,
  FaTimes,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUserFriends,
  FaChevronRight,
  FaLock,
  FaRupeeSign,
  FaEye,
} from "react-icons/fa";

// ── Status config ─────────────────────────────────────
const statusConfig = {
  pending:   { label: "Pending",   color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100", icon: FaClock       },
  confirmed: { label: "Confirmed", color: "text-green-600",  bg: "bg-green-50",  border: "border-green-100", icon: FaCheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",   icon: FaTimesCircle },
  completed: { label: "Completed", color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",  icon: FaUserFriends },
};

const paymentConfig = {
  unpaid:   { label: "Payment Pending", color: "text-red-500",    bg: "bg-red-50"    },
  paid:     { label: "Paid",            color: "text-green-600",  bg: "bg-green-50"  },
  refunded: { label: "Refunded",        color: "text-gray-500",   bg: "bg-gray-100"  },
};

// ── Skeleton ──────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex gap-4 p-5 animate-pulse">
    <div className="w-24 h-20 bg-gray-100 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2.5 py-1">
      <div className="h-3 bg-gray-100 rounded w-1/4" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
    <div className="w-20 space-y-2 py-1">
      <div className="h-4 bg-gray-100 rounded" />
      <div className="h-6 bg-gray-100 rounded" />
    </div>
  </div>
);

// ── Pay Now Inline Panel ───────────────────────────────
const PayNowPanel = ({ booking, onSuccess }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-amber-100 mt-3 pt-3">
      {!open ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-xs text-amber-600 font-medium">
              Payment pending — booking not confirmed yet
            </span>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white
                       bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition"
          >
            <FaLock size={9} />
            Pay Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">
              Complete payment to confirm booking
            </p>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕ Cancel
            </button>
          </div>
          <PayButton booking={booking} onSuccess={onSuccess} />
          <div className="flex items-center justify-center gap-1.5">
            <FaLock size={9} className="text-gray-300" />
            <span className="text-xs text-gray-400">Secured by Razorpay</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Booking Row ───────────────────────────────────────
const BookingRow = ({ booking, onCancel, cancelling, onPaymentSuccess }) => {
  const cfg    = statusConfig[booking.status] || statusConfig.pending;
  const pCfg   = paymentConfig[booking.paymentStatus] || paymentConfig.unpaid;
  const Icon   = cfg.icon;
  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";

  // Show Pay Now if booking is pending AND payment is unpaid
  const showPayNow =
    booking.status === "pending" && booking.paymentStatus === "unpaid";

  return (
    <div className="flex flex-col sm:flex-row hover:bg-gray-50/50 transition group">

      {/* Image */}
      <div className="sm:w-32 h-40 sm:h-auto flex-shrink-0 overflow-hidden bg-gray-100 rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
        {booking.property?.images?.[0] ? (
          <img
            src={booking.property.images[0].url}
            alt={booking.property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
            🏠
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
        <div>
          {/* Property name + badges */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <Link
                to={`/properties/${booking.property?._id}`}
                className="text-sm font-semibold text-gray-900 hover:text-rose-500 transition truncate block"
              >
                {booking.property?.title}
              </Link>
              <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                <FaMapMarkerAlt size={10} />
                <span>
                  {booking.property?.location?.city},{" "}
                  {booking.property?.location?.country}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {/* Booking status badge */}
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                <Icon size={10} />
                {cfg.label}
              </div>
              {/* Payment status badge */}
              <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${pCfg.color} ${pCfg.bg}`}>
                {pCfg.label}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaCalendarAlt size={10} className="text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Check-in</p>
                <p className="text-xs font-medium text-gray-700">
                  {formatDate(booking.checkIn, "dd MMM")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaCalendarAlt size={10} className="text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Check-out</p>
                <p className="text-xs font-medium text-gray-700">
                  {formatDate(booking.checkOut, "dd MMM")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaMoon size={10} className="text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Nights</p>
                <p className="text-xs font-medium text-gray-700">
                  {booking.numNights}
                </p>
              </div>
            </div>
          </div>

          {/* Payment info if paid */}
          {booking.paymentStatus === "paid" && booking.paidAt && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-2">
              <p className="text-xs text-green-600">
                ✅ Paid on{" "}
                {new Date(booking.paidAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
                {booking.paymentId && (
                  <span className="ml-2 text-green-500 font-mono">
                    · {booking.paymentId.slice(-8)}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
          <div>
            <span className="text-base font-semibold text-gray-900">
              ₹{booking.totalPrice?.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-gray-400 ml-1">total</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/properties/${booking.property?._id}`}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition"
            >
              <FaEye size={10} />
              View
              <FaChevronRight size={9} />
            </Link>
            {canCancel && booking.paymentStatus !== "unpaid" && (
              <button
                onClick={() => onCancel(booking._id)}
                disabled={cancelling === booking._id}
                className="flex items-center gap-1.5 text-xs font-medium text-red-400
                           hover:text-red-600 border border-red-100 hover:border-red-200
                           px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                <FaTimes size={10} />
                {cancelling === booking._id ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
        </div>

        {/* ── Pay Now panel (only for unpaid pending bookings) ── */}
        {showPayNow && (
          <PayNowPanel
            booking={booking}
            onSuccess={() => onPaymentSuccess(booking._id)}
          />
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────
const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [filter, setFilter]         = useState("all");

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await getMyBookings();
      setBookings(data.bookings);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      setCancelling(id);
      await cancelBooking(id, "Cancelled by guest");
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
      );
      toast.success("Booking cancelled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelling(null);
    }
  };

  // After payment success — mark booking as paid + confirmed in local state
  const handlePaymentSuccess = (id) => {
    setBookings((prev) =>
      prev.map((b) =>
        b._id === id
          ? { ...b, status: "confirmed", paymentStatus: "paid" }
          : b
      )
    );
    toast.success("Payment successful! Booking confirmed 🎉");
    navigate("/my-bookings");
  };

  const filteredBookings =
    filter === "all"
      ? bookings
      : filter === "unpaid"
      ? bookings.filter((b) => b.paymentStatus === "unpaid" && b.status === "pending")
      : bookings.filter((b) => b.status === filter);

  const stats = {
    total:     bookings.length,
    upcoming:  bookings.filter(
      (b) => (b.status === "confirmed") && new Date(b.checkIn) >= new Date()
    ).length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    unpaid:    bookings.filter(
      (b) => b.paymentStatus === "unpaid" && b.status === "pending"
    ).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Loading..."
              : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
          </p>
        </div>

        {/* ── Unpaid Alert Banner ── */}
        {!loading && stats.unpaid > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-700">
                  {stats.unpaid} booking{stats.unpaid !== 1 ? "s" : ""} awaiting payment
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Complete your payment to confirm your reservation
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilter("unpaid")}
              className="text-xs font-semibold text-amber-700 bg-amber-100
                         hover:bg-amber-200 px-3 py-1.5 rounded-lg transition whitespace-nowrap"
            >
              Pay Now →
            </button>
          </div>
        )}

        {/* ── Stats Cards ── */}
        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total",     value: stats.total,     bg: "bg-white",    text: "text-gray-900", sub: "text-gray-400"  },
              { label: "Upcoming",  value: stats.upcoming,  bg: "bg-blue-50",  text: "text-blue-700", sub: "text-blue-400"  },
              { label: "Completed", value: stats.completed, bg: "bg-green-50", text: "text-green-700",sub: "text-green-500" },
              { label: "Cancelled", value: stats.cancelled, bg: "bg-red-50",   text: "text-red-600",  sub: "text-red-400"   },
            ].map(({ label, value, bg, text, sub }) => (
              <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-4 text-center`}>
                <p className={`text-2xl font-semibold ${text}`}>{value}</p>
                <p className={`text-xs mt-0.5 ${sub}`}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter Tabs ── */}
        {!loading && bookings.length > 0 && (
          <div className="flex gap-1 mb-4 bg-white border border-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
            {[
              { value: "all",       label: "All"       },
              { value: "unpaid",    label: "Unpaid"    },
              { value: "pending",   label: "Pending"   },
              { value: "confirmed", label: "Confirmed" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition ${
                  filter === value
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
                {value === "unpaid" && stats.unpaid > 0 && (
                  <span className="ml-1.5 bg-amber-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {stats.unpaid}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt size={18} className="text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">No bookings yet</h3>
            <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto">
              Start exploring properties and make your first booking!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700
                         text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
            >
              Browse Properties
            </Link>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-12 text-center">
            <p className="text-sm text-gray-400">
              {filter === "unpaid" ? "No pending payments" : `No ${filter} bookings`}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {filteredBookings.map((booking) => (
              <BookingRow
                key={booking._id}
                booking={booking}
                onCancel={handleCancel}
                cancelling={cancelling}
                onPaymentSuccess={handlePaymentSuccess}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
