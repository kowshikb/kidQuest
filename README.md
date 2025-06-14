# 🏆 KidQuest Champions

**A magical learning adventure platform for kids with real-time multiplayer challenges!**

KidQuest Champions is an engaging gamified educational platform designed for children that combines learning with fun through interactive quests, real-time challenges, and social features. Built with React, TypeScript, and Firebase, it provides a safe and exciting environment for kids to learn while competing with friends.

## ✨ Key Features

### 🎮 Core Gameplay

- **Magical Quests**: Educational quests across different themes (Math, Science, Reading, etc.)
- **Real-time Challenges**: Live multiplayer challenge rooms where kids can compete
- **Coin System**: Earn coins by completing tasks and winning challenges
- **Interactive Mascot**: Friendly AI companion that guides and encourages users

### 👥 Social Features

- **Friend System**: Add friends and see their progress
- **Challenge Rooms**: Create or join challenge rooms to compete with friends
- **Live Chat**: Safe, real-time messaging in challenge rooms
- **Leaderboards**: Track top performers and achievements

### 🎨 User Experience

- **Kid-Friendly UI**: Colorful, animated interface designed for children
- **Sound Effects**: Engaging audio feedback for interactions
- **Themes & Customization**: Multiple visual themes and personalization options
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🔐 Authentication & Safety

- **Multiple Login Options**: Email/password, Google sign-in, or anonymous login
- **Password Recovery**: Forgot password with email reset functionality
- **Simple Authentication**: Clean authentication system with user-friendly error messages
- **Google Integration**: One-click sign-in with Google accounts
- **Safe Environment**: Secure user data handling and privacy protection
- **Profile Management**: Customizable user profiles with avatars

## 🚀 Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion for animations
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: React Context API
- **Icons**: Lucide React
- **Sound**: use-sound for audio effects
- **Routing**: React Router DOM

## 📦 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Navigation header
│   ├── Mascot.tsx      # Interactive mascot
│   ├── CoinCounter.tsx # Coin display
│   └── ...
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   ├── ThemeContext.tsx# Theme management
│   ├── SoundContext.tsx# Audio controls
│   └── ModalContext.tsx# Modal dialogs
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # User dashboard
│   ├── Login.tsx       # Authentication page
│   ├── RoomsPage.tsx   # Challenge rooms
│   ├── RoomDetail.tsx  # Individual room
│   ├── ThemePage.tsx   # Quest themes
│   ├── FriendsPage.tsx # Friend management
│   ├── LeaderboardPage.tsx # Rankings
│   └── ProfilePage.tsx # User profile
├── firebase/           # Firebase configuration
│   └── config.ts       # Firebase setup
└── styles/             # Global styles
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd kidQuest
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Firebase Setup**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore Database, and Storage
   - Update `src/firebase/config.ts` with your Firebase configuration

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173`

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔥 Firebase Configuration

### Required Firebase Services:

1. **Authentication**: Enable email/password, Google, and anonymous authentication
2. **Firestore Database**: For storing user data, challenges, and real-time features
3. **Storage**: For user avatars and media files
4. **Analytics**: For usage tracking (optional)

### Authentication Setup:

**Email/Password Authentication:**

1. In Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password"

**Google Authentication:**

1. In Firebase Console → Authentication → Sign-in method
2. Enable "Google"
3. Add your project support email
4. Save the configuration

**Anonymous Authentication:**

1. In Firebase Console → Authentication → Sign-in method
2. Enable "Anonymous"

### Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /artifacts/{appId}/public/data/users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow authenticated users to read/write rooms they're part of
    match /artifacts/{appId}/public/data/rooms/{roomId} {
      allow read, write: if request.auth != null &&
        (resource.data.player1Id == request.auth.uid ||
         resource.data.player2Id == request.auth.uid);
    }
  }
}
```

## 🌐 Deployment

### Deploy to Firebase Hosting:

1. **Install Firebase CLI**

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**

   ```bash
   firebase login
   ```

3. **Initialize Firebase in project**

   ```bash
   firebase init hosting
   ```

4. **Build and deploy**
   ```bash
   npm run build
   firebase deploy
   ```

### Environment Variables:

Create a `.env` file for production:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🎯 Features Roadmap

- [ ] AI-powered adaptive difficulty
- [ ] Parent dashboard for progress tracking
- [ ] Video call integration for challenges
- [ ] Offline mode with sync
- [ ] Achievement system with badges
- [ ] Mini-games within challenges
- [ ] Teacher/educator portal

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎮 How to Play

1. **Sign up** using email, Google account, or play anonymously
2. **Complete quests** in different themes to earn coins
3. **Challenge friends** in real-time multiplayer rooms
4. **Chat safely** with friends during challenges
5. **Climb the leaderboard** by winning challenges
6. **Customize your profile** and unlock new themes

---

# Add to crontab (run daily at 2 AM)

0 2 \* \* \* cd /path/to/your/project && npm run cleanup-rooms

**Made with ❤️ for young learners everywhere!**
