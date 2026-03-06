import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/UserDashboard'

import DeliveryBoy from '../components/DeliveryBoy'
import { FaUtensils } from "react-icons/fa";
import OwnerDashboard from '../components/OwnerDashboard';
import Footer from '../components/Footer';
function Home() {
  const { userData } = useSelector(state => state.user);

  if (!userData) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className='w-[100vw] min-h-[100vh] pt-[100px] flex flex-col items-center bg-[#fff9f6]'>
      {/* <h1 className="text-xl font-bold" style={{ color: 'black' }}>
        Welcome, User
      </h1> */}
      {userData.role === "user" && <UserDashboard />}
      {userData.role === "owner" && <OwnerDashboard />}
      {userData.role === "deliveryBoy" && <DeliveryBoy />}
      <Footer />
    </div>
  );
}


export default Home
