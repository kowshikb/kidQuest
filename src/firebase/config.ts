import { initializeApp } from "firebase/app";
import {
  getFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Firebase configuration using environment variables with fallbacks
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY || "demo-key-for-local-development",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "kidquest-champions.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "kidquest-champions",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "kidquest-champions.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO123456",
};

// Enhanced environment validation
const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0 && import.meta.env.PROD) {
    throw new Error(
      `Missing required Firebase environment variables in production: ${missingVars.join(
        ", "
      )}`
    );
  }

  if (missingVars.length > 0) {
    console.error(
      "Missing required Firebase environment variables:",
      missingVars
    );
    console.error(
      "Please create a .env file with your Firebase configuration. See env.example for reference."
    );
  }

  return missingVars.length === 0;
};

// Validate configuration before initializing Firebase
const isConfigValid = validateFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// IMPROVED PERSISTENCE CODE with better error handling:
export const persistenceReadyPromise = enableIndexedDbPersistence(db, {
  forceOwnership: false, // Changed to false to prevent multi-tab issues
})
  .then(() => {
    console.log("✅ IndexedDB persistence initialized successfully");
    return true;
  })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time"
      );
      console.warn("💡 This may cause some real-time connection issues");
    } else if (err.code === "unimplemented") {
      console.warn("⚠️ The current browser doesn't support persistence");
    } else {
      console.error("❌ Failed to enable persistence:", err);
    }
    return false;
  });

const auth = getAuth(app);

// Initialize analytics only in production
let analytics;
try {
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  ) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn("Analytics initialization failed:", error);
}

// Check if running in development mode
const isDevelopment = import.meta.env.DEV;

// Get app_id from environment or use project_id as fallback
// In development, append '-dev' to the project ID to use the dev artifact
const APP_ID = isDevelopment
  ? `${firebaseConfig.projectId}-dev`
  : firebaseConfig.projectId;

// Define the base path for all Firestore operations
export const getBasePath = () => `artifacts/${APP_ID}/public/data`;

export { app, db, auth, analytics };
