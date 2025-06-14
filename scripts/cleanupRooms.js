// Database cleanup script for KidQuest Champions
// Run this script periodically to clean up empty or inactive rooms

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kidquest-champions.firebaseio.com",
});

const db = admin.firestore();
const APP_ID = "kidquest-champions-dev";
const BASE_PATH = `/artifacts/${APP_ID}/public/data`;

async function cleanupRooms() {
  console.log("🧹 Starting room cleanup...");

  try {
    const roomsRef = db.collection(`${BASE_PATH}/rooms`);

    // Get all rooms
    const snapshot = await roomsRef.get();
    let cleaned = 0;
    let totalRooms = snapshot.docs.length;

    console.log(`📊 Found ${totalRooms} rooms to check`);

    for (const doc of snapshot.docs) {
      const roomData = doc.data();
      const roomId = doc.id;

      // Check if room should be cleaned up
      const shouldCleanup =
        // Room is inactive
        !roomData.isActive ||
        // Room has no participants
        !roomData.participants ||
        roomData.participants.length === 0 ||
        // Room has been inactive for more than 24 hours
        (roomData.createdAt &&
          Date.now() - roomData.createdAt > 24 * 60 * 60 * 1000) ||
        // Room is marked as completed
        roomData.status === "completed";

      if (shouldCleanup) {
        console.log(
          `🗑️  Cleaning up room: ${roomId} (${roomData.name || "Unnamed"})`
        );

        // Delete the room
        await doc.ref.delete();
        cleaned++;
      }
    }

    console.log(
      `✅ Cleanup complete! Removed ${cleaned} out of ${totalRooms} rooms`
    );

    if (cleaned > 0) {
      console.log(`💰 Estimated storage savings: ${cleaned * 0.001}MB`);
    }
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }

  // Exit the process
  process.exit(0);
}

// Cleanup function for rooms older than specified hours
async function cleanupOldRooms(hoursOld = 24) {
  console.log(`🧹 Starting cleanup of rooms older than ${hoursOld} hours...`);

  try {
    const roomsRef = db.collection(`${BASE_PATH}/rooms`);
    const cutoffTime = Date.now() - hoursOld * 60 * 60 * 1000;

    // Query for old rooms
    const snapshot = await roomsRef.where("createdAt", "<", cutoffTime).get();

    console.log(`📊 Found ${snapshot.docs.length} old rooms to clean up`);

    // Delete old rooms in batches
    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`✅ Deleted ${count} old rooms`);
    } else {
      console.log("✅ No old rooms to clean up");
    }
  } catch (error) {
    console.error("❌ Error cleaning up old rooms:", error);
  }

  process.exit(0);
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes("--old-only")) {
  const hours = parseInt(args[args.indexOf("--old-only") + 1]) || 24;
  cleanupOldRooms(hours);
} else {
  cleanupRooms();
}
