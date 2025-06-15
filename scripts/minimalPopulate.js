// Minimal population script for testing
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "kidquest-champions";

// Load service account
let serviceAccount;
try {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error("❌ Service account key not found");
  process.exit(1);
}

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com/`,
});

const db = admin.firestore();
const BASE_PATH = `artifacts/${PROJECT_ID}/public/data`;

// Minimal data
const minimalTheme = {
  name: "Test Theme",
  description: "A simple test theme",
  category: "Math",
  difficulty: "Easy",
  isActive: true,
  order: 1,
  tasks: [
    {
      id: "test_001",
      title: "Test Task",
      description: "A simple test task",
      coinReward: 50,
      type: "quiz",
      difficulty: "Easy",
      estimatedTime: 5,
      isActive: true
    }
  ]
};

async function minimalPopulate() {
  console.log("🧪 Running minimal population test...");
  
  try {
    // Add one theme
    const themesRef = db.collection(`${BASE_PATH}/themes`);
    await themesRef.add({
      ...minimalTheme,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      totalTasks: 1,
      totalRewards: 50
    });
    console.log("✅ Test theme added successfully");
    
    // Add minimal system config
    await db.collection(`${BASE_PATH}/systemConfig`).doc("features").set({
      friendsEnabled: true,
      roomsEnabled: true,
      leaderboardEnabled: true,
      coinsEnabled: true
    });
    console.log("✅ System config added successfully");
    
    console.log("");
    console.log("🎉 Minimal population completed!");
    console.log("🚀 Basic database structure is working");
    
  } catch (error) {
    console.error("💥 Minimal population failed:", error);
  } finally {
    process.exit(0);
  }
}

minimalPopulate();