import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import ReviewModal from "../components/ReviewModal";
import { FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MdKeyboardBackspace } from "react-icons/md";

export default function RateOrder() {
  const [reviewableItems, setReviewableItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchReviewableItems = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/review/reviewable-items`, {
        withCredentials: true,
      });
      if (res.data.success) setReviewableItems(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewableItems();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-[#fff9f6] px-4 py-6 max-w-2xl mx-auto">
      <div className="flex gap-4 items-center mb-6">
        <div onClick={() => navigate("/")} className="cursor-pointer">
          <MdKeyboardBackspace className="w-6 h-6 text-[#ff4d2d]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Rate Your Orders</h1>
      </div>

      {reviewableItems.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FaStar className="text-5xl text-yellow-300 mx-auto mb-4" />
          <p className="text-lg font-medium">No items to review</p>
          <p className="text-sm">All caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviewableItems.map(({ item }, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">₹{item.price}</p>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <FaStar key={s} size={12} color="#d1d5db" />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(item)}
                className="bg-[#ff4d2d] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#e64528]"
              >
                Rate
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <ReviewModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={fetchReviewableItems}
        />
      )}
    </div>
  );
}