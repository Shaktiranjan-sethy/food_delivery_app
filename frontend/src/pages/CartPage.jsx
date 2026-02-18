import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { updateQuantity, removeFromCart } from "../redux/userSlice";
import { MdKeyboardBackspace } from "react-icons/md";
import { useNavigate } from "react-router-dom";
function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const { cartItems, totalAmount } = useSelector((state) => state.user);
  console.log(cartItems);
  const handleIncrease = (id, currentQty) => {
    dispatch(updateQuantity({ id, quantity: currentQty + 1 }));
  };

  const handleDecrease = (id, currentQty) => {
    if (currentQty > 1) {
      dispatch(updateQuantity({ id, quantity: currentQty - 1 }));
    }
  };

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  return (
    <div className="min-h-screen bg-[#fff9f6] flex justify-center p-6">

      <div className="w-full max-w-[800px]">
        <div className="flex items-center gap-[20px] mb-6">
          <div className='' onClick={() => navigate("/")}>
            <MdKeyboardBackspace className='w-[25px] h-[25px] text-[#ff4d2d]' />
          </div>
          <h1 className="text-2xl font-bold  text-start">Your Cart</h1>
        </div>
        {cartItems.length === 0 ? (
          <p className="text-gray-500 text-lg text-center">Your cart is empty.</p>
        ) : (
          <>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white p-4 rounded-xl shadow border"
                >
                  {/* Left Side: Image & Info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <div>
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        ₹{item.price} × {item.quantity}
                      </p>
                      <p className="font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Qty Controls & Remove */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecrease(item.id, item.quantity)}
                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <FaMinus size={12} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleIncrease(item.id, item.quantity)}
                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                    >
                      <FaPlus size={12} />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total & Checkout */}
            <div className="mt-6 bg-white p-4 rounded-xl shadow flex justify-between items-center border">
              <h3 className="text-lg font-semibold">Total Amount</h3>
              <span className="text-xl font-bold text-[#ff4d2d]">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="bg-[#ff4d2d] text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-[#e64526] transition" onClick={() => navigate("/checkout")}>
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CartPage;
