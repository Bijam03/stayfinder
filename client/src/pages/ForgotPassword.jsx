import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import toast from "react-hot-toast";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await forgotPassword({ email });
      setSent(true);
      toast.success(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

        {/* Back to login */}
        <Link
          to="/login"
          className="flex items-center gap-2 text-gray-500 hover:text-rose-500 transition text-sm mb-6"
        >
          <FaArrowLeft size={12} />
          Back to Login
        </Link>

        {!sent ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🔐</div>
              <h1 className="text-2xl font-bold text-gray-900">
                Forgot Password?
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          /* Success state */
          <div className="text-center py-6">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Check Your Email!
            </h2>
            <p className="text-gray-500 text-sm mb-2">
              We sent a password reset link to
            </p>
            <p className="font-semibold text-gray-800 mb-6">{email}</p>
            <p className="text-gray-400 text-xs mb-6">
              ⏰ The link expires in 15 minutes.
              <br />
              Don't see it? Check your spam folder.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-rose-500 hover:underline text-sm"
            >
              Try a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;