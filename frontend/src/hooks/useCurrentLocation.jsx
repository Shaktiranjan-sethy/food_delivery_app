import { useEffect, useState } from "react";

export default function useCurrentLocation() {
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const GEOAPIFY_API_KEY = "2857dea74bcb4d17a92e68e33422442b"; // apna API key

  // Reverse geocode with Geoapify
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`
      );
      const data = await res.json();

      const props = data?.features?.[0]?.properties || {};
      const fullAddress =
        [
          props.address_line1,
          props.address_line2,
          props.city,
          props.state,
          props.postcode,
          props.country,
        ]
          .filter(Boolean)
          .join(", ") || "Unknown Location";

      setAddress(fullAddress);
    } catch (err) {
      console.error("Geoapify reverse geocode failed:", err);
      setAddress("Unable to fetch address");
    }
  };

  // Core GPS location
  const getCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported by this browser.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLocation({ lat, lng });
        reverseGeocode(lat, lng);
        setLoading(false);
      },
      (err) => {
        console.error("GPS failed:", err);
        handleGeoError(err);
        setLocation({ lat: null, lng: null });
      },
      {
        enableHighAccuracy: true, // ✅ GPS chip use kare
        timeout: 15000,           // ⏱ 15s tak wait karo
        maximumAge: 60000,        // ✅ 1 min tak cache use karo (performance better)
      }
    );
  };

  const handleGeoError = (err) => {
    if (err.code === 1) setError("Permission denied by user.");
    else if (err.code === 2) setError("Location unavailable.");
    else if (err.code === 3) setError("Request timed out.");
    else setError("Unable to get location.");
    setLoading(false);
  };

  useEffect(() => {
    getCurrentLocation();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        getCurrentLocation();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return {
    location,
    address,
    loading,
    error,
    getCurrentLocation,
    setLocation,
    reverseGeocode,
  };
}
