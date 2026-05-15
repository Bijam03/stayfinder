import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, updateAvatar } from "../services/authService";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  FaCamera,
  FaShieldAlt,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaChevronRight,
} from "react-icons/fa";

// ── Input Field ───────────────────────────────────────────
const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={13}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
        />
      )}
      {children}
    </div>
  </div>
);

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [edited, setEdited] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setEdited(true);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));

    const data = new FormData();
    data.append("avatar", file);

    try {
      setUploadingAvatar(true);
      const { data: res } = await updateAvatar(data);
      setUser((prev) => ({ ...prev, avatar: res.avatar }));
      toast.success("Photo updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data } = await updateProfile(formData);
      setUser((prev) => ({ ...prev, ...data.user }));
      setEdited(false);
      toast.success("Profile saved!");
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) errors.forEach((err) => toast.error(err.message));
      else toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarPreview || user?.avatar;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal information
          </p>
        </div>

        {/* ── Avatar + Name Card ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-5">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-rose-50 flex items-center justify-center">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-rose-400">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Camera button */}
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-gray-900 hover:bg-gray-700 text-white rounded-xl flex items-center justify-center shadow transition disabled:opacity-60"
              >
                {uploadingAvatar ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <FaCamera size={11} />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {user?.name}
              </h2>
              <p className="text-sm text-gray-500 truncate mt-0.5">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full capitalize">
                  {user?.role}
                </span>
                {user?.createdAt && (
                  <span className="text-xs text-gray-400">
                    Joined {format(new Date(user.createdAt), "MMM yyyy")}
                  </span>
                )}
              </div>
            </div>

            {/* Change photo button */}
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploadingAvatar}
              className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl transition disabled:opacity-50"
            >
              {uploadingAvatar ? "Uploading..." : "Change photo"}
            </button>
          </div>
        </div>

        {/* ── Personal Info Form ── */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Personal Information
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

            {/* Name */}
            <Field label="Full Name" icon={FaUser}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-gray-400 transition bg-white"
              />
            </Field>

            {/* Email — read only */}
            <Field label="Email Address" icon={FaEnvelope}>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Email address cannot be changed
              </p>
            </Field>

            {/* Phone */}
            <Field label="Phone Number" icon={FaPhone}>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-gray-400 transition bg-white"
              />
            </Field>

            {/* Save button */}
            <button
              type="submit"
              disabled={saving || !edited}
              className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-medium py-3 rounded-xl transition text-sm"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : edited ? (
                "Save Changes"
              ) : (
                "No Changes"
              )}
            </button>
          </form>
        </div>

        {/* ── Account Details ── */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Account Details
            </h2>
          </div>

          <div className="divide-y divide-gray-100">

            {/* Role */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FaShieldAlt size={13} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Account type
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your role on StayFinder
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full capitalize">
                {user?.role}
              </span>
            </div>

            {/* Member since */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FaCalendarAlt size={13} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Member since
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Account creation date
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {user?.createdAt
                  ? format(new Date(user.createdAt), "dd MMM yyyy")
                  : "—"}
              </span>
            </div>

            {/* Account ID */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FaUser size={13} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Account ID
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your unique identifier
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2.5 py-1 rounded-lg">
                {user?._id?.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Quick Links
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {user?.role === "host" ? (
              <>
                {[
                  { to: "/dashboard", label: "Dashboard", sub: "View your stats and earnings" },
                  { to: "/my-listings", label: "My Listings", sub: "Manage your properties" },
                  { to: "/host-bookings", label: "Guest Bookings", sub: "View and manage bookings" },
                ].map(({ to, label, sub }) => (
                  <a
                    key={to}
                    href={to}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>

                    <FaChevronRight
                      size={12}
                      className="text-gray-300 group-hover:text-gray-500 transition"
                    />
                  </a>
                ))}
              </>
            ) : (
              <>
                {[
                  { to: "/", label: "Browse Properties", sub: "Find your next stay" },
                  { to: "/my-bookings", label: "My Bookings", sub: "View your reservations" },
                ].map(({ to, label, sub }) => (
                  <a
                    key={to}
                    href={to}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>

                    <FaChevronRight
                      size={12}
                      className="text-gray-300 group-hover:text-gray-500 transition"
                    />
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;