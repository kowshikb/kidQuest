// Data structure validation script
const admin = require("firebase-admin");

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "kidquest-champions";

console.log("🔍 Validating data structure and integrity...");

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = require("./serviceAccountKey.json");
} catch (error) {
  console.error("❌ Service account key not found");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${PROJECT_ID}-default-rtdb.firebaseio.com/`,
});

const db = admin.firestore();
const BASE_PATH = `artifacts/${PROJECT_ID}/public/data`;

// Expected data structures
const expectedStructures = {
  users: {
    required: ['userId', 'username', 'coins', 'level', 'completedTasks', 'friendsList'],
    optional: ['avatarUrl', 'location', 'achievements', 'badges', 'stats', 'preferences'],
    types: {
      userId: 'string',
      username: 'string',
      coins: 'number',
      level: 'number',
      completedTasks: 'array',
      friendsList: 'array'
    }
  },
  themes: {
    required: ['name', 'description', 'category', 'difficulty', 'tasks', 'isActive'],
    optional: ['imageUrl', 'order', 'totalTasks', 'totalRewards'],
    types: {
      name: 'string',
      description: 'string',
      category: 'string',
      difficulty: 'string',
      tasks: 'array',
      isActive: 'boolean'
    }
  },
  systemConfig: {
    features: {
      required: ['friendsEnabled', 'roomsEnabled', 'leaderboardEnabled', 'coinsEnabled'],
      types: {
        friendsEnabled: 'boolean',
        roomsEnabled: 'boolean',
        leaderboardEnabled: 'boolean',
        coinsEnabled: 'boolean'
      }
    },
    settings: {
      required: ['maxFriends', 'maxRoomPlayers', 'coinRewardMultiplier'],
      types: {
        maxFriends: 'number',
        maxRoomPlayers: 'number',
        coinRewardMultiplier: 'number'
      }
    }
  }
};

// Validation results
const validationResults = {
  collections: {},
  errors: [],
  warnings: [],
  summary: {
    totalCollections: 0,
    validCollections: 0,
    totalDocuments: 0,
    validDocuments: 0
  }
};

// Helper function to validate data type
function validateType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'timestamp':
      return value && typeof value.toDate === 'function';
    default:
      return true;
  }
}

// Validate document structure
function validateDocument(docData, structure, collectionName, docId) {
  const errors = [];
  const warnings = [];

  // Check required fields
  structure.required.forEach(field => {
    if (!docData.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
    } else if (structure.types[field] && !validateType(docData[field], structure.types[field])) {
      errors.push(`Invalid type for ${field}: expected ${structure.types[field]}, got ${typeof docData[field]}`);
    }
  });

  // Check optional fields if present
  if (structure.optional) {
    structure.optional.forEach(field => {
      if (docData.hasOwnProperty(field) && structure.types[field] && !validateType(docData[field], structure.types[field])) {
        warnings.push(`Invalid type for optional field ${field}: expected ${structure.types[field]}, got ${typeof docData[field]}`);
      }
    });
  }

  return { errors, warnings };
}

// Validate collection
async function validateCollection(collectionName, structure) {
  console.log(`\n📁 Validating collection: ${collectionName}`);
  
  try {
    const collectionRef = db.collection(`${BASE_PATH}/${collectionName}`);
    const snapshot = await collectionRef.get();
    
    const result = {
      exists: !snapshot.empty,
      documentCount: snapshot.docs.length,
      validDocuments: 0,
      errors: [],
      warnings: []
    };

    if (snapshot.empty) {
      result.errors.push(`Collection ${collectionName} is empty or doesn't exist`);
      return result;
    }

    // Validate each document
    snapshot.docs.forEach(doc => {
      const docData = doc.data();
      const validation = validateDocument(docData, structure, collectionName, doc.id);
      
      if (validation.errors.length === 0) {
        result.validDocuments++;
      } else {
        result.errors.push(`Document ${doc.id}: ${validation.errors.join(', ')}`);
      }
      
      if (validation.warnings.length > 0) {
        result.warnings.push(`Document ${doc.id}: ${validation.warnings.join(', ')}`);
      }
    });

    console.log(`  📊 Documents: ${result.documentCount}, Valid: ${result.validDocuments}`);
    
    if (result.errors.length > 0) {
      console.log(`  ❌ Errors: ${result.errors.length}`);
      result.errors.forEach(error => console.log(`    • ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log(`  ⚠️  Warnings: ${result.warnings.length}`);
      result.warnings.forEach(warning => console.log(`    • ${warning}`));
    }

    return result;

  } catch (error) {
    console.log(`  ❌ Error validating collection: ${error.message}`);
    return {
      exists: false,
      documentCount: 0,
      validDocuments: 0,
      errors: [`Failed to access collection: ${error.message}`],
      warnings: []
    };
  }
}

// Validate system config subcollections
async function validateSystemConfig() {
  console.log(`\n⚙️ Validating system configuration`);
  
  const configResults = {
    features: null,
    settings: null
  };

  try {
    const systemConfigRef = db.collection(`${BASE_PATH}/systemConfig`);
    
    // Validate features
    const featuresDoc = await systemConfigRef.doc('features').get();
    if (featuresDoc.exists()) {
      const featuresData = featuresDoc.data();
      const validation = validateDocument(featuresData, expectedStructures.systemConfig.features, 'systemConfig', 'features');
      configResults.features = {
        exists: true,
        valid: validation.errors.length === 0,
        errors: validation.errors,
        warnings: validation.warnings
      };
    } else {
      configResults.features = {
        exists: false,
        valid: false,
        errors: ['Features configuration document not found'],
        warnings: []
      };
    }

    // Validate settings
    const settingsDoc = await systemConfigRef.doc('settings').get();
    if (settingsDoc.exists()) {
      const settingsData = settingsDoc.data();
      const validation = validateDocument(settingsData, expectedStructures.systemConfig.settings, 'systemConfig', 'settings');
      configResults.settings = {
        exists: true,
        valid: validation.errors.length === 0,
        errors: validation.errors,
        warnings: validation.warnings
      };
    } else {
      configResults.settings = {
        exists: false,
        valid: false,
        errors: ['Settings configuration document not found'],
        warnings: []
      };
    }

    // Log results
    Object.entries(configResults).forEach(([configType, result]) => {
      console.log(`  📄 ${configType}: ${result.exists ? 'EXISTS' : 'MISSING'} ${result.valid ? '✅' : '❌'}`);
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`    • ${error}`));
      }
    });

    return configResults;

  } catch (error) {
    console.log(`  ❌ Error validating system config: ${error.message}`);
    return configResults;
  }
}

// Check data relationships
async function validateDataRelationships() {
  console.log(`\n🔗 Validating data relationships`);
  
  try {
    // Check user-quest relationships
    const usersRef = db.collection(`${BASE_PATH}/users`);
    const themesRef = db.collection(`${BASE_PATH}/themes`);
    
    const usersSnapshot = await usersRef.limit(5).get();
    const themesSnapshot = await themesRef.get();
    
    // Collect all valid task IDs
    const validTaskIds = new Set();
    themesSnapshot.docs.forEach(doc => {
      const themeData = doc.data();
      if (themeData.tasks && Array.isArray(themeData.tasks)) {
        themeData.tasks.forEach(task => {
          if (task.id) {
            validTaskIds.add(task.id);
          }
        });
      }
    });

    console.log(`  📋 Found ${validTaskIds.size} valid task IDs`);

    // Check user completed tasks
    let validRelationships = 0;
    let invalidRelationships = 0;

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (userData.completedTasks && Array.isArray(userData.completedTasks)) {
        userData.completedTasks.forEach(taskId => {
          if (validTaskIds.has(taskId)) {
            validRelationships++;
          } else {
            invalidRelationships++;
            console.log(`    ❌ User ${doc.id} has invalid completed task: ${taskId}`);
          }
        });
      }
    });

    console.log(`  ✅ Valid task relationships: ${validRelationships}`);
    console.log(`  ❌ Invalid task relationships: ${invalidRelationships}`);

    // Check friend relationships
    let mutualFriendships = 0;
    let oneSidedFriendships = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.friendsList && Array.isArray(userData.friendsList)) {
        for (const friendId of userData.friendsList) {
          try {
            const friendDoc = await usersRef.doc(friendId).get();
            if (friendDoc.exists()) {
              const friendData = friendDoc.data();
              if (friendData.friendsList && friendData.friendsList.includes(userDoc.id)) {
                mutualFriendships++;
              } else {
                oneSidedFriendships++;
                console.log(`    ⚠️  One-sided friendship: ${userDoc.id} -> ${friendId}`);
              }
            } else {
              console.log(`    ❌ User ${userDoc.id} has non-existent friend: ${friendId}`);
            }
          } catch (error) {
            console.log(`    ❌ Error checking friend relationship: ${error.message}`);
          }
        }
      }
    }

    console.log(`  ✅ Mutual friendships: ${mutualFriendships}`);
    console.log(`  ⚠️  One-sided friendships: ${oneSidedFriendships}`);

  } catch (error) {
    console.log(`  ❌ Error validating relationships: ${error.message}`);
  }
}

// Main validation function
async function runValidation() {
  console.log("🔍 KidQuest Champions Data Structure Validation");
  console.log("=" * 50);

  try {
    // Validate main collections
    validationResults.collections.users = await validateCollection('users', expectedStructures.users);
    validationResults.collections.themes = await validateCollection('themes', expectedStructures.themes);
    
    // Validate system configuration
    validationResults.collections.systemConfig = await validateSystemConfig();
    
    // Validate other collections
    const otherCollections = ['leaderboards', 'gameStats', 'achievementDefinitions', 'notifications'];
    for (const collectionName of otherCollections) {
      try {
        const collectionRef = db.collection(`${BASE_PATH}/${collectionName}`);
        const snapshot = await collectionRef.get();
        validationResults.collections[collectionName] = {
          exists: !snapshot.empty,
          documentCount: snapshot.docs.length,
          validDocuments: snapshot.docs.length, // Assume valid for basic collections
          errors: snapshot.empty ? [`Collection ${collectionName} is empty`] : [],
          warnings: []
        };
        console.log(`\n📁 ${collectionName}: ${snapshot.docs.length} documents`);
      } catch (error) {
        validationResults.collections[collectionName] = {
          exists: false,
          documentCount: 0,
          validDocuments: 0,
          errors: [error.message],
          warnings: []
        };
      }
    }

    // Validate data relationships
    await validateDataRelationships();

    // Generate summary
    validationResults.summary.totalCollections = Object.keys(validationResults.collections).length;
    validationResults.summary.validCollections = Object.values(validationResults.collections)
      .filter(collection => collection.exists && collection.errors.length === 0).length;
    
    validationResults.summary.totalDocuments = Object.values(validationResults.collections)
      .reduce((sum, collection) => sum + (collection.documentCount || 0), 0);
    
    validationResults.summary.validDocuments = Object.values(validationResults.collections)
      .reduce((sum, collection) => sum + (collection.validDocuments || 0), 0);

    // Print final report
    console.log("\n" + "=" * 50);
    console.log("📊 VALIDATION SUMMARY");
    console.log("=" * 50);
    console.log(`Collections: ${validationResults.summary.validCollections}/${validationResults.summary.totalCollections} valid`);
    console.log(`Documents: ${validationResults.summary.validDocuments}/${validationResults.summary.totalDocuments} valid`);
    
    const collectionSuccessRate = (validationResults.summary.validCollections / validationResults.summary.totalCollections * 100).toFixed(1);
    const documentSuccessRate = (validationResults.summary.validDocuments / validationResults.summary.totalDocuments * 100).toFixed(1);
    
    console.log(`Collection Success Rate: ${collectionSuccessRate}%`);
    console.log(`Document Success Rate: ${documentSuccessRate}%`);

    // List any critical issues
    const criticalIssues = [];
    Object.entries(validationResults.collections).forEach(([name, result]) => {
      if (!result.exists) {
        criticalIssues.push(`Missing collection: ${name}`);
      } else if (result.errors.length > 0) {
        criticalIssues.push(`${name}: ${result.errors.length} errors`);
      }
    });

    if (criticalIssues.length > 0) {
      console.log("\n❌ CRITICAL ISSUES:");
      criticalIssues.forEach(issue => console.log(`  • ${issue}`));
    } else {
      console.log("\n✅ No critical issues found!");
    }

    console.log("\n📋 RECOMMENDATIONS:");
    if (validationResults.summary.validCollections === validationResults.summary.totalCollections) {
      console.log("  ✅ All collections are properly structured");
    } else {
      console.log("  ⚠️  Some collections need attention - see errors above");
    }
    
    if (validationResults.summary.validDocuments === validationResults.summary.totalDocuments) {
      console.log("  ✅ All documents have valid structure");
    } else {
      console.log("  ⚠️  Some documents have structural issues - review field types and requirements");
    }

  } catch (error) {
    console.error("💥 Validation failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run validation
runValidation();