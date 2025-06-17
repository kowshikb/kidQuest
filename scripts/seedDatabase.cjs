const admin = require("firebase-admin");
const { questThemes } = require("./questsDataForSeed.cjs");
const { hobbiesData } = require("./populateHobbiesData.cjs"); // Assuming hobbies data is exported

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");

// Correctly specify the project ID and the target artifact ID
const PROJECT_ID = "kidquest-champions";
// Get artifactId from command line arguments, default to dev
const ARTIFACT_ID = process.argv[2] || "kidquest-champions-dev";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const BASE_PATH = `artifacts/${ARTIFACT_ID}/public/data`;

async function seedThemes() {
  console.log("🌱 Seeding themes...");
  const themesCollection = db.collection(`${BASE_PATH}/themes`);
  const batch = db.batch();

  for (const theme of questThemes) {
    const themeRef = themesCollection.doc(theme.id);
    const themeWithTimestamp = {
      ...theme,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(themeRef, themeWithTimestamp);
  }

  try {
    await batch.commit();
    console.log(`✅ ${questThemes.length} themes seeded successfully.`);
  } catch (error) {
    console.error("❌ Error seeding themes:", error);
    throw error;
  }
}

async function seedHobbies() {
  console.log("🎨 Seeding hobbies...");
  const hobbiesCollection = db.collection(`${BASE_PATH}/hobbies`);
  const batch = db.batch();

  for (const hobby of hobbiesData) {
    const hobbyDocRef = hobbiesCollection.doc();
    const hobbyData = JSON.parse(JSON.stringify(hobby));

    // Replace server timestamps in nested tasks
    hobbyData.levels.forEach((level) => {
      level.tasks.forEach((task) => {
        task.createdAt = new Date();
        task.updatedAt = new Date();
      });
      level.totalCoins = level.tasks.reduce(
        (sum, task) => sum + (task.coinReward || 0),
        0
      );
    });

    hobbyData.totalDays = hobbyData.levels.reduce(
      (sum, level) => sum + (level.totalDays || 0),
      0
    );
    hobbyData.totalCoins = hobbyData.levels.reduce(
      (sum, level) => sum + (level.totalCoins || 0),
      0
    );

    hobbyData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    hobbyData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    batch.set(hobbyDocRef, hobbyData);
  }

  try {
    await batch.commit();
    console.log(`✅ ${hobbiesData.length} hobbies seeded successfully.`);
  } catch (error) {
    console.error("❌ Error seeding hobbies:", error);
    throw error;
  }
}

async function main() {
  console.log(`🚀 Starting database population for project: ${PROJECT_ID}`);
  console.log(`🎯 Targeting artifact: ${ARTIFACT_ID}`);
  try {
    await seedThemes();
    await seedHobbies();
    console.log("🎉 Database population completed successfully!");
  } catch (error) {
    console.error("💥 Database population failed.", error);
    throw error; // Re-throw to allow process to exit with failure
  }
}

main().catch(() => process.exit(1));
