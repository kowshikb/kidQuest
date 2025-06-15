// Simple connection test script
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "kidquest-champions";

console.log("🔍 Testing Firebase connection...");
console.log(`📍 Project ID: ${PROJECT_ID}`);

// Load service account
let serviceAccount;
try {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountData);
  console.log("✅ Service account loaded");
  console.log(`📍 Service account project: ${serviceAccount.project_id}`);
} catch (error) {
  console.error("❌ Service account key not found");
  process.exit(1);
}

// Initialize Firebase
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com/`,
  });
  console.log("✅ Firebase Admin initialized");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// Test basic connection
async function testConnection() {
  try {
    console.log("🔄 Testing Firestore connection...");
    
    // Simple read test
    const testRef = db.collection('test');
    const snapshot = await testRef.limit(1).get();
    console.log("✅ Firestore read test successful");
    
    // Simple write test
    const testDoc = testRef.doc('connection-test');
    await testDoc.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: true
    });
    console.log("✅ Firestore write test successful");
    
    // Clean up test document
    await testDoc.delete();
    console.log("✅ Firestore delete test successful");
    
    console.log("");
    console.log("🎉 All connection tests passed!");
    console.log("🚀 Your Firebase setup is working correctly");
    
  } catch (error) {
    console.error("💥 Connection test failed:", error);
    console.log("");
    console.log("🔧 Possible issues:");
    console.log("1. Internet connection problems");
    console.log("2. Firebase project ID mismatch");
    console.log("3. Service account permissions");
    console.log("4. Firestore not enabled in Firebase Console");
  } finally {
    process.exit(0);
  }
}

testConnection();