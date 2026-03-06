import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { MdKeyboardBackspace } from "react-icons/md";
import ReviewModal from "../components/ReviewModal";

export default function MyOrders() {
  const { myOrders, socket } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewedItems, setReviewedItems] = useState(new Set()); // track reviewed items
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/order/getmy`, {
          withCredentials: true,
        });
        if (res.data.success) {
          dispatch(setMyOrders(res.data.orders));
          console.log("order items:", res.data.orders)
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // fetch already reviewed items so we can hide the rate button
  useEffect(() => {
    const fetchReviewableItems = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/review/reviewable-items`, {
          withCredentials: true,
        });
        if (res.data.success) {
          console.log("reviewable items:", res.data);
          const itemIds = res.data.items.map(i => i.item?._id);
          //console.log("ids:", itemIds);
          setReviewedItems(new Set(itemIds));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchReviewableItems();
  }, []);

  // socket listener
  useEffect(() => {
    if (!socket) return;
    socket.on("orders:statusUpdated", (data) => {
      dispatch(
        setMyOrders(
          myOrders.map((order) => {
            if (order._id === data.orderId) {
              return {
                ...order,
                shopOrders: order.shopOrders.map((so) =>
                  so._id === data.shopOrder._id
                    ? { ...so, status: data.shopOrder.status }
                    : so
                ),
              };
            }
            return order;
          })
        )
      );
    });
  }, [socket, myOrders, dispatch]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // called after review submitted successfully
  const handleReviewSuccess = (itemId) => {
    setReviewedItems((prev) => new Set([...prev, itemId]));
  };

  if (!loading && myOrders?.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 mb-4">You have no orders yet.</p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-6 py-2 rounded-lg"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex justify-center px-4">
      <div className="w-full max-w-[800px] p-4">
        {/* Header */}
        <div className="flex gap-[20px] items-center mb-6">
          <div onClick={() => navigate("/")} className="cursor-pointer">
            <MdKeyboardBackspace className="w-[25px] h-[25px] text-[#ff4d2d]" />
          </div>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        <div className="space-y-6">
          {myOrders?.map((order) => (
            <div
              key={order?._id}
              className="bg-white rounded-lg shadow p-4 space-y-4"
            >
              {/* Order Info */}
              <div className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-semibold">
                    Order #{order?._id?.slice(-6)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Date: {formatDate(order?.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Payment: {order?.paymentMethod?.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status:{" "}
                    <span className="font-medium text-blue-600">
                      {order?.shopOrders?.[0]?.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Shop-wise Orders */}
              {order?.shopOrders?.map((shopOrder, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 bg-[#fffaf7] space-y-3"
                >
                  {/* Shop Name */}
                  <p className="font-medium text-gray-800 text-lg">
                    {shopOrder?.shop?.name || "N/A"}
                  </p>

                  {/* Items */}
                  <div className="flex space-x-4 overflow-x-auto pb-2">
                    {shopOrder.items.map((item) => {
                      const itemId = item?.item?._id;
                      const isDelivered = shopOrder?.status === "delivered";
                      const alreadyRated = reviewedItems.has(itemId);

                      return (
                        <div
                          key={item?._id}
                          className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white"
                        >
                          <img
                            src={item?.item?.image || "/placeholder.png"}
                            alt={item?.name}
                            className="w-full h-24 object-cover rounded"
                          />
                          <p className="text-sm font-semibold mt-1">
                            {item?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item?.quantity} × ₹{item?.price}
                          </p>

                          {/* ✅ Rate button per item */}
                          {isDelivered && itemId && !alreadyRated && (
                            <button
                              onClick={() =>
                                setSelectedItem({
                                  _id: itemId,
                                  name: item?.name,
                                  price: item?.price,
                                  image: item?.item?.image,
                                })
                              }
                              className="mt-2 w-full bg-yellow-400 hover:bg-yellow-500 text-white text-xs py-1 rounded-lg font-semibold"
                            >
                              ⭐ Rate
                            </button>
                          )}

                          {/* ✅ Already rated badge */}
                          {isDelivered && alreadyRated && (
                            <p className="mt-2 text-center text-xs text-green-600 font-semibold">
                              ✅ Rated
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Shop Subtotal */}
                  <div className="flex justify-between items-center border-t pt-2">
                    <p className="font-semibold">
                      Subtotal: ₹{shopOrder?.subtotal}
                    </p>
                    <span className="text-sm font-medium text-blue-600">
                      {shopOrder?.status}
                    </span>
                  </div>
                </div>
              ))}

              {/* Overall Order Total */}
              <div className="flex justify-between items-center border-t pt-2">
                <p className="font-semibold">Total: ₹{order?.totalAmount}</p>

                {order?.shopOrders?.[0]?.status === "delivered" ? (
                  <span className="text-green-600 font-semibold">
                    Delivered ✅
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(`/track-order/${order._id}`)}
                    className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Track Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Review Modal - opens directly on this page */}
      {selectedItem && (
        <ReviewModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            handleReviewSuccess(selectedItem._id);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}