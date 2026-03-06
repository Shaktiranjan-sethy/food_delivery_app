import React, { useRef, useState, useEffect } from 'react';
import Nav from './Nav';
import { categories } from '../category';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import CategoryCard from './CategoryCard';
import FoodCard from './FoodCard';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; 

function UserDashboard() {
  const { city, shopsOfCity, itemsOfCity, searchItems, userData } = useSelector(
    (state) => state.user
  );
  //console.log(itemsOfCity);
  const navigate = useNavigate();
  const cateScrollRef = useRef(null);
  const shopScrollRef = useRef(null);
  const [updatedItemsList, setUpdatedItemslist] = useState([]);
  const [showCateLeft, setShowCateLeft] = useState(false);
  const [showCateRight, setShowCateRight] = useState(false);
  const [showShopLeft, setShowShopLeft] = useState(false);
  const [showShopRight, setShowShopRight] = useState(false);
 

  const handleFilter = (category) => {
    if (category === 'All') {
      setUpdatedItemslist(itemsOfCity);
    } else {
      const filteredList = itemsOfCity?.filter((i) => i.category === category);
      setUpdatedItemslist(filteredList);
    }
  };

  const updateButtons = (ref, setLeft, setRight) => {
    const el = ref.current;
    if (!el) return;
    setLeft(el.scrollLeft > 0);
    setRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scrollHandler = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const cateEl = cateScrollRef.current;
    const shopEl = shopScrollRef.current;

    const cateScrollListener = () =>
      updateButtons(cateScrollRef, setShowCateLeft, setShowCateRight);
    const shopScrollListener = () =>
      updateButtons(shopScrollRef, setShowShopLeft, setShowShopRight);

    if (cateEl) {
      updateButtons(cateScrollRef, setShowCateLeft, setShowCateRight);
      cateEl.addEventListener('scroll', cateScrollListener);
    }
    if (shopEl) {
      updateButtons(shopScrollRef, setShowShopLeft, setShowShopRight);
      shopEl.addEventListener('scroll', shopScrollListener);
    }

    return () => {
      if (cateEl) cateEl.removeEventListener('scroll', cateScrollListener);
      if (shopEl) shopEl.removeEventListener('scroll', shopScrollListener);
    };
  }, [categories, shopsOfCity]);

  useEffect(() => {
    setUpdatedItemslist(itemsOfCity);
  }, [itemsOfCity]);

  return (
    <div className="w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto">
      <Nav />

      {/* 🔎 Search Results Section on Top */}
      {searchItems && searchItems.length > 0 && (
        <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4">
          <h1 className="text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2">
            Search Results
          </h1>
          <div className="w-full h-auto flex flex-wrap gap-6 justify-center">
            {searchItems.map((item, index) => (
              <FoodCard data={item} key={index} />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl">
          Inspiration for your first order
        </h1>
        <div className="relative w-full">
          {showCateLeft && (
            <button
              onClick={() => scrollHandler(cateScrollRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10"
            >
              <FaChevronLeft />
            </button>
          )}
          <div
            ref={cateScrollRef}
            className="w-full flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-[#ff4d2d] scrollbar-track-transparent scroll-smooth"
          >
            {categories?.map((cate, index) => (
              <CategoryCard
                key={index}
                name={cate.category}
                image={cate.image}
                onClick={() => handleFilter(cate.category)}
              />
            ))}
          </div>
          {showCateRight && (
            <button
              onClick={() => scrollHandler(cateScrollRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10"
            >
              <FaChevronRight />
            </button>
          )}
        </div>
      </div>

      {/* Shops */}
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl p-[10px]">
          Best shops in {city}
        </h1>
        <div className="relative max-w-full">
          {showShopLeft && (
            <button
              onClick={() => scrollHandler(shopScrollRef, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10"
            >
              <FaChevronLeft />
            </button>
          )}
          <div
            ref={shopScrollRef}
            className="w-full flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-[#ff4d2d] scrollbar-track-transparent scroll-smooth"
          >
            {shopsOfCity?.map((shop, index) => (
              <CategoryCard
                key={index}
                name={shop.name}
                image={shop.image}
                onClick={() => navigate(`/shop-items/${shop._id}`)}
              />
            ))}
          </div>
          {showShopRight && (
            <button
              onClick={() => scrollHandler(shopScrollRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10"
            >
              <FaChevronRight />
            </button>
          )}
        </div>
      </div>

      {/* Food Items */}
      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">
        <h1 className="text-gray-800 text-2xl sm:text-3xl p-[10px]">
          Suggested items
        </h1>
        {updatedItemsList?.length > 0 && (
          <div className="w-full h-auto flex flex-wrap gap-[20px] justify-center">
            {updatedItemsList?.map((item, index) => (
              <FoodCard data={item} key={index} />
            ))}
          </div>
        )}
        {updatedItemsList?.length === 0 && (
          <div className="text-center font-bold text-gray-700 p-[10px] w-full text-[20px]">
            No Items Found
          </div>
        )}
      </div> 
    </div>
  );
}

export default UserDashboard;
