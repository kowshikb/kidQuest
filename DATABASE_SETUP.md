# KidQuest Champions - Database Setup Guide

## Prerequisites

1. **Firebase Project**: Make sure you have a Firebase project set up
2. **Firebase CLI**: Install Firebase CLI globally: `npm install -g firebase-tools`
3. **Node.js**: Ensure you have Node.js installed for running the seeding script

## Step 1: Download Service Account Key

1. Go to your Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file and save it as `scripts/serviceAccountKey.json`
4. **Important**: Add this file to your `.gitignore` (it's already included)

## Step 2: Install Dependencies for Seeding

```bash
npm install firebase-admin
```

## Step 3: Configure the Seeding Script

1. Open `scripts/seedDatabase.js`
2. Update these variables:

   ```javascript
   const serviceAccount = require("./serviceAccountKey.json");

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount),
     databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com", // Replace with your project URL
   });

   const APP_ID = "your-app-id"; // Replace with your app ID from vite.config.ts
   ```

## Step 4: Deploy Firestore Rules and Indexes

```bash
# Deploy security rules
npm run deploy-rules

# Deploy indexes
npm run deploy-indexes

# Or deploy both at once
npm run deploy-db
```

## Step 5: Seed the Database

```bash
npm run seed-db
```

This will create the following collections and documents:

### Collections Created:

1. **`/artifacts/{appId}/public/data/users/`**

   - User profiles with friendly IDs
   - Coins, completed tasks, friends lists
   - Location data for leaderboard filtering

2. **`/artifacts/{appId}/public/data/themes/`**

   - 4 educational themes (Math, Science, Language, Art)
   - Each with multiple tasks and rewards
   - Quiz questions and interactive content

3. **`/artifacts/{appId}/public/data/rooms/`**

   - 3 challenge rooms for multiplayer games
   - Different categories and difficulties
   - Real-time participant tracking

4. **`/artifacts/{appId}/public/data/systemConfig/`**

   - Feature flags (friends, rooms, leaderboard, coins)
   - System settings (max friends, room sizes, etc.)

5. **`/artifacts/{appId}/public/data/gameStats/`**

   - Global statistics tracking
   - User counts, coins earned, tasks completed

6. **`/artifacts/{appId}/public/data/leaderboards/`**

   - Global, daily, weekly, monthly leaderboards
   - Initially empty, populated as users play

7. **`/artifacts/{appId}/public/data/friendRequests/`**
   - Friend connection requests
   - Status tracking (pending/accepted/rejected)

## Step 6: Verify Database Setup

1. Go to Firebase Console → Firestore Database
2. You should see the collections created with sample data
3. Check that indexes are being built (may take a few minutes)

## Step 7: Test the Application

1. Start your development server: `npm run dev`
2. Create a new user account
3. Verify that:
   - User profile is created with friendly ID
   - Themes are loaded and displayable
   - Dashboard shows proper statistics
   - Leaderboard is accessible

## Database Structure Overview

```
/artifacts/{appId}/public/data/
├── users/               # User profiles and progress
├── themes/              # Educational content and quests
├── rooms/               # Multiplayer challenge rooms
├── friendRequests/      # Friend system management
├── leaderboards/        # Ranking and competition data
├── gameStats/           # Global application statistics
└── systemConfig/        # Feature flags and settings
```

## Security Features

- **User Isolation**: Users can only modify their own data
- **Read Permissions**: Authenticated users can read public data
- **Admin Controls**: Only admin/cloud functions can modify themes and system config
- **Friend Privacy**: Friend requests only visible to involved parties
- **Data Validation**: Firestore rules validate data structure and types

## Monitoring and Maintenance

### View Database Activity

```bash
firebase firestore:indexes
```

### Update Rules

```bash
npm run deploy-rules
```

### Update Indexes

```bash
npm run deploy-indexes
```

### Backup Data

```bash
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

## Troubleshooting

### Common Issues:

1. **Permission Denied**

   - Check that Firestore rules are deployed
   - Verify user authentication is working

2. **Missing Indexes**

   - Deploy indexes: `npm run deploy-indexes`
   - Wait for indexes to build (check Firebase Console)

3. **Seeding Fails**

   - Verify service account key path
   - Check Firebase project URL and permissions
   - Ensure APP_ID matches your configuration

4. **Data Not Appearing**
   - Check browser console for errors
   - Verify Firebase configuration in `src/firebase/config.ts`
   - Confirm APP_ID matches in both frontend and seeding script

### Debug Mode

To enable detailed logging during development:

```javascript
// In src/firebase/config.ts
import { connectFirestoreEmulator } from "firebase/firestore";

// Use emulator for local development
if (location.hostname === "localhost") {
  connectFirestoreEmulator(db, "localhost", 8080);
}
```

## Production Considerations

1. **Security Rules**: Review and test all security rules thoroughly
2. **Indexes**: Monitor index usage and costs in Firebase Console
3. **Backup Strategy**: Set up automated backups for user data
4. **Rate Limiting**: Implement client-side rate limiting for expensive operations
5. **Monitoring**: Set up Firebase Performance Monitoring and Analytics

## Cost Optimization

1. **Index Management**: Only create indexes you need
2. **Query Efficiency**: Use compound queries instead of multiple simple queries
3. **Pagination**: Implement pagination for large result sets
4. **Caching**: Cache frequently accessed data locally
5. **Cleanup**: Regular cleanup of old friend requests and inactive rooms
