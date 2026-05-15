import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getPropertyReviews,
  canReviewProperty,
  createReview,
  updateReview,
  deleteReview,
} from "../../services/reviewService";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FaStar, FaEdit, FaTrash } from "react-icons/fa";

// ── Star Rating Input Component ───────────────────────────
const StarRating = ({ value, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <FaStar
            size={readonly ? 16 : 28}
            className={
              star <= (hovered || value)
                ? "text-yellow-400"
                : "text-gray-200"
            }
          />
        </button>
      ))}
      {!readonly && value > 0 && (
        <span className="ml-2 text-sm text-gray-500">
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
};

// ── Rating Breakdown Bar ──────────────────────────────────
const RatingBar = ({ star, count, total }) => {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600 w-6 text-right">{star}</span>
      <FaStar size={12} className="text-yellow-400" />
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-gray-400 w-6">{count}</span>
    </div>
  );
};

// ── Main ReviewSection Component ─────────────────────────
const ReviewSection = ({ propertyId }) => {
  const { user, isGuest } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  // Review form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchReviews();
    if (user && isGuest) checkCanReview();
  }, [propertyId, user]);

  const fetchReviews = async () => {
    try {
      const { data } = await getPropertyReviews(propertyId);
      setReviews(data.reviews);
      setBreakdown(data.breakdown);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const { data } = await canReviewProperty(propertyId);
      setCanReview(data.canReview);
      setHasReviewed(data.hasReviewed);
      setExistingReview(data.existingReview);
    } catch {
      // Not logged in or not a guest — ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("Comment must be at least 10 characters");
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        // Editing existing review
        const { data } = await updateReview(editingId, { rating, comment });
        setReviews((prev) =>
          prev.map((r) => (r._id === editingId ? data.review : r))
        );
        toast.success("Review updated! ✅");
        setEditingId(null);
        setHasReviewed(true);
        setExistingReview(data.review);
      } else {
        // Creating new review
        const { data } = await createReview({
          propertyId,
          rating,
          comment,
        });
        setReviews((prev) => [data.review, ...prev]);
        toast.success("Review submitted! ⭐");
        setCanReview(false);
        setHasReviewed(true);
        setExistingReview(data.review);
      }

      // Refresh breakdown after submit
      const updated = await getPropertyReviews(propertyId);
      setBreakdown(updated.data.breakdown);

      setRating(0);
      setComment("");
      setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingId(review._id);
    setRating(review.rating);
    setComment(review.comment);
    setShowForm(true);
    // Scroll to form
    setTimeout(() => {
      document.getElementById("review-form")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete your review?")) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      const updated = await getPropertyReviews(propertyId);
      setBreakdown(updated.data.breakdown);
      setHasReviewed(false);
      setExistingReview(null);
      setCanReview(true);
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Reviews
          {totalReviews > 0 && (
            <span className="text-gray-400 font-normal text-base ml-2">
              ({totalReviews})
            </span>
          )}
        </h2>
        {totalReviews > 0 && (
          <div className="flex items-center gap-1.5">
            <FaStar className="text-yellow-400" size={18} />
            <span className="text-xl font-bold text-gray-800">{avgRating}</span>
            <span className="text-gray-400 text-sm">/ 5</span>
          </div>
        )}
      </div>

      {/* ── Rating Breakdown ── */}
      {totalReviews > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar
              key={star}
              star={star}
              count={breakdown[star] || 0}
              total={totalReviews}
            />
          ))}
        </div>
      )}

      {/* ── Review Form Trigger ── */}
      {isGuest && canReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-rose-50 hover:bg-rose-100 border-2 border-dashed border-rose-200 text-rose-500 font-medium py-4 rounded-xl transition flex items-center justify-center gap-2"
        >
          <FaStar size={16} />
          Write a Review
        </button>
      )}

      {/* ── Already Reviewed Banner ── */}
      {isGuest && hasReviewed && !showForm && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaStar className="text-yellow-400" />
            <span className="text-sm text-green-700 font-medium">
              You reviewed this property
            </span>
          </div>
          <button
            onClick={() => handleEdit(existingReview)}
            className="text-sm text-rose-500 hover:underline"
          >
            Edit review
          </button>
        </div>
      )}

      {/* ── Review Form ── */}
      {showForm && (
        <form
          id="review-form"
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4"
        >
          <h3 className="font-semibold text-gray-800">
            {editingId ? "Edit your review" : "Share your experience"}
          </h3>

          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your stay? What did you love? What could be improved?"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-rose-400 resize-none transition"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {comment.length}/1000
            </p>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-3 rounded-xl transition"
            >
              {submitting
                ? "Submitting..."
                : editingId
                ? "Update Review"
                : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setRating(0);
                setComment("");
              }}
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Reviews List ── */}
      {reviews.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-gray-500 font-medium">No reviews yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="border-b border-gray-100 pb-4 last:border-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-500 font-bold">
                      {review.author?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {review.author?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(review.createdAt), "MMMM yyyy")}
                    </p>
                  </div>
                </div>

                {/* Edit/Delete buttons — only for the author */}
                {user?._id === review.author?._id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(review)}
                      className="text-gray-400 hover:text-rose-500 transition p-1"
                      title="Edit review"
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="text-gray-400 hover:text-red-500 transition p-1"
                      title="Delete review"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Stars */}
              <div className="mt-2 mb-1">
                <StarRating value={review.rating} readonly />
              </div>

              {/* Comment */}
              <p className="text-gray-600 text-sm leading-relaxed mt-2">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;