// Comprehensive database population script for KidQuest Champions
// This script creates all required collections and populates them with initial data

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");

// Get the project ID from environment variables or use a default
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "kidquest-champions-dev";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com/`,
});

const db = admin.firestore();
const APP_ID = PROJECT_ID;
const BASE_PATH = `/artifacts/${APP_ID}/public/data`;

// Helper function to get collection reference
const getCollection = (collectionName) => {
  return db.collection(`artifacts/${APP_ID}/public/data/${collectionName}`);
};

// Comprehensive theme data with multiple categories
const gameThemes = [
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
            { question: "What is 5 + 2?", answer: "7", options: ["6", "7", "8", "9"] },
            { question: "What is 8 + 1?", answer: "9", options: ["7", "8", "9", "10"] }
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
        isActive: true,
        data: {
          questions: [
            { question: "What is 10 - 3?", answer: "7", options: ["6", "7", "8", "9"] },
            { question: "What is 9 - 4?", answer: "5", options: ["4", "5", "6", "7"] }
          ]
        }
      },
      {
        id: "math_003",
        title: "Multiplication Mastery",
        description: "Unlock the secrets of multiplication",
        coinReward: 75,
        type: "quiz",
        difficulty: "Medium",
        estimatedTime: 8,
        isActive: true,
        data: {
          questions: [
            { question: "What is 3 × 4?", answer: "12", options: ["10", "11", "12", "13"] },
            { question: "What is 5 × 2?", answer: "10", options: ["8", "9", "10", "11"] }
          ]
        }
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
        isActive: true,
        data: {
          questions: [
            { question: "What happens to ice when it gets warm?", answer: "It melts", options: ["It melts", "It freezes", "It disappears", "It grows"] },
            { question: "What state is water vapor?", answer: "Gas", options: ["Solid", "Liquid", "Gas", "Plasma"] }
          ]
        }
      },
      {
        id: "science_002",
        title: "Animal Kingdom Adventure",
        description: "Learn about different animal habitats",
        coinReward: 80,
        type: "matching",
        difficulty: "Medium",
        estimatedTime: 10,
        isActive: true,
        data: {
          pairs: [
            { animal: "Fish", habitat: "Water" },
            { animal: "Bird", habitat: "Sky" },
            { animal: "Bear", habitat: "Forest" }
          ]
        }
      }
    ]
  },
  {
    name: "Language Arts Castle",
    description: "Build your vocabulary and reading skills in the magical castle!",
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
        isActive: true,
        data: {
          pairs: [
            { word1: "Cat", word2: "Hat" },
            { word1: "Dog", word2: "Log" },
            { word1: "Sun", word2: "Fun" }
          ]
        }
      },
      {
        id: "language_002",
        title: "Story Building Blocks",
        description: "Create magical stories with beginning, middle, and end",
        coinReward: 65,
        type: "creative",
        difficulty: "Medium",
        estimatedTime: 15,
        isActive: true,
        data: {
          prompt: "Write a short story about a magical adventure",
          minWords: 50
        }
      }
    ]
  },
  {
    name: "Art & Creativity Studio",
    description: "Express yourself through magical art and creative projects!",
    category: "Art",
    difficulty: "Easy",
    imageUrl: "https://images.pexels.com/photos/1037992/pexels-photo-1037992.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 4,
    tasks: [
      {
        id: "art_001",
        title: "Color Mixing Magic",
        description: "Learn what happens when you mix primary colors",
        coinReward: 55,
        type: "quiz",
        difficulty: "Easy",
        estimatedTime: 6,
        isActive: true,
        data: {
          questions: [
            { question: "What color do you get when you mix red and blue?", answer: "Purple", options: ["Purple", "Green", "Orange", "Yellow"] },
            { question: "What color do you get when you mix yellow and blue?", answer: "Green", options: ["Purple", "Green", "Orange", "Pink"] }
          ]
        }
      },
      {
        id: "art_002",
        title: "Shape Recognition Quest",
        description: "Identify and draw different magical shapes",
        coinReward: 50,
        type: "drawing",
        difficulty: "Easy",
        estimatedTime: 8,
        isActive: true,
        data: {
          shapes: ["Circle", "Square", "Triangle", "Rectangle", "Star"]
        }
      }
    ]
  },
  {
    name: "Social Skills Academy",
    description: "Learn to work together and make friends!",
    category: "Social-Emotional",
    difficulty: "Medium",
    imageUrl: "https://images.pexels.com/photos/1181534/pexels-photo-1181534.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 5,
    tasks: [
      {
        id: "social_001",
        title: "Friendship Building",
        description: "Learn how to be a good friend",
        coinReward: 60,
        type: "activity",
        difficulty: "Medium",
        estimatedTime: 10,
        isActive: true
      },
      {
        id: "social_002",
        title: "Teamwork Challenge",
        description: "Practice working together with others",
        coinReward: 70,
        type: "group",
        difficulty: "Medium",
        estimatedTime: 12,
        isActive: true
      }
    ]
  },
  {
    name: "Life Skills Workshop",
    description: "Master important skills for everyday life!",
    category: "Life Skills",
    difficulty: "Easy",
    imageUrl: "https://images.pexels.com/photos/1181772/pexels-photo-1181772.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 6,
    tasks: [
      {
        id: "life_001",
        title: "Time Management Magic",
        description: "Learn to organize your time wisely",
        coinReward: 50,
        type: "activity",
        difficulty: "Easy",
        estimatedTime: 8,
        isActive: true
      },
      {
        id: "life_002",
        title: "Money Matters",
        description: "Understand the basics of money and saving",
        coinReward: 75,
        type: "quiz",
        difficulty: "Medium",
        estimatedTime: 10,
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
    achievementsEnabled: true,
    badgesEnabled: true,
    challengesEnabled: true,
    notificationsEnabled: true
  },
  settings: {
    maxFriends: 50,
    maxRoomPlayers: 8,
    coinRewardMultiplier: 1.0,
    maintenanceMode: false,
    dailyChallengeCount: 3,
    weeklyGoalCount: 2,
    maxNotifications: 100
  }
};

// Global game stats
const gameStats = {
  totalUsers: 0,
  totalCoinsEarned: 0,
  totalTasksCompleted: 0,
  activeRooms: 0,
  totalAchievements: 0,
  totalBadges: 0,
  lastUpdated: admin.firestore.FieldValue.serverTimestamp()
};

// Achievement definitions
const achievementDefinitions = [
  {
    id: "first_quest",
    name: "First Steps",
    description: "Complete your first quest",
    category: "milestone",
    rarity: "common",
    iconUrl: "🎯",
    condition: "completedTasks >= 1",
    rewards: { coins: 25, experience: 10 }
  },
  {
    id: "quest_master_5",
    name: "Quest Warrior",
    description: "Complete 5 quests",
    category: "milestone",
    rarity: "rare",
    iconUrl: "⚔️",
    condition: "completedTasks >= 5",
    rewards: { coins: 50, experience: 25 }
  },
  {
    id: "quest_master_10",
    name: "Quest Champion",
    description: "Complete 10 quests",
    category: "milestone",
    rarity: "epic",
    iconUrl: "🏆",
    condition: "completedTasks >= 10",
    rewards: { coins: 100, experience: 50 }
  },
  {
    id: "coin_collector_100",
    name: "Coin Collector",
    description: "Earn 100 coins",
    category: "wealth",
    rarity: "common",
    iconUrl: "🪙",
    condition: "coins >= 100",
    rewards: { coins: 25, experience: 10 }
  },
  {
    id: "coin_collector_500",
    name: "Treasure Hunter",
    description: "Earn 500 coins",
    category: "wealth",
    rarity: "rare",
    iconUrl: "💰",
    condition: "coins >= 500",
    rewards: { coins: 75, experience: 35 }
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Add 5 friends",
    category: "social",
    rarity: "rare",
    iconUrl: "🦋",
    condition: "friendsCount >= 5",
    rewards: { coins: 50, experience: 25 }
  },
  {
    id: "level_master_5",
    name: "Rising Star",
    description: "Reach level 5",
    category: "progression",
    rarity: "rare",
    iconUrl: "⭐",
    condition: "level >= 5",
    rewards: { coins: 100, experience: 50 }
  },
  {
    id: "level_master_10",
    name: "Champion",
    description: "Reach level 10",
    category: "progression",
    rarity: "epic",
    iconUrl: "👑",
    condition: "level >= 10",
    rewards: { coins: 200, experience: 100 }
  }
];

// Badge definitions
const badgeDefinitions = [
  {
    id: "math_expert",
    name: "Math Expert",
    description: "Complete all math quests",
    type: "skill",
    iconUrl: "🧮",
    condition: "category_math_complete"
  },
  {
    id: "science_explorer",
    name: "Science Explorer",
    description: "Complete all science quests",
    type: "skill",
    iconUrl: "🔬",
    condition: "category_science_complete"
  },
  {
    id: "word_wizard",
    name: "Word Wizard",
    description: "Complete all language quests",
    type: "skill",
    iconUrl: "📚",
    condition: "category_language_complete"
  },
  {
    id: "creative_genius",
    name: "Creative Genius",
    description: "Complete all art quests",
    type: "skill",
    iconUrl: "🎨",
    condition: "category_art_complete"
  },
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "One of the first 100 users",
    type: "special",
    iconUrl: "🚀",
    condition: "user_number <= 100"
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Maintain a 7-day streak",
    type: "milestone",
    iconUrl: "🔥",
    condition: "streakDays >= 7"
  }
];

// Sample notifications
const sampleNotifications = [
  {
    type: "system",
    title: "Welcome to KidQuest Champions!",
    message: "Start your magical learning journey today!",
    iconUrl: "🎉",
    isRead: false,
    actionUrl: "/quests"
  },
  {
    type: "achievement",
    title: "Achievement Available!",
    message: "You're close to unlocking your first achievement!",
    iconUrl: "🏆",
    isRead: false,
    actionUrl: "/profile"
  }
];

// Function to seed themes
async function seedThemes() {
  console.log("🎯 Seeding themes...");
  const themesRef = getCollection("themes");

  for (const theme of gameThemes) {
    try {
      const themeData = {
        ...theme,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalTasks: theme.tasks.length,
        totalRewards: theme.tasks.reduce((sum, task) => sum + task.coinReward, 0),
        estimatedDuration: theme.tasks.reduce((sum, task) => sum + (task.estimatedTime || 5), 0)
      };

      await themesRef.add(themeData);
      console.log(`✅ Added theme: ${theme.name}`);
    } catch (error) {
      console.error(`❌ Error adding theme ${theme.name}:`, error);
    }
  }
}

// Function to seed system configuration
async function seedSystemConfig() {
  console.log("⚙️ Seeding system configuration...");

  try {
    // Add features config
    await getCollection("systemConfig").doc("features").set(systemConfig.features);
    console.log("✅ Added system features configuration");

    // Add settings config
    await getCollection("systemConfig").doc("settings").set(systemConfig.settings);
    console.log("✅ Added system settings configuration");
  } catch (error) {
    console.error("❌ Error adding system configuration:", error);
  }
}

// Function to seed game stats
async function seedGameStats() {
  console.log("📊 Seeding game statistics...");

  try {
    await getCollection("gameStats").doc("global").set(gameStats);
    console.log("✅ Added global game statistics");
  } catch (error) {
    console.error("❌ Error adding game statistics:", error);
  }
}

// Function to create empty leaderboards
async function seedLeaderboards() {
  console.log("🏆 Seeding leaderboards...");

  const leaderboardTypes = ["global", "daily", "weekly", "monthly"];

  for (const type of leaderboardTypes) {
    try {
      await getCollection("leaderboards").doc(type).set({
        rankings: [],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        type: type,
        period: type === "global" ? "all-time" : type
      });
      console.log(`✅ Created ${type} leaderboard`);
    } catch (error) {
      console.error(`❌ Error creating ${type} leaderboard:`, error);
    }
  }
}

// Function to seed achievement definitions
async function seedAchievements() {
  console.log("🏅 Seeding achievement definitions...");

  for (const achievement of achievementDefinitions) {
    try {
      await getCollection("achievementDefinitions").doc(achievement.id).set({
        ...achievement,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Added achievement: ${achievement.name}`);
    } catch (error) {
      console.error(`❌ Error adding achievement ${achievement.name}:`, error);
    }
  }
}

// Function to seed badge definitions
async function seedBadges() {
  console.log("🎖️ Seeding badge definitions...");

  for (const badge of badgeDefinitions) {
    try {
      await getCollection("badgeDefinitions").doc(badge.id).set({
        ...badge,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Added badge: ${badge.name}`);
    } catch (error) {
      console.error(`❌ Error adding badge ${badge.name}:`, error);
    }
  }
}

// Function to seed sample notifications
async function seedNotifications() {
  console.log("🔔 Seeding sample notifications...");

  for (const notification of sampleNotifications) {
    try {
      await getCollection("notifications").add({
        ...notification,
        userId: "system", // System notifications
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Added notification: ${notification.title}`);
    } catch (error) {
      console.error(`❌ Error adding notification:`, error);
    }
  }
}

// Function to create activity feed templates
async function seedActivityTemplates() {
  console.log("📱 Seeding activity templates...");

  const activityTemplates = [
    {
      id: "quest_completed",
      template: "{username} completed the quest '{questName}'",
      type: "quest_completed",
      iconUrl: "🎯"
    },
    {
      id: "achievement_unlocked",
      template: "{username} unlocked the '{achievementName}' achievement",
      type: "achievement_unlocked",
      iconUrl: "🏆"
    },
    {
      id: "level_up",
      template: "{username} reached level {level}",
      type: "level_up",
      iconUrl: "⭐"
    },
    {
      id: "friend_added",
      template: "{username} and {friendName} became friends",
      type: "friend_added",
      iconUrl: "🤝"
    }
  ];

  for (const template of activityTemplates) {
    try {
      await getCollection("activityTemplates").doc(template.id).set({
        ...template,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Added activity template: ${template.id}`);
    } catch (error) {
      console.error(`❌ Error adding activity template:`, error);
    }
  }
}

// Function to create challenge templates
async function seedChallengeTemplates() {
  console.log("🎮 Seeding challenge templates...");

  const challengeTemplates = [
    {
      id: "daily_quests",
      name: "Daily Quest Master",
      description: "Complete {count} quests today",
      type: "daily",
      defaultCount: 3,
      rewards: { coins: 50, experience: 25 },
      difficulty: "easy"
    },
    {
      id: "daily_coins",
      name: "Coin Collector",
      description: "Earn {count} coins today",
      type: "daily",
      defaultCount: 100,
      rewards: { coins: 25, experience: 15 },
      difficulty: "easy"
    },
    {
      id: "weekly_social",
      name: "Social Champion",
      description: "Challenge {count} friends this week",
      type: "weekly",
      defaultCount: 2,
      rewards: { coins: 100, experience: 50 },
      difficulty: "medium"
    },
    {
      id: "weekly_streak",
      name: "Consistency King",
      description: "Maintain a {count}-day streak",
      type: "weekly",
      defaultCount: 7,
      rewards: { coins: 150, experience: 75 },
      difficulty: "hard"
    }
  ];

  for (const template of challengeTemplates) {
    try {
      await getCollection("challengeTemplates").doc(template.id).set({
        ...template,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Added challenge template: ${template.name}`);
    } catch (error) {
      console.error(`❌ Error adding challenge template:`, error);
    }
  }
}

// Main population function
async function populateGameData() {
  console.log("🌱 Starting comprehensive game data population...");
  console.log(`📍 Project ID: ${PROJECT_ID}`);
  console.log(`📍 Base path: ${BASE_PATH}`);

  try {
    // Seed all collections
    await seedThemes();
    await seedSystemConfig();
    await seedGameStats();
    await seedLeaderboards();
    await seedAchievements();
    await seedBadges();
    await seedNotifications();
    await seedActivityTemplates();
    await seedChallengeTemplates();

    console.log("");
    console.log("🎉 Game data population completed successfully!");
    console.log("");
    console.log("📋 Collections created:");
    console.log("  ✅ themes - Quest themes and tasks");
    console.log("  ✅ systemConfig - Feature flags and settings");
    console.log("  ✅ gameStats - Global game statistics");
    console.log("  ✅ leaderboards - Ranking data");
    console.log("  ✅ achievementDefinitions - Achievement templates");
    console.log("  ✅ badgeDefinitions - Badge templates");
    console.log("  ✅ notifications - System notifications");
    console.log("  ✅ activityTemplates - Activity feed templates");
    console.log("  ✅ challengeTemplates - Challenge templates");
    console.log("");
    console.log("🔄 Next steps:");
    console.log("1. Deploy Firestore rules and indexes");
    console.log("2. Test the comprehensive API system");
    console.log("3. Verify all data is accessible from the frontend");
    console.log("4. Check real-time updates are working");

  } catch (error) {
    console.error("💥 Game data population failed:", error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the population
populateGameData();