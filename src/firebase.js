// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7T6jNlI4wriCyn8MnA8YtlhIKaBTkTAA",
    authDomain: "omega-vo5.firebaseapp.com",
    projectId: "omega-vo5",
    storageBucket: "omega-vo5.firebasestorage.app",
    messagingSenderId: "2149846597",
    appId: "1:2149846597:web:29feb9544675570b8bdd2c",
    measurementId: "G-HS64EX1LD9"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export the services you want
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
