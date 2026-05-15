import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPropertyById,
  updateProperty,
  deleteProperty,
} from "../services/propertyService";
import toast from "react-hot-toast";
import { FaUpload, FaTimes, FaChevronLeft, FaTrash } from "react-icons/fa";
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

const EditProperty = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [existingImages,  setExistingImages]  = useState([]);
  const [newImages,       setNewImages]       = useState([]);
  const [newPreviews,     setNewPreviews]     = useState([]);

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
    isAvailable:  true,
  });

  useEffect(() => { fetchProperty(); }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const { data } = await getPropertyById(id);
      const p = data.property;
      setFormData({
        title:        p.title        || "",
        description:  p.description  || "",
        price:        p.price        || "",
        propertyType: p.propertyType || "apartment",
        maxGuests:    p.maxGuests    || 1,
        bedrooms:     p.bedrooms     || 1,
        bathrooms:    p.bathrooms    || 1,
        address:      p.location?.address   || "",
        city:         p.location?.city      || "",
        state:        p.location?.state     || "",
        country:      p.location?.country   || "India",
        zipCode:      p.location?.zipCode   || "",
        latitude:     p.location?.latitude  || null,
        longitude:    p.location?.longitude || null,
        amenities:    p.amenities    || [],
        isAvailable:  p.isAvailable  ?? true,
      });
      setExistingImages(p.images || []);
    } catch {
      toast.error("Failed to load property");
      navigate("/my-listings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newImages.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }
    setNewImages((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeExistingImage = (index) =>
    setExistingImages((prev) => prev.filter((_, i) => i !== index));

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingImages.length === 0 && newImages.length === 0) {
      toast.error("Please keep at least one photo");
      return;
    }
    const data = new FormData();
    data.append("title",        formData.title);
    data.append("description",  formData.description);
    data.append("price",        formData.price);
    data.append("propertyType", formData.propertyType);
    data.append("maxGuests",    formData.maxGuests);
    data.append("bedrooms",     formData.bedrooms);
    data.append("bathrooms",    formData.bathrooms);
    data.append("isAvailable",  formData.isAvailable);
    data.append("location", JSON.stringify({
      address:   formData.address,
      city:      formData.city,
      state:     formData.state,
      country:   formData.country,
      zipCode:   formData.zipCode,
      latitude:  formData.latitude  || null,
      longitude: formData.longitude || null,
    }));
    data.append("amenities",       JSON.stringify(formData.amenities));
    data.append("existingImages",  JSON.stringify(existingImages));
    newImages.forEach((img) => data.append("images", img));

    try {
      setSaving(true);
      await updateProperty(id, data);
      toast.success("Property updated successfully!");
      navigate("/my-listings");
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) errors.forEach((err) => toast.error(err.message));
      else toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      setDeleting(true);
      await deleteProperty(id);
      toast.success("Property deleted");
      navigate("/my-listings");
    } catch {
      toast.error("Failed to delete property");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button
              onClick={() => navigate("/my-listings")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-4"
            >
              <FaChevronLeft size={12} />
              Back to listings
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit listing
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Update your property details
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-4 py-2.5 rounded-xl transition disabled:opacity-50 bg-white mt-4"
          >
            <FaTrash size={12} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 1. Basic Info ── */}
          <Section step="1" title="Basic info" subtitle="Update your property details">

            <Field label="Property title" required>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
              />
            </Field>

            <Field label="Description" required hint={`${formData.description.length}/2000`}>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                maxLength={2000}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition resize-none bg-white"
              />
            </Field>

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
                  required
                  min="1"
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                />
              </div>
            </Field>

            {/* Availability toggle */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Property available
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Hide from search when turned off
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-rose-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City" required>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                />
              </Field>
              <Field label="State">
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                />
              </Field>
              <Field label="ZIP Code">
                <input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition bg-white"
                />
              </Field>
            </div>

            <Field label="Pin on map" hint="Guests will see this">
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
                        active ? "bg-white border-white" : "border-gray-300"
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
          <Section step="5" title="Photos" subtitle="Manage your property photos">

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">
                  Current photos — click ✕ to remove
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((img, i) => (
                    <div
                      key={img.public_id || i}
                      className="relative rounded-xl overflow-hidden aspect-square group"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(i)}
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
              </div>
            )}

            {/* New previews */}
            {newPreviews.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">New photos to add</p>
                <div className="grid grid-cols-3 gap-2">
                  {newPreviews.map((src, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden aspect-square group"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-500 hover:text-white transition"
                      >
                        <FaTimes size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload */}
            {existingImages.length + newImages.length < 10 && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-xl p-8 cursor-pointer transition group">
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center mb-3 transition">
                  <FaUpload size={16} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Add more photos
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {10 - existingImages.length - newImages.length} slots remaining
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleNewImages}
                  className="hidden"
                />
              </label>
            )}
          </Section>

          {/* ── Save Button ── */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-medium py-4 rounded-2xl transition text-sm"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving changes...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;