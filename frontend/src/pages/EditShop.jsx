import axios from "axios";
import { useState, useEffect } from "react";
import { FaUtensils } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setShop } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { MdKeyboardBackspace } from "react-icons/md";
export default function EditShop() {
    const { userData, shop, city, state, address } = useSelector(state => state.user)
    const [name, setName] = useState(shop?.name || "")
    const [City, setCity] = useState(shop?.city || city || "")
    const [State, setState] = useState(shop?.state || state || "")
    const [Address, setAddress] = useState(shop?.address || address || "")
    const [frontendImage, setFrontendImage] = useState(shop?.image || "")
    const [backendImage, setBackendImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()
 
    const navigate = useNavigate()
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setBackendImage(file)
        //console.log(file);
        setFrontendImage(URL.createObjectURL(file))
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("city", City)
            formData.append("state", State)
            if (backendImage) {
                formData.append("image", backendImage)
            } else {
                formData.append("image", frontendImage);
            }
            formData.append("address", Address);
            //console.log(frontendImage);
            const result = await axios.post(`${serverUrl}/api/shop/editshop`, formData, { withCredentials: true })
            dispatch(setShop(result.data))
            setLoading(false)
            navigate("/")
            console.log(result.data)
        } catch (error) {
            console.log(error)
        }

    };

    return (
        <div className="flex justify-center flex-col items-center p-6 bg-gradient-to-br from-orange-50 relative to-white min-h-screen">
            <div className='absolute top-[20px] left-[20px] z-[10] mb-[10px]' onClick={() => navigate("/")}>
                <MdKeyboardBackspace className='w-[25px] h-[25px] text-[#ff4d2d]' />
            </div>
            <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-orange-100 p-4 rounded-full mb-4">
                        <FaUtensils className="text-[#ff4d2d] w-16 h-16" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">{!shop ? "Add Shop" : "Edit Shop"}</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}

                            required
                            placeholder="Enter Shop Name"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shop Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {frontendImage && (
                            <div className="mt-3">
                                <img
                                    src={frontendImage}
                                    alt="Shop Preview"
                                    className="w-full h-48 object-cover rounded-lg border"
                                />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={City}
                                onChange={(e) => setCity(e.target.value)}
                                required
                                placeholder="Enter city"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                                type="text"
                                name="state"
                                value={State}
                                onChange={(e) => setState(e.target.value)}
                                required
                                placeholder="Enter state"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                            name="address"
                            value={Address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                            placeholder="Enter address"
                            rows="3"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-200"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </form>
            </div>
        </div>
    );
}