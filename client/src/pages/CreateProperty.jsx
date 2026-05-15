import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProperty } from "../services/propertyService";
import toast from "react-hot-toast";
import { FaUpload, FaTimes, FaChevronLeft } from "react-icons/fa";
import LocationPicker from "../components/property/LocationPicker";

const AMENITIES = [
  { value: "wifi",            label: "WiFi"             },
  { value: "ac",              label: "Air Conditioning"  },
  { value: "heating",         label: "Heating"           },
  { value: "kitchen",         label: "Kitchen"           },
  { value: "tv",              label: "TV"                },
  { value: "parking",         label: "Free Parking"      },
  { value: "pool",            label: "Swimming Pool"     },
  { value: "gym",             label: "Gym"               },
  { value: "washing_machine", label: "Washing Machine"   },
  { value: "balcony",         label: "Balcony"           },
  { value: "pet_friendly",    label: "Pet Friendly"      },
  { value: "smoking_allowed", label: "Smoking Allowed"   },
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house",     label: "House"     },
  { value: "villa",     label: "Villa"     },
  { value: "studio",    label: "Studio"    },
  { value: "hotel",     label: "Hotel"     },
  { value: "hostel",    label: "Hostel"    },
];

// ── Reusable Input ────────────────────────────────────────
const Field = ({ label, required, hint, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
    {children}
  </div>
);

// ── Section Card ──────────────────────────────────────────
const Section = ({ step, title, subtitle, children }) => (
  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
    <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-4">
      <div className="w-7 h-7 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="px-6 py-5 space-y-5">{children}</div>
  </div>
);

// ── Counter Input ─────────────────────────────────────────
const Counter = ({ label, value, onChange, min = 1 }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-700">{label}</span>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition text-lg leading-none"
      >
        −
      </button>
      <span className="text-sm font-medium text-gray-900 w-6 text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition text-lg leading-none"
      >
        +
      </button>
    </div>
  </div>
);

const CreateProperty = () => {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [images, setImages]     = useState([]);
  const [previews, setPreviews] = useState([]);

  const [formData, setFormData] = useState({
    title:        "",
    description:  "",
    price:        "",
    propertyType: "apartment",
    maxGuests:    1,
    bedrooms:     1,
    bathrooms:    1,
    address:      "",
    city:         "",
    state:        "",
    country:      "India",
    zipCode:      "",
    latitude:     null,
    longitude:    null,
    amenities:    [],
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleAmenityToggle = (value) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter((a) => a !== value)
        : [...prev.amenities, value],
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error("Please add at least one photo");
      return;
    }
    if (!formData.city) {
      toast.error("City is required");
      return;
    }

    const data = new FormData();
    data.append("title",       formData.title);
    data.append("description", formData.description);
    data.append("price",       formData.price);
    data.append("propertyType",formData.propertyType);
    data.append("maxGuests",   formData.maxGuests);
    data.append("bedrooms",    formData.bedrooms);
    data.append("bathrooms",   formData.bathrooms);
    data.append("location", JSON.stringify({
      address:   formData.address,
      city:      formData.city,
      state:     formData.state,
      country:   formData.country,
      zipCode:   formData.zipCode,
      latitude:  formData.latitude  || null,
      longitude: formData.longitude || null,
    }));
    data.append("amenities", JSON.stringify(formData.amenities));
    images.forEach((img) => data.append("images", img));

    try {
      setLoading(true);
      await createProperty(data);
      toast.success("Property listed successfully!");
      navigate("/my-listings");
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) errors.forEach((err) => toast.error(err.message));
      else toast.error(error.response?.data?.message || "Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-4"
          >
            <FaChevronLeft size={12} />
            Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            List your property
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the details below to start hosting guests
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 1. Basic Info ── */}
          <Section step="1" title="Basic info" subtitle="Tell guests about your place">

            <Field label="Property title" required>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Cozy apartment in Bandra West"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
              />
            </Field>

            <Field label="Description" required hint={`${formData.description.length}/2000`}>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what makes your place special — the space, neighbourhood, house rules..."
                required
                rows={4}
                maxLength={2000}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition resize-none bg-white"
              />
            </Field>

            {/* Property Type */}
            <Field label="Property type">
              <div className="grid grid-cols-3 gap-2">
                {PROPERTY_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, propertyType: value })
                    }
                    className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition ${
                      formData.propertyType === value
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Price per night (₹)" required>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  ₹
                </span>
                <input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  required
                  min="1"
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                />
              </div>
            </Field>
          </Section>

          {/* ── 2. Capacity ── */}
          <Section step="2" title="Capacity" subtitle="How many guests can stay?">
            <Counter
              label="Guests"
              value={formData.maxGuests}
              onChange={(v) => setFormData({ ...formData, maxGuests: v })}
            />
            <Counter
              label="Bedrooms"
              value={formData.bedrooms}
              onChange={(v) => setFormData({ ...formData, bedrooms: v })}
            />
            <Counter
              label="Bathrooms"
              value={formData.bathrooms}
              onChange={(v) => setFormData({ ...formData, bathrooms: v })}
            />
          </Section>

          {/* ── 3. Location ── */}
          <Section step="3" title="Location" subtitle="Where is your property?">
            <Field label="Street address">
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 14 Hill Road"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City" required>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                />
              </Field>
              <Field label="State">
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Country">
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="India"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                />
              </Field>
              <Field label="ZIP Code">
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="400050"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                />
              </Field>
            </div>

            {/* Map Picker */}
            <Field
              label="Pin on map"
              hint="Guests will see this"
            >
              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationSelect={handleLocationSelect}
                city={formData.city}
                address={formData.address}
              />
            </Field>
          </Section>

          {/* ── 4. Amenities ── */}
          <Section step="4" title="Amenities" subtitle="What does your place offer?">
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES.map(({ value, label }) => {
                const active = formData.amenities.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleAmenityToggle(value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition text-left ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                        active
                          ? "bg-white border-white"
                          : "border-gray-300"
                      }`}
                    >
                      {active && (
                        <span className="text-gray-900 text-xs font-bold">✓</span>
                      )}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── 5. Photos ── */}
          <Section
            step="5"
            title="Photos"
            subtitle="Add at least one photo of your property"
          >
            {/* Previews grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative rounded-xl overflow-hidden aspect-square group"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-500 hover:text-white transition"
                    >
                      <FaTimes size={9} />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload area */}
            {images.length < 10 && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-xl p-8 cursor-pointer transition group">
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center mb-3 transition">
                  <FaUpload size={16} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Click to upload photos
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG up to 5MB ·{" "}
                  {10 - images.length} slot{10 - images.length !== 1 ? "s" : ""}{" "}
                  remaining
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </Section>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-medium py-4 rounded-2xl transition text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating listing...
              </span>
            ) : (
              "Publish Listing"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProperty;