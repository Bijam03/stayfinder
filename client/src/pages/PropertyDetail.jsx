import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPropertyById } from "../services/propertyService";
import { createBooking, getBookedDates } from "../services/bookingService";
import { useAuth } from "../context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import {
  FaStar,
  FaMapMarkerAlt,
  FaUser,
  FaBed,
  FaBath,
  FaWifi,
  FaSnowflake,
  FaParking,
  FaSwimmingPool,
  FaTv,
  FaUtensils,
  FaChevronLeft,
  FaChevronRight,
  FaShare,
  FaHeart,
  FaShieldAlt,
} from "react-icons/fa";
import ReviewSection from "../components/property/ReviewSection";
import PropertyLocationMap from "../components/property/PropertyLocationMap";
import PayButton from "../components/property/PayButton";

const amenityIcons = {
  wifi: { icon: FaWifi, label: "WiFi" },
  ac: { icon: FaSnowflake, label: "Air Conditioning" },
  kitchen: { icon: FaUtensils, label: "Kitchen" },
  tv: { icon: FaTv, label: "TV" },
  parking: { icon: FaParking, label: "Free Parking" },
  pool: { icon: FaSwimmingPool, label: "Swimming Pool" },
  heating: { icon: FaSnowflake, label: "Heating" },
  gym: { icon: FaUser, label: "Gym" },
  balcony: { icon: FaUser, label: "Balcony" },
  washing_machine: { icon: FaUser, label: "Washing Machine" },
  pet_friendly: { icon: FaUser, label: "Pet Friendly" },
  smoking_allowed: { icon: FaUser, label: "Smoking Allowed" },
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);
  const [saved, setSaved] = useState(false);

  // Booking
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [numGuests, setNumGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  useEffect(() => { fetchProperty(); }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const { data } = await getPropertyById(id);
      setProperty(data.property);
      const datesRes = await getBookedDates(id);
      setBookedDates(datesRes.data.bookedDates);
    } catch {
      toast.error("Property not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const getDisabledDates = () => {
    const disabled = [];
    bookedDates.forEach(({ checkIn, checkOut }) => {
      let current = new Date(checkIn);
      current.setHours(0, 0, 0, 0);
      const end = new Date(checkOut);
      end.setHours(0, 0, 0, 0);
      while (current <= end) {
        disabled.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });
    return disabled;
  };

  const isRangeBlocked = (start, end) => {
    if (!start || !end) return false;
    const s = new Date(start); s.setHours(0, 0, 0, 0);
    const e = new Date(end); e.setHours(0, 0, 0, 0);
    return bookedDates.some(({ checkIn, checkOut }) => {
      const bs = new Date(checkIn); bs.setHours(0, 0, 0, 0);
      const be = new Date(checkOut); be.setHours(0, 0, 0, 0);
      return s < be && e > bs;
    });
  };

  const formatDateForAPI = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const numNights = checkIn && checkOut
    ? Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = numNights * (property?.price || 0);

  const handleBooking = async () => {
    if (!user) { toast.error("Please login to book"); navigate("/login"); return; }
    if (!isGuest) { toast.error("Only guests can make bookings"); return; }
    if (!checkIn || !checkOut) { toast.error("Please select check-in and check-out dates"); return; }
    try {
      setBookingLoading(true);
      const { data } = await createBooking({
        propertyId: property._id,
        checkIn: formatDateForAPI(checkIn),
        checkOut: formatDateForAPI(checkOut),
        numGuests,
        specialRequests,
      });
      setPendingBooking(data.booking);
      toast.success("Dates reserved! Now complete your payment.");
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) errors.forEach((e) => toast.error(e.message));
      else toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-6 bg-gray-100 rounded w-1/4 mb-6"></div>
          <div className="h-8 bg-gray-100 rounded w-2/3 mb-3"></div>
          <div className="h-4 bg-gray-100 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-100 rounded-2xl mb-8"></div>
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-4">
              <div className="h-32 bg-gray-100 rounded-2xl"></div>
              <div className="h-48 bg-gray-100 rounded-2xl"></div>
            </div>
            <div className="h-80 bg-gray-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Breadcrumb + Actions ── */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition"
          >
            <FaChevronLeft size={12} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success("Link copied!");
              }}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition"
            >
              <FaShare size={12} />
              Share
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className={`flex items-center gap-2 text-sm border px-3 py-1.5 rounded-lg transition ${saved
                ? "border-rose-200 text-rose-500 bg-rose-50"
                : "border-gray-200 text-gray-600 hover:text-gray-900"
                }`}
            >
              <FaHeart size={12} className={saved ? "text-rose-500" : ""} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* ── Title ── */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
          {property.title}
        </h1>

        {/* ── Meta Row ── */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
          {property.numReviews > 0 && (
            <div className="flex items-center gap-1">
              <FaStar className="text-gray-900" size={13} />
              <span className="font-semibold text-gray-900">
                {property.rating?.toFixed(1)}
              </span>
              <span className="text-gray-400">
                · {property.numReviews} review{property.numReviews !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-1 text-gray-600">
            <FaMapMarkerAlt size={12} className="text-gray-400" />
            <span className="underline cursor-pointer hover:text-gray-900">
              {property.location?.city}, {property.location?.state},{" "}
              {property.location?.country}
            </span>
          </div>
          <span className="text-gray-300">·</span>
          <span className="capitalize text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium">
            {property.propertyType}
          </span>
        </div>

        {/* ── Image Gallery ── */}
        <div className="relative rounded-2xl overflow-hidden mb-10 bg-gray-100 aspect-video max-h-[480px]">
          {property.images && property.images.length > 0 ? (
            <>
              <img
                src={property.images[currentImage]?.url}
                alt={property.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {/* Image counter badge */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                {currentImage + 1} / {property.images.length}
              </div>
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImage((p) =>
                        p === 0 ? property.images.length - 1 : p - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition"
                  >
                    <FaChevronLeft size={13} className="text-gray-700" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImage((p) =>
                        p === property.images.length - 1 ? 0 : p + 1
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition"
                  >
                    <FaChevronRight size={13} className="text-gray-700" />
                  </button>
                  {/* Dot indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {property.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`rounded-full transition-all ${i === currentImage
                          ? "w-5 h-1.5 bg-white"
                          : "w-1.5 h-1.5 bg-white/60"
                          }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
              🏠
            </div>
          )}
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 pb-8 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
                  <FaUser size={14} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Guests</p>
                  <p className="text-sm font-semibold">{property.maxGuests}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
                  <FaBed size={14} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bedrooms</p>
                  <p className="text-sm font-semibold">{property.bedrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
                  <FaBath size={14} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bathrooms</p>
                  <p className="text-sm font-semibold">{property.bathrooms}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pb-8 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                About this place
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="pb-8 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  What this place offers
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((amenity) => {
                    const item = amenityIcons[amenity];
                    const Icon = item?.icon || FaUser;
                    return (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition"
                      >
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon size={14} className="text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-700">
                          {item?.label || amenity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Host */}
            <div className="pb-8 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Meet your host
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {property.host?.avatar ? (
                    <img
                      src={property.host.avatar}
                      alt={property.host.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-gray-400">
                      {property.host?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {property.host?.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {property.host?.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <FaShieldAlt size={12} className="text-green-500" />
                    <span className="text-xs text-gray-500">
                      Verified host
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="pb-8 border-b border-gray-100">
              <PropertyLocationMap property={property} />
            </div>

            {/* Reviews */}
            <ReviewSection propertyId={id} />
          </div>

          {/* ── Right Column — Booking Card ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mb-5">
                  <span className="text-2xl font-semibold text-gray-900">
                    ₹{property.price?.toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-sm">/ night</span>
                  {property.numReviews > 0 && (
                    <div className="ml-auto flex items-center gap-1">
                      <FaStar size={12} className="text-gray-900" />
                      <span className="text-sm font-semibold text-gray-900">
                        {property.rating?.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Date Pickers */}
                <div className="border border-gray-300 rounded-xl overflow-hidden mb-3">
                  <div className="grid grid-cols-2">
                    <div className="p-3 border-r border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                        Check-in
                      </p>
                      <DatePicker
                        selected={checkIn}
                        onChange={(date) => {
                          setCheckIn(date);
                          if (checkOut && isRangeBlocked(date, checkOut)) {
                            setCheckOut(null);
                            toast.error("Dates overlap a booked period");
                          }
                        }}
                        selectsStart
                        startDate={checkIn}
                        endDate={checkOut}
                        minDate={new Date()}
                        excludeDates={getDisabledDates()}
                        placeholderText="Add date"
                        className="text-sm text-gray-700 outline-none cursor-pointer w-full bg-transparent"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                        Check-out
                      </p>
                      <DatePicker
                        selected={checkOut}
                        onChange={(date) => {
                          if (isRangeBlocked(checkIn, date)) {
                            toast.error("Dates overlap an existing booking");
                            setCheckOut(null);
                            return;
                          }
                          setCheckOut(date);
                        }}
                        selectsEnd
                        startDate={checkIn}
                        endDate={checkOut}
                        minDate={
                          checkIn
                            ? new Date(checkIn.getTime() + 86400000)
                            : new Date()
                        }
                        excludeDates={getDisabledDates()}
                        placeholderText="Add date"
                        className="text-sm text-gray-700 outline-none cursor-pointer w-full bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="p-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                      Guests
                    </p>
                    <select
                      value={numGuests}
                      onChange={(e) => setNumGuests(Number(e.target.value))}
                      className="w-full text-sm text-gray-700 outline-none bg-transparent"
                    >
                      {[...Array(property.maxGuests)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} guest{i > 0 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Overlap warning */}
                {checkIn && checkOut && isRangeBlocked(checkIn, checkOut) && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3 text-xs text-red-600">
                    ⚠️ Dates overlap an existing booking. Please choose
                    different dates.
                  </div>
                )}

                {/* Special Requests */}
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Special requests (optional)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-600 outline-none focus:border-gray-400 resize-none mb-3 placeholder-gray-300"
                />

                {/* Price Breakdown */}
                {numNights > 0 && (
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="underline">
                        ₹{property.price?.toLocaleString()} × {numNights}{" "}
                        night{numNights !== 1 ? "s" : ""}
                      </span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-gray-900">
                      <span>Total before taxes</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                {!pendingBooking ? (
                  // ── STEP 1: Guest fills form → clicks Reserve ─────
                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300
               text-white font-medium py-4 rounded-2xl transition text-sm"
                  >
                    {bookingLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white
                         rounded-full animate-spin" />
                        Checking availability...
                      </span>
                    ) : (
                      "Reserve Now"
                    )}
                  </button>
                ) : (
                  // ── STEP 2: Booking created → show Pay button ─────
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-medium text-green-700">
                        ✅ Dates are available! Complete payment to confirm.
                      </p>
                    </div>
                    <PayButton booking={pendingBooking} />
                    <button
                      onClick={() => setPendingBooking(null)}
                      className="w-full text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                      Cancel and choose different dates
                    </button>
                  </div>
                )}
                {/* No charge note */}
                {checkIn && checkOut && !isRangeBlocked(checkIn, checkOut) && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    You won't be charged yet
                  </p>
                )}

                {!user && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    You need to log in to make a booking
                  </p>
                )}
              </div>

              {/* Safety note */}
              <div className="flex items-start gap-3 mt-4 px-2">
                <FaShieldAlt
                  size={14}
                  className="text-gray-400 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-gray-400 leading-relaxed">
                  To protect your payment, never transfer money or communicate
                  outside of StayFinder.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;