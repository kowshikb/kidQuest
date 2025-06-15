# 🚀 Deployment Guide for KidQuest Champions

This guide will help you deploy KidQuest Champions to Firebase Cloud Platform.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Firebase CLI** installed globally
3. **Firebase Project** created in Firebase Console
4. **Git** for version control

## Step-by-Step Deployment

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. **Important**: Note your exact Project ID (e.g., `kidquest-champions-12345`)
4. Enable the following services:
   - **Authentication** (Email/Password, Phone, Anonymous)
   - **Firestore Database** (in production mode)
   - **Storage** (in production mode)
   - **Hosting** (optional but recommended)
   - **Analytics** (optional)

### 2. Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" → Select Web (</>)
4. Register your app with name "KidQuest Champions"
5. Copy the Firebase configuration object

### 3. Update Local Configuration

1. Copy `env.example` to `.env`:

   ```bash
   cp env.example .env
   ```

2. Update `.env` with your Firebase config:

   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   VITE_FIREBASE_MEASUREMENT_ID=G-ABC123DEF
   ```

   **CRITICAL**: Ensure `VITE_FIREBASE_PROJECT_ID` matches your exact Firebase Project ID.

3. Update `src/firebase/config.ts` with your configuration (if not using environment variables)

### 4. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 5. Login to Firebase

```bash
firebase login
```

### 6. Initialize Firebase in Your Project

```bash
firebase init
```

Select the following options:

- ☑️ Firestore: Configure security rules and indexes files
- ☑️ Storage: Configure security rules
- ☑️ Hosting: Configure files for Firebase Hosting

Configuration choices:

- **Firestore Rules**: `firestore.rules` (already created)
- **Firestore Indexes**: `firestore.indexes.json` (already created)
- **Storage Rules**: `storage.rules` (already created)
- **Hosting Public Directory**: `dist`
- **Single Page App**: Yes
- **GitHub Actions**: No (or Yes if you want CI/CD)

### 7. Deploy Database Setup

Before deploying the app, set up your database:

```bash
# Deploy Firestore rules and indexes
npm run deploy:rules
npm run deploy:indexes

# Seed the database with initial data
npm run seed-db
```

### 8. Deploy to Firebase

#### Option A: Full Deployment

```bash
npm run deploy
```

#### Option B: Deploy Only Hosting

```bash
npm run deploy:hosting
```

#### Option C: Deploy Only Database Rules

```bash
npm run deploy:rules
```

### 9. Configure Authentication

In Firebase Console → Authentication:

1. **Sign-in Methods**:

   - Enable Email/Password
   - Enable Phone (add your phone numbers to test list)
   - Enable Anonymous

2. **Settings → Authorized Domains**:
   - Add your custom domain if applicable
   - Firebase subdomain is already authorized

### 10. Configure Firestore Security Rules

The rules are already created in `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules
```

### 11. Configure Storage Rules

The storage rules are in `storage.rules`. Deploy them:

```bash
firebase deploy --only storage:rules
```

## Environment-Specific Deployments

### Development

```bash
# Build and preview locally
npm run build
npm run preview
```

### Staging

```bash
# Deploy to staging (if you have staging project)
firebase use staging
npm run deploy
```

### Production

```bash
# Deploy to production
firebase use production
npm run deploy
```

## Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Test challenge room creation and joining
- [ ] Test real-time messaging
- [ ] Test friend system
- [ ] Test leaderboard functionality
- [ ] Test file uploads (avatars)
- [ ] Verify Firebase Analytics (if enabled)
- [ ] Check console for any errors
- [ ] Verify data appears correctly (themes, rooms, etc.)

## Custom Domain (Optional)

1. In Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the verification steps
4. Update DNS records as instructed
5. SSL certificate will be automatically provisioned

## Monitoring and Analytics

### Firebase Console

- Check usage statistics
- Monitor authentication metrics
- Review database performance
- Check hosting traffic

### Error Monitoring

Consider adding error tracking:

```bash
npm install @sentry/react @sentry/tracing
```

## Troubleshooting

### Common Issues:

1. **Build Errors**:

   ```bash
   rm -rf node_modules
   npm install
   npm run build
   ```

2. **Firebase Permissions**:

   ```bash
   firebase login --reauth
   ```

3. **Environment Variables Not Working**:

   - Ensure variables start with `VITE_`
   - Restart development server after adding variables
   - Verify project ID matches exactly

4. **Permission Denied Errors**:

   - Check that `VITE_FIREBASE_PROJECT_ID` matches your Firebase Project ID exactly
   - Re-run database seeding: `npm run seed-db`
   - Deploy Firestore rules: `npm run deploy:rules`

5. **Data Not Loading**:

   - Verify project ID consistency in `.env` and Firebase Console
   - Check Firestore Database in Firebase Console for data under `/artifacts/{your-project-id}/public/data/`
   - Ensure indexes are built (may take a few minutes)

6. **Deployment Fails**:
   ```bash
   firebase deploy --debug
   ```

### Support Commands:

```bash
# Check Firebase project info
firebase projects:list

# Check current project
firebase use

# View deployment history
firebase hosting:logs

# Test security rules locally
firebase emulators:start --only firestore
```

## Security Best Practices

1. Never commit `.env` files to version control
2. Use Firebase App Check for production
3. Regularly review and update security rules
4. Monitor authentication logs
5. Set up alerts for unusual activity
6. Keep Firebase SDK updated

## Performance Optimization

1. Enable Firestore offline persistence (already implemented)
2. Use Firebase Performance Monitoring
3. Optimize images and assets
4. Enable compression in hosting
5. Use Firebase Dynamic Links for sharing

---

🎉 **Congratulations!** Your KidQuest Champions app should now be live on Firebase!

Access your app at: `https://your-project-id.web.app`

**Important**: Make sure your project ID is consistent across all configuration files to avoid permission errors.