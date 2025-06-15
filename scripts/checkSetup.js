// Script to check if everything is set up correctly
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Checking KidQuest Champions setup...");
console.log("");

// Check 1: Environment file
console.log("1. Checking environment configuration...");
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log("  ✅ .env file exists");
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasProjectId = envContent.includes('VITE_FIREBASE_PROJECT_ID');
  const hasApiKey = envContent.includes('VITE_FIREBASE_API_KEY');
  
  if (hasProjectId) {
    console.log("  ✅ VITE_FIREBASE_PROJECT_ID found");
  } else {
    console.log("  ❌ VITE_FIREBASE_PROJECT_ID missing");
  }
  
  if (hasApiKey) {
    console.log("  ✅ VITE_FIREBASE_API_KEY found");
  } else {
    console.log("  ❌ VITE_FIREBASE_API_KEY missing");
  }
} else {
  console.log("  ❌ .env file not found");
  console.log("     Copy env.example to .env and fill in your Firebase config");
}

// Check 2: Service account key
console.log("");
console.log("2. Checking service account key...");
const serviceKeyPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(serviceKeyPath)) {
  console.log("  ✅ Service account key exists");
  
  try {
    const keyContent = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
    if (keyContent.project_id) {
      console.log(`  ✅ Project ID in key: ${keyContent.project_id}`);
    }
  } catch (error) {
    console.log("  ❌ Service account key is invalid JSON");
  }
} else {
  console.log("  ❌ Service account key not found");
  console.log("     Download from Firebase Console → Project Settings → Service Accounts");
}

// Check 3: Required dependencies
console.log("");
console.log("3. Checking dependencies...");
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
  
  const requiredDeps = ['firebase', 'firebase-admin'];
  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`  ✅ ${dep} installed`);
    } else {
      console.log(`  ❌ ${dep} missing`);
    }
  });
}

console.log("");
console.log("🔧 Setup Instructions:");
console.log("");
console.log("If you see any ❌ above, follow these steps:");
console.log("");
console.log("1. Create .env file:");
console.log("   cp env.example .env");
console.log("");
console.log("2. Get Firebase config from Firebase Console:");
console.log("   - Go to Project Settings → General → Your apps");
console.log("   - Copy the config values to your .env file");
console.log("");
console.log("3. Download service account key:");
console.log("   - Go to Project Settings → Service Accounts");
console.log("   - Click 'Generate new private key'");
console.log("   - Save as scripts/serviceAccountKey.json");
console.log("");
console.log("4. Run the population script:");
console.log("   npm run populate-data");