// Optimized database population script with better error handling and connection management
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project ID from environment or use default
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "kidquest-champions";

console.log(`🔧 Optimized population for project: ${PROJECT_ID}`);

// Initialize Firebase Admin with optimized settings
let serviceAccount;
try {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountData);
  console.log("✅ Service account key loaded");
} catch (error) {
  console.error("❌ Service account key not found");
  console.log("📋 Setup required:");
  console.log("1. Go to Firebase Console → Project Settings → Service Accounts");
  console.log("2. Click 'Generate new private key'");
  console.log("3. Save as scripts/serviceAccountKey.json");
  process.exit(1);
}

// Initialize with optimized settings
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com/`,
  });
  console.log("✅ Firebase Admin initialized with optimized settings");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// Configure Firestore settings for better performance
db.settings({
  ignoreUndefinedProperties: true,
  merge: true
});

const BASE_PATH = `artifacts/${PROJECT_ID}/public/data`;

// Helper function with retry logic
const getCollection = (collectionName) => {
  return db.collection(`${BASE_PATH}/${collectionName}`);
};

// Retry wrapper for database operations
async function withRetry(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`⚠️ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Batch operation helper
async function batchWrite(operations) {
  const batchSize = 10; // Smaller batches to avoid timeouts
  const batches = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = db.batch();
    const batchOps = operations.slice(i, i + batchSize);
    
    batchOps.forEach(op => {
      if (op.type === 'set') {
        batch.set(op.ref, op.data);
      } else if (op.type === 'update') {
        batch.update(op.ref, op.data);
      }
    });
    
    batches.push(batch);
  }
  
  // Execute batches sequentially with retry
  for (let i = 0; i < batches.length; i++) {
    await withRetry(async () => {
      await batches[i].commit();
      console.log(`✅ Batch ${i + 1}/${batches.length} completed`);
    });
  }
}

// Essential data with smaller payloads
const essentialThemes = [
  {
    name: "Math Magic Academy",
    description: "Master magical mathematics!",
    category: "Math",
    difficulty: "Easy",
    imageUrl: "https://images.pexels.com/photos/3771074/pexels-photo-3771074.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 1,
    tasks: [
      {
        id: "math_001",
        title: "Addition Spells",
        description: "Learn addition with numbers 1-10",
        coinReward: 50,
        type: "quiz",
        difficulty: "Easy",
        estimatedTime: 5,
        isActive: true
      },
      {
        id: "math_002",
        title: "Subtraction Sorcery",
        description: "Master subtraction magic",
        coinReward: 60,
        type: "quiz",
        difficulty: "Easy",
        estimatedTime: 6,
        isActive: true
      }
    ]
  },
  {
    name: "Science Quest Lab",
    description: "Explore science wonders!",
    category: "Science",
    difficulty: "Medium",
    imageUrl: "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 2,
    tasks: [
      {
        id: "science_001",
        title: "States of Matter",
        description: "Discover matter states",
        coinReward: 75,
        type: "quiz",
        difficulty: "Medium",
        estimatedTime: 7,
        isActive: true
      }
    ]
  },
  {
    name: "Language Castle",
    description: "Build vocabulary skills!",
    category: "Language",
    difficulty: "Easy",
    imageUrl: "https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 3,
    tasks: [
      {
        id: "language_001",
        title: "Rhyme Time",
        description: "Find rhyming words",
        coinReward: 45,
        type: "matching",
        difficulty: "Easy",
        estimatedTime: 5,
        isActive: true
      }
    ]
  }
];

// Minimal system config
const systemConfig = {
  features: {
    friendsEnabled: true,
    roomsEnabled: true,
    leaderboardEnabled: true,
    coinsEnabled: true
  },
  settings: {
    maxFriends: 50,
    maxRoomPlayers: 8,
    coinRewardMultiplier: 1.0,
    maintenanceMode: false
  }
};

// Essential achievements
const achievements = [
  {
    id: "first_quest",
    name: "First Steps",
    description: "Complete your first quest",
    category: "milestone",
    rarity: "common",
    rewards: { coins: 25, experience: 10 }
  },
  {
    id: "coin_collector_100",
    name: "Coin Collector",
    description: "Earn 100 coins",
    category: "wealth",
    rarity: "common",
    rewards: { coins: 25, experience: 10 }
  }
];

// Main population function with optimized approach
async function optimizedPopulate() {
  console.log("🌱 Starting optimized database population...");
  
  try {
    // Step 1: Add themes one by one with retry
    console.log("📚 Adding themes...");
    const themesRef = getCollection("themes");
    
    for (const theme of essentialThemes) {
      await withRetry(async () => {
        const themeData = {
          ...theme,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          totalTasks: theme.tasks.length,
          totalRewards: theme.tasks.reduce((sum, task) => sum + task.coinReward, 0)
        };
        
        await themesRef.add(themeData);
        console.log(`  ✅ Added: ${theme.name}`);
      });
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 2: Add system config
    console.log("⚙️ Adding system configuration...");
    await withRetry(async () => {
      await getCollection("systemConfig").doc("features").set(systemConfig.features);
    });
    await withRetry(async () => {
      await getCollection("systemConfig").doc("settings").set(systemConfig.settings);
    });
    console.log("  ✅ System config added");

    // Step 3: Add achievements
    console.log("🏅 Adding achievements...");
    for (const achievement of achievements) {
      await withRetry(async () => {
        await getCollection("achievementDefinitions").doc(achievement.id).set({
          ...achievement,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`  ✅ Added: ${achievement.name}`);
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Step 4: Create leaderboards
    console.log("🏆 Creating leaderboards...");
    const leaderboardTypes = ["global", "daily", "weekly", "monthly"];
    
    for (const type of leaderboardTypes) {
      await withRetry(async () => {
        await getCollection("leaderboards").doc(type).set({
          rankings: [],
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          type: type
        });
        console.log(`  ✅ Created: ${type} leaderboard`);
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Step 5: Add game stats
    console.log("📊 Adding game stats...");
    await withRetry(async () => {
      await getCollection("gameStats").doc("global").set({
        totalUsers: 0,
        totalCoinsEarned: 0,
        totalTasksCompleted: 0,
        activeRooms: 0,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log("  ✅ Game stats added");
    });

    console.log("");
    console.log("🎉 Optimized population completed successfully!");
    console.log("");
    console.log("📋 Collections created:");
    console.log("  ✅ themes (3 themes with tasks)");
    console.log("  ✅ systemConfig (features & settings)");
    console.log("  ✅ achievementDefinitions (2 achievements)");
    console.log("  ✅ leaderboards (4 types)");
    console.log("  ✅ gameStats (global statistics)");
    console.log("");
    console.log("🚀 Your database is ready for testing!");

  } catch (error) {
    console.error("💥 Population failed:", error);
    console.log("");
    console.log("🔧 Troubleshooting:");
    console.log("1. Check your internet connection");
    console.log("2. Verify Firebase project ID in .env file");
    console.log("3. Ensure service account key has Firestore permissions");
    console.log("4. Try running the script again (it has retry logic)");
  } finally {
    // Graceful shutdown
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  }
}

// Run the optimized population
optimizedPopulate();