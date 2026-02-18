import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MdKeyboardBackspace } from "react-icons/md";
import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setShop } from "../redux/userSlice";
export default function AddItem() {
  //   const [formData, setFormData] = useState({
  //     name: "",
  //     price: "",
  //     category: "",
  //     image: "",
  //     veg: "true",
  //   });
  const [name, setName] = useState("")
  const [price, setPrice] = useState(0)
  const [category, setCategory] = useState("")
  const [type, setType] = useState("veg")
  const [frontendImage, setFrontendImage] = useState(null)
  const [backendImage, setBackendImage] = useState(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const categories = [
    "Snacks",
    "Main Course",
    "Desserts",
    "Pizza",
    "Burgers",
    "Sandwiches",
    "South Indian",
    "North Indian",
    "Chinese",
    "Fast Food",
    "Others",
  ];

  const handleImage = (e) => {
    const file = e.target.files[0]
    setBackendImage(file)
    setFrontendImage(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("price", price)
      formData.append("type", type)
      formData.append("category", category)
      formData.append("image", backendImage)

      const result = await axios.post(`${serverUrl}/api/item/additem`, formData, { withCredentials: true })
     // console.log("items:", result.data.shop);
      dispatch(setShop(result.data.shop))
      navigate("/")
    } catch (error) {
      console.log(error)
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#fff0ec] to-white p-6">
      <div className='absolute top-[20px] left-[20px] z-[10] mb-[10px] cursor-pointer' onClick={() => navigate("/")}>
        <MdKeyboardBackspace className='w-[25px] h-[25px] text-[#ff4d2d]' />
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#ff4d2d33] shadow-lg rounded-xl p-8 max-w-lg w-full space-y-6"
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Add New Food Item
        </h2>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={name}
            placeholder="Enter Food Name"
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#ff4d2d] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Price</label>
          <input
            type="number"
            name="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#ff4d2d] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Category</label>
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#ff4d2d] focus:outline-none"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleImage}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#ff4d2d] focus:outline-none"
          />
          {frontendImage && (
            <img
              src={frontendImage}
              alt="Preview"
              className="mt-3 w-full h-48 object-cover rounded-lg border border-gray-200"
            />
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Type</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#ff4d2d] focus:outline-none"
          >
            <option value="veg">veg</option>
            <option value="non veg">non veg</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-[#ff4d2d] text-white px-6 py-3 rounded-full font-semibold shadow-md hover:bg-[#e64528] transition-colors"
        >
          <FaPlus /> Add Item
        </button>
      </form>
    </div>
  );
}