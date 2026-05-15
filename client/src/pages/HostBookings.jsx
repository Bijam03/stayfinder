import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getHostBookings,
  confirmBooking,
  cancelBooking,
} from "../services/bookingService";
import toast from "react-hot-toast";
import { formatDate } from "../utils/dateUtils";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaMoon,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCheck,
  FaTimes,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUserFriends,
  FaEye,
  FaRupeeSign,
  FaHome,
  FaChevronRight,
} from "react-icons/fa";

// ── Status config ─────────────────────────────────────
const statusConfig = {
  pending:   { label: "Pending",   color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100", icon: FaClock       },
  confirmed: { label: "Confirmed", color: "text-green-600",  bg: "bg-green-50",  border: "border-green-100", icon: FaCheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",   icon: FaTimesCircle },
  completed: { label: "Completed", color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",  icon: FaUserFriends },
};

const paymentConfig = {
  unpaid:   { label: "Unpaid",   color: "text-red-500",    bg: "bg-red-50"    },
  paid:     { label: "Paid",     color: "text-green-600",  bg: "bg-green-50"  },
  refunded: { label: "Refunded", color: "text-gray-500",   bg: "bg-gray-100"  },
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
  </div>
);

// ── Booking Detail Modal ──────────────────────────────
const BookingDetailModal = ({ booking, onClose, onConfirm, onCancel, actionId }) => {
  if (!booking) return null;
  const cfg  = statusConfig[booking.status] || statusConfig.pending;
  const pCfg = paymentConfig[booking.paymentStatus] || paymentConfig.unpaid;
  const Icon = cfg.icon;
  const busy = actionId === booking._id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-900">Booking Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-400"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Property */}
          <div className="flex gap-3">
            <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {booking.property?.images?.[0] ? (
                <img
                  src={booking.property.images[0].url}
                  alt={booking.property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {booking.property?.title}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <FaMapMarkerAlt size={10} />
                <span>{booking.property?.location?.city}, {booking.property?.location?.state}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {/* Status badge */}
                <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                  <Icon size={10} />
                  {cfg.label}
                </div>
                {/* Payment badge */}
                <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${pCfg.color} ${pCfg.bg}`}>
                  {pCfg.label}
                </div>
              </div>
            </div>
          </div>

          {/* Guest Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Guest Information
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-rose-500 text-sm font-bold">
                    {booking.guest?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{booking.guest?.name}</p>
                  <p className="text-xs text-gray-400">Guest</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaEnvelope size={12} className="text-gray-300 flex-shrink-0" />
                <span className="truncate">{booking.guest?.email}</span>
              </div>
              {booking.guest?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaPhone size={12} className="text-gray-300 flex-shrink-0" />
                  <span>{booking.guest?.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaUser size={12} className="text-gray-300 flex-shrink-0" />
                <span>{booking.numGuests} guest{booking.numGuests !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <FaCalendarAlt size={14} className="text-gray-400 mx-auto mb-1.5" />
              <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
              <p className="text-xs font-semibold text-gray-800">
                {formatDate(booking.checkIn, "dd MMM yyyy")}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <FaCalendarAlt size={14} className="text-gray-400 mx-auto mb-1.5" />
              <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
              <p className="text-xs font-semibold text-gray-800">
                {formatDate(booking.checkOut, "dd MMM yyyy")}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <FaMoon size={14} className="text-gray-400 mx-auto mb-1.5" />
              <p className="text-xs text-gray-400 mb-0.5">Nights</p>
              <p className="text-xs font-semibold text-gray-800">{booking.numNights}</p>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 mb-1">Special Request</p>
              <p className="text-xs text-blue-600">{booking.specialRequests}</p>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Price Breakdown
            </p>
            <div className="flex justify-between text-sm text-gray-600">
              <span>₹{booking.pricePerNight?.toLocaleString("en-IN")} × {booking.numNights} nights</span>
              <span>₹{(booking.pricePerNight * booking.numNights)?.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-green-600">₹{booking.totalPrice?.toLocaleString("en-IN")}</span>
            </div>
            {booking.paymentId && (
              <p className="text-xs text-gray-400 mt-1">
                Payment ID: <span className="font-mono">{booking.paymentId}</span>
              </p>
            )}
            {booking.paidAt && (
              <p className="text-xs text-gray-400">
                Paid on: {new Date(booking.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Booking ID + created at */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Booking ID: <span className="font-mono text-gray-500">{booking._id}</span></p>
            <p>Booked on: {new Date(booking.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
            })}</p>
          </div>

          {/* Actions */}
          {booking.status === "pending" && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onConfirm(booking._id)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl transition"
              >
                <FaCheck size={11} />
                {busy ? "Confirming..." : "Confirm Booking"}
              </button>
              <button
                onClick={() => onCancel(booking._id)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 border border-red-100 hover:border-red-200 px-4 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                <FaTimes size={11} />
                Decline
              </button>
            </div>
          )}
          {booking.status === "confirmed" && (
            <button
              onClick={() => onCancel(booking._id)}
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-4 py-2.5 rounded-xl transition disabled:opacity-50"
            >
              <FaTimes size={11} />
              {busy ? "Cancelling..." : "Cancel Booking"}
            </button>
          )}

          <Link
            to={`/properties/${booking.property?._id}`}
            className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition"
          >
            <FaHome size={11} />
            View Property
            <FaChevronRight size={9} />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── Booking Row ───────────────────────────────────────
const BookingRow = ({ booking, onConfirm, onCancel, actionId, onViewDetail }) => {
  const cfg  = statusConfig[booking.status] || statusConfig.pending;
  const pCfg = paymentConfig[booking.paymentStatus] || paymentConfig.unpaid;
  const Icon = cfg.icon;
  const busy = actionId === booking._id;

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
          <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">🏠</div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 min-w-0">

        {/* Top row */}
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
              <span>{booking.property?.location?.city}, {booking.property?.location?.state}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
              <Icon size={10} />
              {cfg.label}
            </div>
            <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${pCfg.color} ${pCfg.bg}`}>
              {pCfg.label}
            </div>
          </div>
        </div>

        {/* Guest strip */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-3">
          <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-rose-500 text-xs font-bold">
              {booking.guest?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-700 truncate">{booking.guest?.name}</p>
            <p className="text-xs text-gray-400 truncate">{booking.guest?.email}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <FaUser size={10} className="text-gray-300" />
            {booking.numGuests} guest{booking.numGuests !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Dates row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <FaCalendarAlt size={10} className="text-gray-300" />
            {formatDate(booking.checkIn, "dd MMM")} → {formatDate(booking.checkOut, "dd MMM")}
          </span>
          <span className="flex items-center gap-1">
            <FaMoon size={10} className="text-gray-300" />
            {booking.numNights} night{booking.numNights !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Special request */}
        {booking.specialRequests && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 mb-3">
            <p className="text-xs text-blue-600 truncate">
              <span className="font-medium">Request: </span>{booking.specialRequests}
            </p>
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-base font-semibold text-gray-900">
              ₹{booking.totalPrice?.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-gray-400 ml-1">
              · ₹{booking.pricePerNight?.toLocaleString("en-IN")}/night
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Detail */}
            <button
              onClick={() => onViewDetail(booking)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition"
            >
              <FaEye size={11} />
              Details
            </button>

            {/* Actions */}
            {booking.status === "pending" && (
              <>
                <button
                  onClick={() => onConfirm(booking._id)}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-1.5 rounded-lg transition"
                >
                  <FaCheck size={10} />
                  {busy ? "..." : "Confirm"}
                </button>
                <button
                  onClick={() => onCancel(booking._id)}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  <FaTimes size={10} />
                  Decline
                </button>
              </>
            )}
            {booking.status === "confirmed" && (
              <button
                onClick={() => onCancel(booking._id)}
                disabled={busy}
                className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                <FaTimes size={10} />
                {busy ? "..." : "Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────
const HostBookings = () => {
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionId, setActionId]         = useState(null);
  const [filter, setFilter]             = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await getHostBookings();
      setBookings(data.bookings);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      setActionId(id);
      await confirmBooking(id);
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "confirmed" } : b))
      );
      setSelectedBooking((prev) =>
        prev?._id === id ? { ...prev, status: "confirmed" } : prev
      );
      toast.success("Booking confirmed! ✅");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to confirm");
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      setActionId(id);
      await cancelBooking(id, "Cancelled by host");
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
      );
      setSelectedBooking((prev) =>
        prev?._id === id ? { ...prev, status: "cancelled" } : prev
      );
      toast.success("Booking cancelled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel");
    } finally {
      setActionId(null);
    }
  };

  // ── Today's bookings (checking in or out today) ───────
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const todayStr = todayUTC.toISOString().split("T")[0];

  const todaysBookings = bookings.filter((b) => {
    const cin  = new Date(b.checkIn).toISOString().split("T")[0];
    const cout = new Date(b.checkOut).toISOString().split("T")[0];
    return cin === todayStr || cout === todayStr;
  });

  const filteredBookings =
    filter === "today"
      ? todaysBookings
      : filter === "all"
      ? bookings
      : bookings.filter((b) => b.status === filter);

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Guest Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Loading..."
              : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} received`}
          </p>
        </div>

        {/* ── Stats Cards ── */}
        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total",     value: stats.total,     bg: "bg-white",    text: "text-gray-900", sub: "text-gray-400"  },
              { label: "Pending",   value: stats.pending,   bg: "bg-amber-50", text: "text-amber-600",sub: "text-amber-400" },
              { label: "Confirmed", value: stats.confirmed, bg: "bg-green-50", text: "text-green-600",sub: "text-green-500" },
              { label: "Cancelled", value: stats.cancelled, bg: "bg-red-50",   text: "text-red-500",  sub: "text-red-400"  },
            ].map(({ label, value, bg, text, sub }) => (
              <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-4 text-center`}>
                <div className="flex items-center justify-center gap-1.5">
                  <p className={`text-2xl font-semibold ${text}`}>{value}</p>
                  {label === "Pending" && value > 0 && (
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${sub}`}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Today's Check-ins banner ── */}
        {!loading && todaysBookings.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3.5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCalendarAlt size={14} className="text-amber-500" />
              <span className="text-sm font-medium text-amber-700">
                {todaysBookings.length} booking{todaysBookings.length !== 1 ? "s" : ""} today
                (check-in or check-out)
              </span>
            </div>
            <button
              onClick={() => setFilter("today")}
              className="text-xs font-medium text-amber-600 hover:text-amber-800 transition underline"
            >
              View →
            </button>
          </div>
        )}

        {/* ── Filter Tabs ── */}
        {!loading && bookings.length > 0 && (
          <div className="flex gap-1 mb-4 bg-white border border-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
            {[
              { value: "all",       label: "All"       },
              { value: "today",     label: `Today ${todaysBookings.length > 0 ? `(${todaysBookings.length})` : ""}` },
              { value: "pending",   label: "Pending"   },
              { value: "confirmed", label: "Confirmed" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition relative ${
                  filter === value
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
                {value === "pending" && stats.pending > 0 && (
                  <span className="ml-1.5 bg-amber-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {stats.pending}
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
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Bookings from guests will appear here once they start reserving your properties.
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-12 text-center">
            <p className="text-sm text-gray-400">
              {filter === "today"
                ? "No check-ins or check-outs today"
                : `No ${filter} bookings`}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {filteredBookings.map((booking) => (
              <BookingRow
                key={booking._id}
                booking={booking}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                actionId={actionId}
                onViewDetail={setSelectedBooking}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          actionId={actionId}
        />
      )}
    </div>
  );
};

export default HostBookings;
