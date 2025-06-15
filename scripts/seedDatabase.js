// Database seeding script for KidQuest Champions
// Run this script to populate your Firestore database with initial data

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
const serviceAccount = require("./serviceAccountKey.json"); // Download this from Firebase Console

// Get the project ID from environment variables or use a default
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "kidquest-champions-dev";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com/`, // Updated to use PROJECT_ID
});

const db = admin.firestore();
const APP_ID = PROJECT_ID; // Use the same PROJECT_ID as APP_ID for consistency
const BASE_PATH = `/artifacts/${APP_ID}/public/data`;

// Helper function to get collection reference
const getCollection = (collectionName) => {
  return db.collection(`artifacts/${APP_ID}/public/data/${collectionName}`);
};

// Sample theme data
const initialThemes = [
  {
    name: "Math Magic Academy",
    description: "Master magical mathematics and number spells!",
    category: "Education",
    difficulty: "Easy",
    imageUrl:
      "https://images.pexels.com/photos/3771074/pexels-photo-3771074.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 1,
    tasks: [
      {
        id: "math_001",
        title: "Addition Spells",
        description: "Learn to cast addition spells with numbers 1-10",
        coins: 50,
        type: "quiz",
        data: {
          questions: [
            {
              question: "What is 3 + 4?",
              answer: "7",
              options: ["6", "7", "8", "9"],
            },
            {
              question: "What is 5 + 2?",
              answer: "7",
              options: ["6", "7", "8", "9"],
            },
            {
              question: "What is 1 + 6?",
              answer: "7",
              options: ["6", "7", "8", "9"],
            },
          ],
        },
      },
      {
        id: "math_002",
        title: "Subtraction Sorcery",
        description: "Master the art of subtraction magic",
        coins: 60,
        type: "quiz",
        data: {
          questions: [
            {
              question: "What is 10 - 3?",
              answer: "7",
              options: ["6", "7", "8", "9"],
            },
            {
              question: "What is 8 - 2?",
              answer: "6",
              options: ["6", "7", "8", "9"],
            },
            {
              question: "What is 9 - 4?",
              answer: "5",
              options: ["4", "5", "6", "7"],
            },
          ],
        },
      },
    ],
  },
  {
    name: "Science Quest Laboratory",
    description: "Explore the wonders of science through magical experiments!",
    category: "Science",
    difficulty: "Medium",
    imageUrl:
      "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 2,
    tasks: [
      {
        id: "science_001",
        title: "States of Matter Magic",
        description: "Discover the three states of matter",
        coins: 75,
        type: "quiz",
        data: {
          questions: [
            {
              question: "What happens to ice when it gets warm?",
              answer: "It melts",
              options: ["It melts", "It freezes", "It disappears", "It grows"],
            },
            {
              question: "What state is water vapor?",
              answer: "Gas",
              options: ["Solid", "Liquid", "Gas", "Plasma"],
            },
          ],
        },
      },
      {
        id: "science_002",
        title: "Animal Kingdom Adventure",
        description: "Learn about different animal habitats",
        coins: 80,
        type: "matching",
        data: {
          pairs: [
            { animal: "Fish", habitat: "Water" },
            { animal: "Bird", habitat: "Sky" },
            { animal: "Bear", habitat: "Forest" },
          ],
        },
      },
    ],
  },
  {
    name: "Language Arts Castle",
    description:
      "Build your vocabulary and reading skills in the magical castle!",
    category: "Language",
    difficulty: "Easy",
    imageUrl:
      "https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 3,
    tasks: [
      {
        id: "language_001",
        title: "Rhyme Time Spell",
        description: "Find words that rhyme together",
        coins: 45,
        type: "matching",
        data: {
          pairs: [
            { word1: "Cat", word2: "Hat" },
            { word1: "Dog", word2: "Log" },
            { word1: "Sun", word2: "Fun" },
          ],
        },
      },
      {
        id: "language_002",
        title: "Story Building Blocks",
        description: "Create magical stories with beginning, middle, and end",
        coins: 65,
        type: "creative",
        data: {
          prompt: "Write a short story about a magical adventure",
          minWords: 50,
        },
      },
    ],
  },
  {
    name: "Art & Creativity Studio",
    description: "Express yourself through magical art and creative projects!",
    category: "Art",
    difficulty: "Easy",
    imageUrl:
      "https://images.pexels.com/photos/1037992/pexels-photo-1037992.jpeg?auto=compress&cs=tinysrgb&w=400",
    isActive: true,
    order: 4,
    tasks: [
      {
        id: "art_001",
        title: "Color Mixing Magic",
        description: "Learn what happens when you mix primary colors",
        coins: 55,
        type: "quiz",
        data: {
          questions: [
            {
              question: "What color do you get when you mix red and blue?",
              answer: "Purple",
              options: ["Purple", "Green", "Orange", "Yellow"],
            },
            {
              question: "What color do you get when you mix yellow and blue?",
              answer: "Green",
              options: ["Purple", "Green", "Orange", "Pink"],
            },
          ],
        },
      },
      {
        id: "art_002",
        title: "Shape Recognition Quest",
        description: "Identify and draw different magical shapes",
        coins: 50,
        type: "drawing",
        data: {
          shapes: ["Circle", "Square", "Triangle", "Rectangle", "Star"],
        },
      },
    ],
  },
];

// Sample rooms data
const initialRooms = [
  {
    name: "Math Challenge Arena",
    description: "Compete in fast-paced math challenges!",
    maxPlayers: 4,
    currentPlayers: 0,
    isActive: true,
    difficulty: "Easy",
    category: "Math",
    createdBy: "system",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    participants: [],
    status: "waiting",
    messages: [],
    currentChallenge: null,
  },
  {
    name: "Science Trivia Tower",
    description: "Test your science knowledge against other explorers!",
    maxPlayers: 6,
    currentPlayers: 0,
    isActive: true,
    difficulty: "Medium",
    category: "Science",
    createdBy: "system",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    participants: [],
    status: "waiting",
    messages: [],
    currentChallenge: null,
  },
  {
    name: "Word Wizard Duel",
    description: "Battle with words and vocabulary!",
    maxPlayers: 2,
    currentPlayers: 0,
    isActive: true,
    difficulty: "Easy",
    category: "Language",
    createdBy: "system",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    participants: [],
    status: "waiting",
    messages: [],
    currentChallenge: null,
  },
];

// System configuration
const systemConfig = {
  features: {
    friendsEnabled: true,
    roomsEnabled: true,
    leaderboardEnabled: true,
    coinsEnabled: true,
  },
  settings: {
    maxFriends: 50,
    maxRoomPlayers: 8,
    coinRewardMultiplier: 1.0,
    maintenanceMode: false,
  },
};

// Global game stats
const gameStats = {
  totalUsers: 0,
  totalCoinsEarned: 0,
  totalTasksCompleted: 0,
  activeRooms: 0,
  lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
};

// Function to seed themes
async function seedThemes() {
  console.log("Seeding themes...");
  const themesRef = getCollection("themes");

  for (const theme of initialThemes) {
    try {
      await themesRef.add(theme);
      console.log(`✅ Added theme: ${theme.name}`);
    } catch (error) {
      console.error(`❌ Error adding theme ${theme.name}:`, error);
    }
  }
}

// Function to seed rooms
async function seedRooms() {
  console.log("Seeding rooms...");
  const roomsRef = getCollection("rooms");

  for (const room of initialRooms) {
    try {
      await roomsRef.add(room);
      console.log(`✅ Added room: ${room.name}`);
    } catch (error) {
      console.error(`❌ Error adding room ${room.name}:`, error);
    }
  }
}

// Function to seed system configuration
async function seedSystemConfig() {
  console.log("Seeding system configuration...");

  try {
    // Add features config
    await getCollection("systemConfig")
      .doc("features")
      .set(systemConfig.features);
    console.log("✅ Added system features configuration");

    // Add settings config
    await getCollection("systemConfig")
      .doc("settings")
      .set(systemConfig.settings);
    console.log("✅ Added system settings configuration");
  } catch (error) {
    console.error("❌ Error adding system configuration:", error);
  }
}

// Function to seed game stats
async function seedGameStats() {
  console.log("Seeding game statistics...");

  try {
    await getCollection("gameStats").doc("global").set(gameStats);
    console.log("✅ Added global game statistics");
  } catch (error) {
    console.error("❌ Error adding game statistics:", error);
  }
}

// Function to create empty leaderboards
async function seedLeaderboards() {
  console.log("Seeding leaderboards...");

  const leaderboardTypes = ["global", "daily", "weekly", "monthly"];

  for (const type of leaderboardTypes) {
    try {
      await getCollection("leaderboards").doc(type).set({
        rankings: [],
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Created ${type} leaderboard`);
    } catch (error) {
      console.error(`❌ Error creating ${type} leaderboard:`, error);
    }
  }
}

// Main seeding function
async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  console.log(`📍 Project ID: ${PROJECT_ID}`);
  console.log(`📍 Base path: ${BASE_PATH}`);

  try {
    await seedThemes();
    await seedRooms();
    await seedSystemConfig();
    await seedGameStats();
    await seedLeaderboards();

    console.log("🎉 Database seeding completed successfully!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Update your Firestore security rules");
    console.log("2. Set up the required indexes");
    console.log("3. Test the application with the new data");
  } catch (error) {
    console.error("💥 Database seeding failed:", error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the seeding
seedDatabase();