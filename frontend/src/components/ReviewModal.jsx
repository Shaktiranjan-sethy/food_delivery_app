import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";

export default function ReviewModal({ item, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) return setError("Please select a rating");
    setLoading(true);
    try {
      const res = await axios.post(
        `${serverUrl}/api/review/submit`,
        { itemId: item._id, rating, comment },
        { withCredentials: true }
      );
      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Rate & Review</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Item Info */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-orange-50 rounded-xl">
          <img
            src={item.image}
            alt={item.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div>
            <p className="font-semibold text-gray-800">{item.name}</p>
            <p className="text-sm text-gray-500">₹{item.price}</p>
          </div>
        </div>

        {/* Star Rating */}
        <p className="text-sm font-medium text-gray-700 mb-2">Your Rating</p>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              size={32}
              className="cursor-pointer transition-colors"
              color={star <= (hover || rating) ? "#f59e0b" : "#d1d5db"}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        {/* Comment */}
        <p className="text-sm font-medium text-gray-700 mb-2">Your Review (optional)</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          rows={3}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none mb-4"
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#ff4d2d] text-white py-2 rounded-xl font-semibold hover:bg-[#e64528] disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}