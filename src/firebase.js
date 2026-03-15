import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAGBtAymEBmbByjbSSbcBFxJwcLE48UExE",
  authDomain: "campuskart-a704d.firebaseapp.com",
  projectId: "campuskart-a704d",
  storageBucket: "campuskart-a704d.firebasestorage.app",
  messagingSenderId: "572698900102",
  appId: "1:572698900102:web:31e114a06b9d0908410307",
  measurementId: "G-D2LL3P0YPQ"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();


// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

