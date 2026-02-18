// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "bingo-food-delivery-fb15b.firebaseapp.com",
  projectId: "bingo-food-delivery-fb15b",
  storageBucket: "bingo-food-delivery-fb15b.firebasestorage.app",
  messagingSenderId: "367725397216",
  appId: "1:367725397216:web:24bc11600561d668e4bc85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
export { provider, auth }