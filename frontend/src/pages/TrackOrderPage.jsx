import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import UserDeliveryTracking from "../components/userDeliveryTracking";
import { MdKeyboardBackspace } from "react-icons/md";
const PRIMARY = "#ff4d2d";

export default function TrackOrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const navigate = useNavigate()
  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/order/${orderId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!order) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      <div className="flex gap-[20px] items-center mb-6 md:justify-center">
        <div onClick={() => navigate("/")} className="cursor-pointer">
          <MdKeyboardBackspace className="w-[25px] h-[25px] text-[#ff4d2d]" />
        </div>
        <h1 className="text-2xl font-bold md:text-center">Track Order</h1>
      </div>
      {order.shopOrders.map((shopOrder) => (
        <div
          key={shopOrder._id}
          className="bg-white p-4 rounded-2xl shadow-md border border-orange-100 space-y-4"
        >
          {/* Shop & Order Info */}
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ color: PRIMARY }}>
              {shopOrder.shop?.name || "Shop"}
            </h2>
            <p>
              <span className="font-semibold">Items:</span>{" "}
              {shopOrder.items.map((i) => i.name).join(", ")}
            </p>
            <p>
              <span className="font-semibold">Subtotal:</span> ₹
              {shopOrder.subtotal}
            </p>
            <p className="mt-2">
              <span className="font-semibold">Customer Address:</span>{" "}
              {order.address.text}
            </p>
          </div>

          {/* Delivery Info */}
          {shopOrder.status === "delivered" ? (
            <p className="text-green-600 font-semibold text-lg">
              Delivered ✅
            </p>
          ) : (
            <>
              {/* Delivery Boy Info */}
              <div>
                <h2
                  className="text-lg font-bold mb-2"
                  style={{ color: PRIMARY }}
                >
                  Delivery Boy
                </h2>
                {shopOrder.assignedDeliveryBoy ? (
                  <div className="text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {shopOrder.assignedDeliveryBoy.fullName}
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span>{" "}
                      {shopOrder.assignedDeliveryBoy.mobile}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    Delivery boy not assigned yet
                  </p>
                )}
              </div>

              {/* Tracking Map */}
              {shopOrder.assignedDeliveryBoy && (
                <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-md">
                  <UserDeliveryTracking
                    orderId={order._id}
                    shopOrderId={shopOrder._id}
                    userLocation={{
                      lat: order.address.latitude,
                      lng: order.address.longitude,
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
