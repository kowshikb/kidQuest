import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Use environment variables or globals
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? __firebase_config 
  : {
  apiKey: "AIzaSyBh2uPN5uAAxQarSeB3seAvLEAZB2c664Y",
  authDomain: "kidquest-champions.firebaseapp.com",
  projectId: "kidquest-champions",
  storageBucket: "kidquest-champions.firebasestorage.app",
  messagingSenderId: "595628100127",
  appId: "1:595628100127:web:46b1ef80046ec10a51232a",
  measurementId: "G-PY38V40WS5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create a promise that resolves when persistence is ready
export const persistenceReadyPromise = enableIndexedDbPersistence(db)
  .then(() => {
    console.log('IndexedDB persistence initialized successfully');
    return true;
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('The current browser doesn\'t support persistence');
    }
    // Even if persistence fails, we want to continue with online-only mode
    return false;
  });

const auth = getAuth(app);
const analytics = getAnalytics(app);

// Get app_id from environment or fallback
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'kidquest-champions-dev';

// Define the base path for all Firestore operations
export const getBasePath = () => `/artifacts/${APP_ID}/public/data`;

export { app, db, auth, analytics };