import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyListings, deleteProperty } from "../services/propertyService";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaUser,
  FaStar,
  FaEye,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

// ── Empty State ───────────────────────────────────────────
const EmptyState = () => (
  <div className="text-center py-20">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <FaPlus size={20} className="text-gray-300" />
    </div>
    <h3 className="text-base font-semibold text-gray-700 mb-2">
      No listings yet
    </h3>
    <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
      Start hosting by adding your first property. It only takes a few minutes.
    </p>
    <Link
      to="/create-property"
      className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition"
    >
      <FaPlus size={12} />
      Add your first property
    </Link>
  </div>
);

// ── Skeleton ──────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="flex gap-4 p-5 animate-pulse">
    <div className="w-28 h-24 bg-gray-100 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2.5 py-1">
      <div className="h-3 bg-gray-100 rounded w-1/3" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-2 mt-3">
        <div className="h-7 w-16 bg-gray-100 rounded-lg" />
        <div className="h-7 w-16 bg-gray-100 rounded-lg" />
        <div className="h-7 w-16 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
);

// ── Property Row ──────────────────────────────────────────
const PropertyRow = ({ property, onDelete, deleting }) => {
  const {
    _id, title, images, price, location,
    maxGuests, bedrooms, bathrooms,
    propertyType, isAvailable, rating, numReviews,
  } = property;

  return (
    <div className="flex flex-col sm:flex-row gap-0 hover:bg-gray-50/50 transition group">

      {/* Image */}
      <div className="sm:w-36 h-44 sm:h-auto flex-shrink-0 overflow-hidden bg-gray-100 rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
        {images?.[0] ? (
          <img
            src={images[0].url}
            alt={title}
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

          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              {/* Type + availability */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                  {propertyType}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    isAvailable ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {isAvailable
                    ? <FaToggleOn size={14} />
                    : <FaToggleOff size={14} />
                  }
                  {isAvailable ? "Listed" : "Hidden"}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {title}
              </h3>
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className="text-base font-semibold text-gray-900">
                ₹{price?.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">/ night</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
            <FaMapMarkerAlt size={10} />
            <span>
              {location?.city}
              {location?.state ? `, ${location.state}` : ""}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FaUser size={10} className="text-gray-300" />
              {maxGuests} guest{maxGuests !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <FaBed size={10} className="text-gray-300" />
              {bedrooms} bed{bedrooms !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <FaBath size={10} className="text-gray-300" />
              {bathrooms} bath{bathrooms !== 1 ? "s" : ""}
            </span>
            {numReviews > 0 && (
              <span className="flex items-center gap-1">
                <FaStar size={10} className="text-amber-400" />
                {rating?.toFixed(1)}
                <span className="text-gray-400">
                  ({numReviews})
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          <Link
            to={`/properties/${_id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg transition"
          >
            <FaEye size={11} />
            View
          </Link>
          <Link
            to={`/edit-property/${_id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg transition"
          >
            <FaEdit size={11} />
            Edit
          </Link>
          <button
            onClick={() => onDelete(_id)}
            disabled={deleting === _id}
            className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-2 rounded-lg transition disabled:opacity-50 ml-auto"
          >
            <FaTrash size={11} />
            {deleting === _id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────
const MyListings = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deleting, setDeleting]     = useState(null);
  const [filter, setFilter]         = useState("all");

  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
    try {
      const { data } = await getMyListings();
      setProperties(data.properties);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      setDeleting(id);
      await deleteProperty(id);
      setProperties((prev) => prev.filter((p) => p._id !== id));
      toast.success("Property deleted");
    } catch {
      toast.error("Failed to delete property");
    } finally {
      setDeleting(null);
    }
  };

  const filteredProperties = properties.filter((p) => {
    if (filter === "active")   return p.isAvailable;
    if (filter === "inactive") return !p.isAvailable;
    return true;
  });

  const activeCount   = properties.filter((p) => p.isAvailable).length;
  const inactiveCount = properties.filter((p) => !p.isAvailable).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              My Listings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading
                ? "Loading..."
                : `${properties.length} propert${properties.length !== 1 ? "ies" : "y"}`
              }
            </p>
          </div>
          <Link
            to="/create-property"
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
          >
            <FaPlus size={12} />
            Add Property
          </Link>
        </div>

        {/* ── Summary Cards ── */}
        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {properties.length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Total</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-semibold text-green-600">
                {activeCount}
              </p>
              <p className="text-xs text-green-500 mt-0.5">Listed</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-semibold text-gray-400">
                {inactiveCount}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Hidden</p>
            </div>
          </div>
        )}

        {/* ── Filter Tabs ── */}
        {!loading && properties.length > 0 && (
          <div className="flex gap-1 mb-4 bg-white border border-gray-100 rounded-xl p-1 w-fit">
            {[
              { value: "all",      label: "All"      },
              { value: "active",   label: "Listed"   },
              { value: "inactive", label: "Hidden"   },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === value
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl">
            <EmptyState />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center">
            <p className="text-sm text-gray-400">
              No {filter === "active" ? "listed" : "hidden"} properties
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {filteredProperties.map((property) => (
              <PropertyRow
                key={property._id}
                property={property}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyListings;