# KidQuest Champions - Firestore Database Schema

## Database Structure

```
/artifacts/kidquest-champions-dev/public/data/
├── users/                          # User profiles and data
│   ├── {userId}/                   # Document ID is Firebase Auth UID
│   │   ├── userId: string          # Firebase Auth UID
│   │   ├── friendlyUserId: string  # User-friendly ID (KQ123456)
│   │   ├── username: string        # Display name
│   │   ├── avatarUrl: string       # Profile picture URL
│   │   ├── coins: number           # Total coins earned
│   │   ├── location: object        # User location
│   │   │   ├── city: string
│   │   │   ├── state: string
│   │   │   └── country: string
│   │   ├── completedTasks: array   # Array of completed task IDs
│   │   ├── friendsList: array      # Array of friend user IDs
│   │   ├── createdAt: timestamp    # Account creation date
│   │   └── lastActive: timestamp   # Last login time
│   │
├── themes/                         # Quest themes and categories
│   ├── {themeId}/                  # Auto-generated document ID
│   │   ├── name: string            # Theme name
│   │   ├── description: string     # Theme description
│   │   ├── category: string        # Theme category
│   │   ├── difficulty: string      # Easy/Medium/Hard
│   │   ├── imageUrl: string        # Theme banner image
│   │   ├── isActive: boolean       # Whether theme is available
│   │   ├── order: number           # Display order
│   │   └── tasks: array            # Array of task objects
│   │       ├── id: string          # Unique task ID
│   │       ├── title: string       # Task title
│   │       ├── description: string # Task description
│   │       ├── coins: number       # Coins reward
│   │       ├── type: string        # Task type (quiz, activity, etc.)
│   │       └── data: object        # Task-specific data
│   │
├── rooms/                          # Real-time challenge rooms
│   ├── {roomId}/                   # Auto-generated document ID
│   │   ├── name: string            # Room name
│   │   ├── description: string     # Room description
│   │   ├── maxPlayers: number      # Maximum participants
│   │   ├── currentPlayers: number  # Current participant count
│   │   ├── isActive: boolean       # Room availability
│   │   ├── difficulty: string      # Challenge difficulty
│   │   ├── category: string        # Challenge category
│   │   ├── createdBy: string       # Creator user ID
│   │   ├── createdAt: timestamp    # Creation time
│   │   ├── participants: array     # Array of participant objects
│   │   │   ├── userId: string      # Participant user ID
│   │   │   ├── username: string    # Participant username
│   │   │   ├── avatarUrl: string   # Participant avatar
│   │   │   ├── score: number       # Current score
│   │   │   └── joinedAt: timestamp # Join time
│   │   └── status: string          # waiting/active/completed
│   │
├── friendRequests/                 # Friend connection requests
│   ├── {requestId}/                # Auto-generated document ID
│   │   ├── fromUserId: string      # Sender user ID
│   │   ├── fromUsername: string    # Sender username
│   │   ├── fromFriendlyId: string  # Sender friendly ID
│   │   ├── toUserId: string        # Recipient user ID
│   │   ├── toFriendlyId: string    # Recipient friendly ID
│   │   ├── status: string          # pending/accepted/rejected
│   │   ├── type: string            # Optional: 'friend' or 'room_invitation'
│   │   ├── roomId: string          # Optional: Room ID for room invitations
│   │   ├── createdAt: timestamp    # Request creation time
│   │   └── respondedAt: timestamp  # Response time (if any)
│   │
├── gameStats/                      # Global game statistics
│   ├── global/                     # Global stats document
│   │   ├── totalUsers: number      # Total registered users
│   │   ├── totalCoinsEarned: number # Total coins in circulation
│   │   ├── totalTasksCompleted: number # Total tasks completed
│   │   ├── activeRooms: number     # Currently active rooms
│   │   └── lastUpdated: timestamp  # Last stats update
│   │
├── leaderboards/                   # Leaderboard data (computed/cached)
│   ├── global/                     # Global leaderboard
│   ├── daily/                      # Daily leaderboard
│   ├── weekly/                     # Weekly leaderboard
│   └── monthly/                    # Monthly leaderboard
│       ├── rankings: array         # Array of user ranking objects
│       │   ├── userId: string      # User ID
│       │   ├── friendlyUserId: string # Friendly user ID
│       │   ├── username: string    # Username
│       │   ├── avatarUrl: string   # Avatar URL
│       │   ├── coins: number       # Total coins
│       │   ├── rank: number        # Current rank
│       │   └── change: number      # Rank change (+/-)
│       └── lastUpdated: timestamp  # Last update time
│   │
└── systemConfig/                   # System configuration
    ├── features/                   # Feature flags
    │   ├── friendsEnabled: boolean # Friends system enabled
    │   ├── roomsEnabled: boolean   # Challenge rooms enabled
    │   ├── leaderboardEnabled: boolean # Leaderboard enabled
    │   └── coinsEnabled: boolean   # Coins system enabled
    │
    └── settings/                   # Global settings
        ├── maxFriends: number      # Maximum friends per user
        ├── maxRoomPlayers: number  # Maximum players per room
        ├── coinRewardMultiplier: number # Coin reward multiplier
        └── maintenanceMode: boolean # Maintenance mode flag
```

## Security Rules Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /artifacts/{appId}/public/data/users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Others can read for leaderboards
    }

    // Themes are readable by all authenticated users
    match /artifacts/{appId}/public/data/themes/{themeId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can modify themes
    }

    // Rooms are readable/writable by authenticated users
    match /artifacts/{appId}/public/data/rooms/{roomId} {
      allow read, write: if request.auth != null;
    }

    // Friend requests - supports both friend requests and room invitations
    match /artifacts/{appId}/public/data/friendRequests/{requestId} {
      allow read, write: if request.auth != null &&
        (resource.data.fromUserId == request.auth.uid ||
         resource.data.toUserId == request.auth.uid);
      // Allow creation with optional type and roomId fields for room invitations
      allow create: if request.auth != null && 
        request.resource.data.fromUserId == request.auth.uid &&
        request.resource.data.status == 'pending' &&
        (!request.resource.data.keys().hasAny(['type']) || request.resource.data.type is string) &&
        (!request.resource.data.keys().hasAny(['roomId']) || request.resource.data.roomId is string);
    }

    // Leaderboards are read-only for users
    match /artifacts/{appId}/public/data/leaderboards/{leaderboardId} {
      allow read: if request.auth != null;
      allow write: if false; // Only cloud functions can update
    }
  }
}
```

## Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "coins", "order": "DESCENDING" },
        { "fieldPath": "lastActive", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "location.country", "order": "ASCENDING" },
        { "fieldPath": "coins", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "rooms",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "friendRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "toUserId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "friendRequests",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "toUserId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## Initial Data Structure

This schema supports:

1. **User Management** - Complete user profiles with friendly IDs
2. **Quest System** - Themes and tasks with rewards
3. **Real-time Challenges** - Room-based multiplayer games
4. **Social Features** - Friends system with requests and room invitations
5. **Leaderboards** - Multiple leaderboard types with caching
6. **Analytics** - Game statistics and user activity tracking
7. **Administration** - Feature flags and system configuration

## Data Flow

1. **User Registration**: Creates user document with auto-generated friendly ID
2. **Quest Completion**: Updates user's completedTasks and coins
3. **Friend System**: Creates friend requests and updates friend lists
4. **Room Invitations**: Creates friend requests with type='room_invitation' and roomId
5. **Leaderboards**: Aggregated from user data (can be real-time or scheduled)
6. **Rooms**: Real-time updates for multiplayer challenges

## Friend Request Types

The `friendRequests` collection now supports two types of requests:

1. **Friend Requests** (default): Basic friend connection requests
   - Required fields: `fromUserId`, `fromUsername`, `fromFriendlyId`, `toUserId`, `toFriendlyId`, `status`
   - Optional fields: `type` (defaults to 'friend')

2. **Room Invitations**: Invitations to join specific challenge rooms
   - Required fields: Same as friend requests plus `type: 'room_invitation'` and `roomId`
   - Used when inviting friends to join challenge rooms

✅ Added theme: Math Magic Academy
✅ Added theme: Science Quest Laboratory  
✅ Added theme: Language Arts Castle
✅ Added theme: Art & Creativity Studio
✅ Added room: Math Challenge Arena
✅ Added room: Science Trivia Tower
✅ Added room: Word Wizard Duel
✅ Added system features configuration
✅ Added system settings configuration
✅ Added global game statistics
✅ Created global leaderboard
✅ Created daily leaderboard
✅ Created weekly leaderboard
✅ Created monthly leaderboard