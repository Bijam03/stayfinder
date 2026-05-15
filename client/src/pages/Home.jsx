import { useState, useEffect } from "react";
import { getAllProperties } from "../services/propertyService";
import PropertyCard from "../components/property/PropertyCard";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaSlidersH,
  FaTimes,
  FaHome,
  FaBuilding,
  FaWarehouse,
  FaHotel,
} from "react-icons/fa";
import { MdVilla, MdApartment } from "react-icons/md";

// ── Property type filters ─────────────────────────────────
const propertyTypes = [
  { value: "", label: "All", icon: FaHome },
  { value: "apartment", label: "Apartment", icon: MdApartment },
  { value: "house", label: "House", icon: FaHome },
  { value: "villa", label: "Villa", icon: MdVilla },
  { value: "studio", label: "Studio", icon: FaBuilding },
  { value: "hotel", label: "Hotel", icon: FaHotel },
  { value: "hostel", label: "Hostel", icon: FaWarehouse },
];

// ── Skeleton Card ─────────────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-2xl h-52 mb-3" />
    <div className="space-y-2 px-1">
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
    </div>
  </div>
);

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [activeType, setActiveType] = useState("");

  const [filters, setFilters] = useState({
    city: "",
    minPrice: "",
    maxPrice: "",
    propertyType: "",
    maxGuests: "",
  });

  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async (params = {}) => {
    try {
      setLoading(true);
      const { data } = await getAllProperties(params);
      setProperties(data.properties);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanFilters = Object.fromEntries(
      Object.entries({ ...filters, city: searchInput }).filter(
        ([_, v]) => v !== ""
      )
    );
    fetchProperties(cleanFilters);
  };

  const handleTypeFilter = (type) => {
    setActiveType(type);
    const cleanFilters = Object.fromEntries(
      Object.entries({
        ...filters,
        city: searchInput,
        propertyType: type,
      }).filter(([_, v]) => v !== "")
    );
    fetchProperties(cleanFilters);
  };

  const handleReset = () => {
    setFilters({
      city: "", minPrice: "", maxPrice: "",
      propertyType: "", maxGuests: "",
    });
    setSearchInput("");
    setActiveType("");
    fetchProperties();
  };

  const hasActiveFilters =
    searchInput ||
    activeType ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.maxGuests;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
              Find your perfect stay
            </h1>
            <p className="text-gray-500 text-base max-w-lg mx-auto">
              Discover unique homes, apartments and villas across India
            </p>
          </div>

          {/* ── Search Bar ── */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">

              {/* City search */}
              <div className="flex items-center gap-3 flex-1 px-5 py-4">
                <FaSearch size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by city..."
                  className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="text-gray-300 hover:text-gray-500 transition"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200" />

              {/* Filters toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition ${showFilters || filters.minPrice || filters.maxPrice || filters.maxGuests
                    ? "text-rose-500"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <FaSlidersH size={14} />
                <span className="hidden sm:inline">Filters</span>
                {(filters.minPrice || filters.maxPrice || filters.maxGuests) && (
                  <span className="w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200" />

              {/* Search button */}
              <button
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-6 py-4 transition"
              >
                Search
              </button>
            </div>

            {/* ── Expanded Filters ── */}
            {showFilters && (
              <div className="mt-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Min Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) =>
                        setFilters({ ...filters, minPrice: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Max Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        setFilters({ ...filters, maxPrice: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Guests
                    </label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={filters.maxGuests}
                      onChange={(e) =>
                        setFilters({ ...filters, maxGuests: e.target.value })
                      }
                      min="1"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 transition"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({
                        ...filters,
                        minPrice: "",
                        maxPrice: "",
                        maxGuests: "",
                      });
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline transition"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* ── Property Type Filter Pills ── */}
      <div className="border-b border-gray-100 sticky top-16 bg-white z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
            {propertyTypes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleTypeFilter(value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${activeType === value
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Properties Section ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Results header */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {hasActiveFilters ? (
                <>
                  <span className="font-semibold text-gray-900">
                    {total}
                  </span>{" "}
                  {total === 1 ? "result" : "results"} found
                </>
              ) : (
                <>
                  <span className="font-semibold text-gray-900">
                    {total}
                  </span>{" "}
                  {total === 1 ? "property" : "properties"} available
                </>
              )}
            </p>

            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition"
              >
                <FaTimes size={11} />
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaSearch size={20} className="text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              No properties found
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
              We couldn't find any properties matching your search.
              Try adjusting your filters or search in a different city.
            </p>
            <button
              onClick={handleReset}
              className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Properties grid */}
        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">

            {/* Filter properties with valid _id */}
            {properties
              .filter((p) => p && p._id)
              .map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}

          </div>
        )}
      </div>
    </div>
  );
};

export default Home;