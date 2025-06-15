// Simplified database population script that works with existing setup
const admin = require("firebase-admin");

// Try to get project ID from environment or use default
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "kidquest-champions-dev";

console.log(`🔧 Attempting to populate database for project: ${PROJECT_ID}`);

// Check if service account key exists
let serviceAccount;
try {
  serviceAccount = require("./serviceAccountKey.json");
  console.log("✅ Service account key found");
} catch (error) {
  console.error("❌ Service account key not found at scripts/serviceAccountKey.json");
  console.log("📋 To fix this:");
  console.log("1. Go to Firebase Console → Project Settings → Service Accounts");
  console.log("2. Click 'Generate new private key'");
  console.log("3. Save the file as scripts/serviceAccountKey.json");
  process.exit(1);
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com/`,
  });
  console.log("✅ Firebase Admin initialized");
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error.message);
  process.exit(1);
}

const db = admin.firestore();
const BASE_PATH = `artifacts/${PROJECT_ID}/public/data`;

// Helper function to get collection reference
const getCollection = (collectionName) => {
  return db.collection(`${BASE_PATH}/${collectionName}`);
};

// Essential themes data
const themes = [
  {
    name: "Math Magic Academy",
    description: "Master magical mathematics and number spells!",
    category: "Math",
    difficulty: "Easy",
    imageUrl: "https://images.pexels.com/photos/3771074/pexels-photo-3771074.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 1,
    tasks: [
      {
        id: "math_001",
        title: "Addition Spells",
        description: "Learn to cast addition spells with numbers 1-10",
        coinReward: 50,
        type: "quiz",
        difficulty: "Easy",
        estimatedTime: 5,
        isActive: true,
        data: {
          questions: [
            { question: "What is 3 + 4?", answer: "7", options: ["6", "7", "8", "9"] },
            { question: "What is 5 + 2?", answer: "7", options: ["6", "7", "8", "9"] }
          ]
        }
      },
      {
        id: "math_002",
        title: "Subtraction Sorcery",
        description: "Master the art of subtraction magic",
        coinReward: 60,
        type: "quiz",
        difficulty: "Easy",
        estimatedTime: 6,
        isActive: true
      }
    ]
  },
  {
    name: "Science Quest Laboratory",
    description: "Explore the wonders of science through magical experiments!",
    category: "Science",
    difficulty: "Medium",
    imageUrl: "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 2,
    tasks: [
      {
        id: "science_001",
        title: "States of Matter Magic",
        description: "Discover the three states of matter",
        coinReward: 75,
        type: "quiz",
        difficulty: "Medium",
        estimatedTime: 7,
        isActive: true
      }
    ]
  },
  {
    name: "Language Arts Castle",
    description: "Build your vocabulary and reading skills!",
    category: "Language",
    difficulty: "Easy",
    imageUrl: "https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 3,
    tasks: [
      {
        id: "language_001",
        title: "Rhyme Time Spell",
        description: "Find words that rhyme together",
        coinReward: 45,
        type: "matching",
        difficulty: "Easy",
        estimatedTime: 5,
        isActive: true
      }
    ]
  }
];

// System configuration
const systemConfig = {
  features: {
    friendsEnabled: true,
    roomsEnabled: true,
    leaderboardEnabled: true,
    coinsEnabled: true,
    achievementsEnabled: true
  },
  settings: {
    maxFriends: 50,
    maxRoomPlayers: 8,
    coinRewardMultiplier: 1.0,
    maintenanceMode: false
  }
};

// Achievement definitions
const achievements = [
  {
    id: "first_quest",
    name: "First Steps",
    description: "Complete your first quest",
    category: "milestone",
    rarity: "common",
    iconUrl: "🎯",
    rewards: { coins: 25, experience: 10 }
  },
  {
    id: "quest_master_5",
    name: "Quest Warrior",
    description: "Complete 5 quests",
    category: "milestone",
    rarity: "rare",
    iconUrl: "⚔️",
    rewards: { coins: 50, experience: 25 }
  },
  {
    id: "coin_collector_100",
    name: "Coin Collector",
    description: "Earn 100 coins",
    category: "wealth",
    rarity: "common",
    iconUrl: "🪙",
    rewards: { coins: 25, experience: 10 }
  }
];

// Main population function
async function populateDatabase() {
  console.log("🌱 Starting database population...");

  try {
    // 1. Add themes
    console.log("📚 Adding themes...");
    const themesRef = getCollection("themes");
    for (const theme of themes) {
      const themeData = {
        ...theme,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalTasks: theme.tasks.length,
        totalRewards: theme.tasks.reduce((sum, task) => sum + task.coinReward, 0)
      };
      await themesRef.add(themeData);
      console.log(`  ✅ Added: ${theme.name}`);
    }

    // 2. Add system config
    console.log("⚙️ Adding system configuration...");
    await getCollection("systemConfig").doc("features").set(systemConfig.features);
    await getCollection("systemConfig").doc("settings").set(systemConfig.settings);
    console.log("  ✅ System config added");

    // 3. Add achievement definitions
    console.log("🏅 Adding achievements...");
    for (const achievement of achievements) {
      await getCollection("achievementDefinitions").doc(achievement.id).set({
        ...achievement,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`  ✅ Added: ${achievement.name}`);
    }

    // 4. Create empty leaderboards
    console.log("🏆 Creating leaderboards...");
    const leaderboardTypes = ["global", "daily", "weekly", "monthly"];
    for (const type of leaderboardTypes) {
      await getCollection("leaderboards").doc(type).set({
        rankings: [],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        type: type
      });
      console.log(`  ✅ Created: ${type} leaderboard`);
    }

    // 5. Add global stats
    console.log("📊 Adding game stats...");
    await getCollection("gameStats").doc("global").set({
      totalUsers: 0,
      totalCoinsEarned: 0,
      totalTasksCompleted: 0,
      activeRooms: 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("  ✅ Game stats added");

    console.log("");
    console.log("🎉 Database population completed successfully!");
    console.log("");
    console.log("📋 Collections created:");
    console.log("  ✅ themes (3 themes with tasks)");
    console.log("  ✅ systemConfig (features & settings)");
    console.log("  ✅ achievementDefinitions (3 achievements)");
    console.log("  ✅ leaderboards (4 types)");
    console.log("  ✅ gameStats (global statistics)");
    console.log("");
    console.log("🔄 Your API system now has data to work with!");

  } catch (error) {
    console.error("💥 Population failed:", error);
    console.log("");
    console.log("🔧 Troubleshooting:");
    console.log("1. Check your Firebase project ID in .env file");
    console.log("2. Verify service account key has proper permissions");
    console.log("3. Ensure Firestore is enabled in Firebase Console");
  } finally {
    process.exit(0);
  }
}

// Run the population
populateDatabase();