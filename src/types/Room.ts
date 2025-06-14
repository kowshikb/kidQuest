// Shared Room interface that matches the database schema
export interface Room {
  id: string;
  name: string; // Room name
  description: string; // Room description
  maxPlayers: number; // Maximum participants
  currentPlayers: number; // Current participant count
  isActive: boolean; // Room availability
  difficulty: string; // Challenge difficulty
  category: string; // Challenge category
  createdBy: string; // Creator user ID
  createdAt: number; // Creation time (timestamp)
  participants: Array<{
    // Array of participant objects
    userId: string; // Participant user ID
    username: string; // Participant username
    avatarUrl: string; // Participant avatar
    score: number; // Current score
    joinedAt: number; // Join time (timestamp)
  }>;
  status: "waiting" | "active" | "completed"; // Room status
  messages: Array<{
    senderId: string;
    text: string;
    timestamp: number;
  }>;
  currentChallenge: {
    themeId: string;
    taskId: string;
    challengerId: string;
    challengedId: string;
    status: "pending" | "accepted" | "rejected" | "completed";
    winnerId: string | null;
    suggestedAt: number;
  } | null;
}

export interface UserInfo {
  userId: string; // Changed from 'id' to 'userId' to match participants
  username: string;
  avatarUrl: string;
}
