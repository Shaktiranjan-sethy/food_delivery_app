import React, { useEffect, useState } from 'react';
import { FaLocationDot } from "react-icons/fa6";
import { useDispatch, useSelector } from 'react-redux';
import { IoIosSearch } from "react-icons/io";
import { LuShoppingCart } from "react-icons/lu";
import { RxCross2 } from "react-icons/rx";
import { serverUrl } from '../App';
import axios from 'axios';
import { setSearchItems, setShop, setUserData } from '../redux/userSlice';
import { FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { TbReceipt2 } from "react-icons/tb";

function Nav() {
    const { city, userData, cartItems, pendingOrdersCount, shop } = useSelector(state => state.user);
    const [showSearch, setShowSearch] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [input, setInput] = useState("");

    const handleLogOut = async () => {
        try {
            await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
            dispatch(setUserData(null));
            dispatch(setShop(null));
            navigate("/signin");
        } catch (error) {
            console.log(error);
        }
    };

    // const handleSearchItems = async () => {
    //     try {
    //         const result = await axios.get(
    //             `${serverUrl}/api/user/search-items?city=${city}&query=${input}`,
    //             { withCredentials: true }
    //         );
    //         console.log(input);
    //         console.log(result.data);
    //         dispatch(setSearchItems(result.data));
    //     } catch (error) {
    //         dispatch(setSearchItems(null));
    //         console.log(error);
    //     }
    // };

    useEffect(() => {
        let isActive = true;

        const fetchData = async () => {
            if (input.trim()) {
                try {
                    const result = await axios.get(
                        `${serverUrl}/api/user/search-items?city=${city}&query=${input}`,
                        { withCredentials: true }
                    );
                    if (isActive) {
                        dispatch(setSearchItems(result.data));
                    }
                } catch (error) {
                    if (isActive) {
                        dispatch(setSearchItems(null));
                    }
                    console.log(error);
                }
            } else {
                dispatch(setSearchItems(null));
            }
        };

        fetchData();

        return () => { 
            isActive = false;
        };
    }, [input]);


    // useEffect(() => {
    //     if (input) {
    //         handleSearchItems();
    //     } else {
    //         dispatch(setSearchItems(null));
    //     }
    // }, [input]);

    return (
        <div className="w-full h-[80px] flex items-center justify-between md:justify-center gap-[30px] px-[20px] fixed top-0 z-[9999] bg-[#fff9f6] overflow-visible">

            {/* Mobile Search Box */}
            {showSearch && userData?.role === "user" && (
                <div className="w-[90%] h-[70px] bg-white shadow-xl rounded-lg items-center gap-[20px] z-[9999] flex fixed left-[5%] top-[80px]">
                    <div className="flex items-center w-[30%] overflow-hidden gap-[10px] px-[10px] border-r-[2px] border-gray-400">
                        <FaLocationDot className="w-[25px] h-[25px] text-[#ff4d2d]" />
                        <div className="w-[80%] truncate text-gray-600">
                            {city || "searching.."}
                        </div>
                    </div>
                    <div className="w-[80%] flex items-center gap-[10px]">
                        <IoIosSearch className="w-[25px] h-[25px] text-[#ff4d2d]" />
                        <input
                            type="text"
                            placeholder="search delicious food..."
                            className="px-[10px] text-gray-700 outline-0 w-full"
                            onChange={(e) => setInput(e.target.value)}
                            value={input}
                        />
                    </div>
                </div>
            )}

            {/* Logo */}
            <h1 className="text-3xl font-bold mb-2 text-[#ff4d2d]">Vingo</h1>

            {/* Desktop Search Box */}
            {userData?.role === "user" && (
                <div className="md:w-[60%] lg:w-[40%] h-[70px] bg-white shadow-xl rounded-lg items-center gap-[20px] hidden md:flex">
                    <div className="flex items-center w-[30%] overflow-hidden gap-[10px] px-[10px] border-r-[2px] border-gray-400">
                        <FaLocationDot className="w-[25px] h-[25px] text-[#ff4d2d]" />
                        <div className="w-[80%] truncate text-gray-600">
                            {city || "searching.."}
                        </div>
                    </div>
                    <div className="w-[80%] flex items-center gap-[10px]">
                        <IoIosSearch className="w-[25px] h-[25px] text-[#ff4d2d]" />
                        <input
                            type="text"
                            placeholder="search delicious food..."
                            className="px-[10px] text-gray-700 outline-0 w-full"
                            onChange={(e) => setInput(e.target.value)}
                            value={input}
                        />
                    </div>
                </div>
            )}

            {/* Right Side Icons */}
            <div className="flex items-center gap-[20px]">
                {/* Mobile search toggle */}
                {userData?.role === "user" && (
                    !showSearch ? (
                        <IoIosSearch className="w-[25px] h-[25px] text-[#ff4d2d] md:hidden" onClick={() => setShowSearch(true)} />
                    ) : (
                        <RxCross2 className="w-[25px] h-[25px] text-[#ff4d2d] md:hidden" onClick={() => setShowSearch(false)} />
                    )
                )}

                {/* Role Based UI */}
                {userData?.role === "owner" ? (
                    <>
                        {/* Add Food Item */}
                        {shop &&
                            <>
                                <button
                                    onClick={() => navigate("/additem")}
                                    className="hidden md:flex items-center gap-1 p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d]"
                                >
                                    <FiPlus size={16} />
                                    <span className="text-sm font-medium">Add Food Item</span>
                                </button>
                                <button
                                    onClick={() => navigate("/additem")}
                                    className="flex md:hidden items-center justify-center p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d]"
                                >
                                    <FiPlus size={18} />
                                </button>
                            </>
                        }

                        {/* Pending Orders */}
                        <div
                            className="hidden md:flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] font-medium"
                            onClick={() => navigate("/pending-orders")}
                        >
                            <TbReceipt2 className="w-[22px] h-[22px]" />
                            <span className="text-sm">My Orders</span>
                            <span className="absolute -right-2 -top-2 text-xs font-bold text-white bg-[#ff4d2d] rounded-full px-[6px] py-[1px]">
                                {pendingOrdersCount}
                            </span>
                        </div>
                        <div
                            className="flex md:hidden items-center justify-center relative p-2 rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d]"
                            onClick={() => navigate("/pending-orders")}
                        >
                            <TbReceipt2 className="w-[22px] h-[22px]" />
                            <span className="absolute -right-1 -top-1 text-[10px] font-bold text-white bg-[#ff4d2d] rounded-full px-[4px] py-[0px]">
                                {pendingOrdersCount}
                            </span>
                        </div>
                    </>
                ) : userData?.role === "deliveryBoy" ? (
                    <button
                        onClick={() => navigate("/my-delivered-orders")}
                        className="px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-medium"
                    >
                        My Orders
                    </button>
                ) : (
                    <>
                        {/* User Cart */}
                        <div className="relative cursor-pointer" onClick={() => navigate("/cart")}>
                            <LuShoppingCart className="w-[25px] h-[25px] text-[#ff4d2d]" />
                            <span className="absolute right-[-9px] top-[-12px] text-[#ff4d2d]">
                                {cartItems?.length}
                            </span>
                        </div>

                        {/* User Orders → only desktop */}
                        {userData?.role === "user" && (
                            <button
                                onClick={() => navigate("/my-orders")}
                                className="hidden md:block px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-medium"
                            >
                                My Orders
                            </button>
                        )}
                    </>
                )}

                {/* Profile icon + Popup */}
                <div className="relative overflow-visible">
                    <div
                        className="w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[#ff4d2d] text-white text-[18px] shadow-xl font-semibold cursor-pointer"
                        onClick={() => setShowInfo(prev => !prev)}
                    >
                        {userData?.fullName?.slice(0, 1)}
                    </div>

                    {showInfo && (
                        <div className="fixed top-[80px] right-[10px] md:right-[10%] lg:right-[25%] w-[180px] bg-white shadow-2xl rounded-xl p-[20px] flex flex-col gap-[10px] z-[9999]">
                            <div className="text-[17px] font-semibold">{userData?.fullName}</div>

                            {/* Mobile: My Orders */}
                            {userData?.role === "user" && (
                                <div
                                    className="md:hidden text-[#ff4d2d] font-semibold cursor-pointer"
                                    onClick={() => {
                                        setShowInfo(false);
                                        navigate("/my-orders");
                                    }}
                                >
                                    My Orders
                                </div>
                            )}

                            <div
                                className="text-[#ff4d2d] font-semibold cursor-pointer"
                                onClick={handleLogOut}
                            >
                                Log Out
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Nav;
