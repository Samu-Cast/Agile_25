// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBUqVOuYrLYAgEBXpYFvnHKCGv798h5KqI",
  authDomain: "brewhub-bd760.firebaseapp.com",
  projectId: "brewhub-bd760",
  storageBucket: "brewhub-bd760.firebasestorage.app",
  messagingSenderId: "527787031458",
  appId: "1:527787031458:web:937fde47a28b5c419690fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// EXPORT: auth, db, storage
// EXPORT: auth, storage
export const auth = getAuth(app);
export const storage = getStorage(app);
