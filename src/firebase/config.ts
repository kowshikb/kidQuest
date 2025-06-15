import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required Firebase environment variables:', missingVars);
  console.error('Please create a .env file with your Firebase configuration. See env.example for reference.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence with optimized settings
export const persistenceReadyPromise = enableIndexedDbPersistence(db, {
  forceOwnership: false // Allow multiple tabs
})
  .then(() => {
    console.log('IndexedDB persistence initialized successfully');
    return true;
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser doesn\'t support persistence');
    }
    return false;
  });

const auth = getAuth(app);

// Initialize analytics only in production
let analytics;
try {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn('Analytics initialization failed:', error);
}

// Get app_id from environment or use project_id as fallback
const APP_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kidquest-champions-dev';

// Define the base path for all Firestore operations
export const getBasePath = () => `/artifacts/${APP_ID}/public/data`;

export { app, db, auth, analytics };