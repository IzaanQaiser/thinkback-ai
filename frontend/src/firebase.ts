// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAc50RimQmA7H1O9TAxQ9DUIWDtP4T1ZIk",
  authDomain: "ninth-arena-461723-g1.firebaseapp.com",
  projectId: "ninth-arena-461723-g1",
  storageBucket: "ninth-arena-461723-g1.appspot.com",
  messagingSenderId: "738547429797",
  appId: "1:738547429797:web:3c6848182f347caeb6f84c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth instance
export const auth = getAuth(app);
export default app;
