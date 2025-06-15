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

## Step 3: Configure Your Environment

1. Copy `env.example` to `.env`:

   ```bash
   cp env.example .env
   ```

2. Update `.env` with your Firebase configuration:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

   **CRITICAL**: Make sure `VITE_FIREBASE_PROJECT_ID` matches your actual Firebase Project ID exactly.

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

The seeding script will automatically use your `VITE_FIREBASE_PROJECT_ID` from the `.env` file:

```bash
npm run seed-db
```

This will create the following collections and documents:

### Collections Created:

1. **`/artifacts/{projectId}/public/data/users/`**

   - User profiles with friendly IDs
   - Coins, completed tasks, friends lists
   - Location data for leaderboard filtering

2. **`/artifacts/{projectId}/public/data/themes/`**

   - 4 educational themes (Math, Science, Language, Art)
   - Each with multiple tasks and rewards
   - Quiz questions and interactive content

3. **`/artifacts/{projectId}/public/data/rooms/`**

   - 3 challenge rooms for multiplayer games
   - Different categories and difficulties
   - Real-time participant tracking

4. **`/artifacts/{projectId}/public/data/systemConfig/`**

   - Feature flags (friends, rooms, leaderboard, coins)
   - System settings (max friends, room sizes, etc.)

5. **`/artifacts/{projectId}/public/data/gameStats/`**

   - Global statistics tracking
   - User counts, coins earned, tasks completed

6. **`/artifacts/{projectId}/public/data/leaderboards/`**

   - Global, daily, weekly, monthly leaderboards
   - Initially empty, populated as users play

7. **`/artifacts/{projectId}/public/data/friendRequests/`**
   - Friend connection requests
   - Status tracking (pending/accepted/rejected)

## Step 6: Verify Database Setup

1. Go to Firebase Console → Firestore Database
2. You should see the collections created with sample data under `/artifacts/{your-project-id}/public/data/`
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
/artifacts/{projectId}/public/data/
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

1. **Permission Denied / Missing Data**

   - **Most Common Cause**: Project ID mismatch between frontend and seeding script
   - **Solution**: Ensure `VITE_FIREBASE_PROJECT_ID` in `.env` matches your actual Firebase Project ID
   - Re-run the seeding script after fixing the project ID
   - Check that Firestore rules are deployed

2. **Missing Indexes**

   - Deploy indexes: `npm run deploy-indexes`
   - Wait for indexes to build (check Firebase Console)

3. **Seeding Fails**

   - Verify service account key path
   - Check Firebase project URL and permissions
   - Ensure `VITE_FIREBASE_PROJECT_ID` is set correctly in `.env`

4. **Data Not Appearing**
   - Check browser console for errors
   - Verify Firebase configuration in `src/firebase/config.ts`
   - Confirm project ID consistency across all configuration files

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