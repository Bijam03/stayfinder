import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../services/authService";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash, FaHome, FaUser } from "react-icons/fa";

const Register = () => {
  const [formData, setFormData] = useState({
    name:     "",
    email:    "",
    password: "",
    role:     "guest",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState({});

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name)     newErrors.name     = "Name is required";
    if (!formData.email)    newErrors.email    = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await registerUser(formData);
      login(data.user);
      toast.success("Account created successfully!");
      navigate(data.user.role === "host" ? "/dashboard" : "/");
    } catch (error) {
      const errs = error.response?.data?.errors;
      if (errs) {
        errs.forEach((err) => toast.error(err.message));
      } else {
        toast.error(error.response?.data?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Left Panel — Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col justify-between p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-white font-semibold text-lg">StayFinder</span>
        </Link>

        {/* Center */}
        <div>
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Start hosting or
            <br />
            start exploring.
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm">
            Join thousands of guests and hosts on StayFinder.
            Your next adventure is just one click away.
          </p>

          {/* Role cards */}
          <div className="flex gap-4 mt-10">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="w-9 h-9 bg-rose-500/20 rounded-xl flex items-center justify-center mb-3">
                <FaUser size={15} className="text-rose-400" />
              </div>
              <p className="text-white text-sm font-medium mb-1">
                As a Guest
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Browse and book unique properties across India
              </p>
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center mb-3">
                <FaHome size={15} className="text-amber-400" />
              </div>
              <p className="text-white text-sm font-medium mb-1">
                As a Host
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                List your property and earn from every booking
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <p className="text-gray-600 text-xs">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-gray-300 hover:text-white transition"
          >
            Log in here
          </Link>
        </p>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-gray-900 font-semibold text-lg">
              StayFinder
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Create your account
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Sign up and start your journey today
            </p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "guest" })}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${
                formData.role === "guest"
                  ? "border-rose-500 bg-rose-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                formData.role === "guest"
                  ? "bg-rose-100"
                  : "bg-gray-100"
              }`}>
                <FaUser
                  size={13}
                  className={
                    formData.role === "guest"
                      ? "text-rose-500"
                      : "text-gray-400"
                  }
                />
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  formData.role === "guest"
                    ? "text-rose-700"
                    : "text-gray-700"
                }`}>
                  Guest
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Book stays
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "host" })}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${
                formData.role === "host"
                  ? "border-rose-500 bg-rose-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                formData.role === "host"
                  ? "bg-rose-100"
                  : "bg-gray-100"
              }`}>
                <FaHome
                  size={13}
                  className={
                    formData.role === "host"
                      ? "text-rose-500"
                      : "text-gray-400"
                  }
                />
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  formData.role === "host"
                    ? "text-rose-700"
                    : "text-gray-700"
                }`}>
                  Host
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  List property
                </p>
              </div>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Chinmay Bijamwar"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  errors.name
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-gray-200 focus:border-gray-400 bg-white"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${
                  errors.email
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-gray-200 focus:border-gray-400 bg-white"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 chars, 1 uppercase, 1 number"
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition ${
                    errors.password
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-gray-200 focus:border-gray-400 bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword
                    ? <FaEyeSlash size={15} />
                    : <FaEye size={15} />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-400 mt-1.5">
                Must contain uppercase, lowercase and a number
              </p>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-400 leading-relaxed">
              By signing up, you agree to our{" "}
              <span className="text-gray-600 underline cursor-pointer">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-gray-600 underline cursor-pointer">
                Privacy Policy
              </span>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-medium py-3 rounded-xl transition text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                `Create ${formData.role} account`
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-gray-900 font-medium hover:text-rose-500 transition"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;