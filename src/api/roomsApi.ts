import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db, getBasePath } from "../firebase/config";
import { ApiResponse } from "./gameStateApi";
import { dynamicCache, realtimeCache } from "../utils/CacheManager";
import { Room } from "../types/Room";

export interface CreateRoomParams {
  name: string;
  description: string;
  maxPlayers: number;
  difficulty: string;
  category: string;
  createdBy: string;
  isPrivate?: boolean;
}

export interface JoinRoomParams {
  roomId: string;
  userId: string;
  username: string;
  avatarUrl: string;
}

export interface LeaveRoomParams {
  roomId: string;
  userId: string;
  username: string;
}

export interface SendMessageParams {
  roomId: string;
  senderId: string;
  text: string;
  type?: "chat" | "system" | "action";
}

export interface RoomFilters {
  category?: string;
  difficulty?: string;
  status?: "waiting" | "active" | "completed";
  hasSpace?: boolean;
  createdBy?: string;
}

export interface RoomSearchParams {
  userId: string;
  filters?: RoomFilters;
  limit?: number;
  sortBy?: "recent" | "players" | "name";
}

export interface Challenge {
  id: string;
  themeId: string;
  taskId: string;
  challengerId: string;
  challengedId: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  winnerId: string | null;
  suggestedAt: number;
  completedAt?: number;
}

class RoomsApiService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  /**
   * GET /api/rooms - Get rooms list with filters
   */
  async getRooms(params: RoomSearchParams): Promise<ApiResponse<Room[]>> {
    try {
      const {
        userId,
        filters = {},
        limit: queryLimit = 50,
        sortBy = "recent",
      } = params;

      if (!userId) {
        return {
          success: false,
          error: { code: "INVALID_USER_ID", message: "User ID is required" },
          timestamp: new Date().toISOString(),
        };
      }

      // Create cache key
      const cacheKey = `rooms_${userId}_${JSON.stringify(
        filters
      )}_${queryLimit}_${sortBy}`;

      // Check cache first
      const cachedData = dynamicCache.get<Room[]>(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          metadata: { cached: true, timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        };
      }

      const roomsRef = collection(db, `${getBasePath()}/rooms`);
      let roomsQuery = query(roomsRef);

      // Apply filters
      const queryConstraints = [];

      if (filters.category) {
        queryConstraints.push(where("category", "==", filters.category));
      }

      if (filters.difficulty) {
        queryConstraints.push(where("difficulty", "==", filters.difficulty));
      }

      if (filters.status) {
        queryConstraints.push(where("status", "==", filters.status));
      }

      if (filters.createdBy) {
        queryConstraints.push(where("createdBy", "==", filters.createdBy));
      }

      // Apply sorting
      if (sortBy === "recent") {
        queryConstraints.push(orderBy("createdAt", "desc"));
      } else if (sortBy === "players") {
        queryConstraints.push(orderBy("currentPlayers", "desc"));
      } else if (sortBy === "name") {
        queryConstraints.push(orderBy("name", "asc"));
      }

      queryConstraints.push(limit(queryLimit));

      if (queryConstraints.length > 0) {
        roomsQuery = query(roomsRef, ...queryConstraints);
      }

      const snapshot = await getDocs(roomsQuery);
      const rooms: Room[] = [];

      snapshot.docs.forEach((docSnap) => {
        const roomData = docSnap.data();

        const room: Room = {
          id: docSnap.id,
          name: roomData.name || "Unnamed Room",
          description: roomData.description || "",
          maxPlayers: roomData.maxPlayers || 2,
          currentPlayers: roomData.currentPlayers || 0,
          isActive: roomData.isActive !== false,
          difficulty: roomData.difficulty || "Easy",
          category: roomData.category || "General",
          createdBy: roomData.createdBy || "",
          createdAt: roomData.createdAt || Date.now(),
          participants: roomData.participants || [],
          status: roomData.status || "waiting",
          messages: roomData.messages || [],
          currentChallenge: roomData.currentChallenge || null,
        };

        // Apply client-side filters that can't be done in Firestore
        if (filters.hasSpace && room.currentPlayers >= room.maxPlayers) {
          return; // Skip full rooms
        }

        rooms.push(room);
      });

      // Cache the results
      dynamicCache.set(cacheKey, rooms, 5 * 60 * 1000); // 5 minutes

      return {
        success: true,
        data: rooms,
        metadata: { cached: false, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return {
        success: false,
        error: { code: "FETCH_FAILED", message: "Failed to fetch rooms" },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * GET /api/rooms/:roomId - Get specific room details
   */
  async getRoom(roomId: string): Promise<ApiResponse<Room>> {
    try {
      if (!roomId) {
        return {
          success: false,
          error: { code: "INVALID_ROOM_ID", message: "Room ID is required" },
          timestamp: new Date().toISOString(),
        };
      }

      const cacheKey = `room_${roomId}`;
      const cachedData = realtimeCache.get<Room>(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          metadata: { cached: true, timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        };
      }

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        return {
          success: false,
          error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
          timestamp: new Date().toISOString(),
        };
      }

      const roomData = roomSnap.data();
      const room: Room = {
        id: roomSnap.id,
        name: roomData.name || "Unnamed Room",
        description: roomData.description || "",
        maxPlayers: roomData.maxPlayers || 2,
        currentPlayers: roomData.currentPlayers || 0,
        isActive: roomData.isActive !== false,
        difficulty: roomData.difficulty || "Easy",
        category: roomData.category || "General",
        createdBy: roomData.createdBy || "",
        createdAt: roomData.createdAt || Date.now(),
        participants: roomData.participants || [],
        status: roomData.status || "waiting",
        messages: roomData.messages || [],
        currentChallenge: roomData.currentChallenge || null,
      };

      // Cache for 1 minute (real-time data)
      realtimeCache.set(cacheKey, room, 60 * 1000);

      return {
        success: true,
        data: room,
        metadata: { cached: false, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching room:", error);
      return {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: "Failed to fetch room details",
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /api/rooms - Create a new room
   */
  async createRoom(params: CreateRoomParams): Promise<ApiResponse<Room>> {
    try {
      const {
        name,
        description,
        maxPlayers,
        difficulty,
        category,
        createdBy,
        isPrivate = false,
      } = params;

      if (!name || !createdBy) {
        return {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Name and creator are required",
          },
          timestamp: new Date().toISOString(),
        };
      }

      const roomsRef = collection(db, `${getBasePath()}/rooms`);
      const newRoom = {
        name,
        description,
        maxPlayers: Math.max(2, Math.min(maxPlayers, 8)), // Limit between 2-8 players
        currentPlayers: 1,
        isActive: true,
        difficulty,
        category,
        createdBy,
        isPrivate,
        createdAt: Date.now(),
        participants: [],
        status: "waiting" as const,
        messages: [
          {
            senderId: "system",
            text: `Room "${name}" has been created!`,
            timestamp: Date.now(),
          },
        ],
        currentChallenge: null,
      };

      const docRef = await addDoc(roomsRef, newRoom);

      const createdRoom: Room = {
        id: docRef.id,
        ...newRoom,
      };

      // Invalidate rooms cache
      this.invalidateRoomsCache();

      return {
        success: true,
        data: createdRoom,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error creating room:", error);
      return {
        success: false,
        error: { code: "CREATE_FAILED", message: "Failed to create room" },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /api/rooms/:roomId/join - Join a room
   */
  async joinRoom(params: JoinRoomParams): Promise<ApiResponse> {
    try {
      const { roomId, userId, username, avatarUrl } = params;

      if (!roomId || !userId || !username) {
        return {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Room ID, user ID, and username are required",
          },
          timestamp: new Date().toISOString(),
        };
      }

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        return {
          success: false,
          error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
          timestamp: new Date().toISOString(),
        };
      }

      const roomData = roomSnap.data();

      // Check if user is already in room
      const isAlreadyInRoom = roomData.participants?.some(
        (p: any) => p.userId === userId
      );
      if (isAlreadyInRoom) {
        return {
          success: true,
          message: "Already in room",
          timestamp: new Date().toISOString(),
        };
      }

      // Check if room is full
      if (roomData.currentPlayers >= roomData.maxPlayers) {
        return {
          success: false,
          error: { code: "ROOM_FULL", message: "Room is full" },
          timestamp: new Date().toISOString(),
        };
      }

      // Add participant
      await updateDoc(roomRef, {
        participants: arrayUnion({
          userId,
          username,
          avatarUrl: avatarUrl || "",
          score: 0,
          joinedAt: Date.now(),
        }),
        currentPlayers: roomData.currentPlayers + 1,
      });

      // Add welcome message
      await updateDoc(roomRef, {
        messages: arrayUnion({
          senderId: "system",
          text: `${username} has joined the room!`,
          timestamp: Date.now(),
        }),
      });

      // Invalidate cache
      realtimeCache.invalidate(`room_${roomId}`);

      return {
        success: true,
        message: "Successfully joined room",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error joining room:", error);
      return {
        success: false,
        error: { code: "JOIN_FAILED", message: "Failed to join room" },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /api/rooms/:roomId/leave - Leave a room
   */
  async leaveRoom(params: LeaveRoomParams): Promise<ApiResponse> {
    try {
      const { roomId, userId, username } = params;

      if (!roomId || !userId) {
        return {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Room ID and user ID are required",
          },
          timestamp: new Date().toISOString(),
        };
      }

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        return {
          success: false,
          error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
          timestamp: new Date().toISOString(),
        };
      }

      const roomData = roomSnap.data();
      const participant = roomData.participants?.find(
        (p: any) => p.userId === userId
      );

      if (!participant) {
        return {
          success: true,
          message: "Not in room",
          timestamp: new Date().toISOString(),
        };
      }

      // Remove participant
      await updateDoc(roomRef, {
        participants: arrayRemove(participant),
        currentPlayers: Math.max(0, roomData.currentPlayers - 1),
      });

      // If no participants left, deactivate room
      if (roomData.currentPlayers <= 1) {
        await updateDoc(roomRef, {
          isActive: false,
          status: "completed",
        });
      } else {
        // Add goodbye message
        await updateDoc(roomRef, {
          messages: arrayUnion({
            senderId: "system",
            text: `${username || "A player"} has left the room.`,
            timestamp: Date.now(),
          }),
        });
      }

      // Invalidate cache
      realtimeCache.invalidate(`room_${roomId}`);

      return {
        success: true,
        message: "Successfully left room",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error leaving room:", error);
      return {
        success: false,
        error: { code: "LEAVE_FAILED", message: "Failed to leave room" },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /api/rooms/:roomId/messages - Send a message to room
   */
  async sendMessage(params: SendMessageParams): Promise<ApiResponse> {
    try {
      const { roomId, senderId, text, type = "chat" } = params;

      if (!roomId || !senderId || !text.trim()) {
        return {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Room ID, sender ID, and message text are required",
          },
          timestamp: new Date().toISOString(),
        };
      }

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        return {
          success: false,
          error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
          timestamp: new Date().toISOString(),
        };
      }

      const message = {
        senderId,
        text: text.trim(),
        type,
        timestamp: Date.now(),
      };

      await updateDoc(roomRef, {
        messages: arrayUnion(message),
      });

      // Invalidate cache
      realtimeCache.invalidate(`room_${roomId}`);

      return {
        success: true,
        message: "Message sent successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        success: false,
        error: { code: "SEND_FAILED", message: "Failed to send message" },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /api/rooms/:roomId/challenge - Suggest a challenge
   */
  async suggestChallenge(
    roomId: string,
    challengeData: Omit<Challenge, "id" | "suggestedAt">
  ): Promise<ApiResponse> {
    try {
      if (!roomId) {
        return {
          success: false,
          error: { code: "INVALID_ROOM_ID", message: "Room ID is required" },
          timestamp: new Date().toISOString(),
        };
      }

      const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);
      const challenge: Challenge = {
        id: `challenge_${Date.now()}`,
        ...challengeData,
        suggestedAt: Date.now(),
      };

      await updateDoc(roomRef, {
        currentChallenge: challenge,
        messages: arrayUnion({
          senderId: "system",
          text: `A new challenge has been suggested!`,
          timestamp: Date.now(),
        }),
      });

      realtimeCache.invalidate(`room_${roomId}`);

      return {
        success: true,
        message: "Challenge suggested successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error suggesting challenge:", error);
      return {
        success: false,
        error: {
          code: "CHALLENGE_FAILED",
          message: "Failed to suggest challenge",
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Real-time subscription to room updates
   */
  subscribeToRoom(
    roomId: string,
    callback: (room: Room | null) => void
  ): () => void {
    if (!roomId) {
      console.warn("Cannot subscribe to room: Room ID is required");
      return () => {};
    }

    const unsubscribeKey = `room_${roomId}`;

    // Clean up existing subscription
    if (this.unsubscribeCallbacks.has(unsubscribeKey)) {
      this.unsubscribeCallbacks.get(unsubscribeKey)!();
      this.unsubscribeCallbacks.delete(unsubscribeKey);
    }

    const roomRef = doc(db, `${getBasePath()}/rooms/${roomId}`);

    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.data();
          const room: Room = {
            id: snapshot.id,
            name: roomData.name || "Unnamed Room",
            description: roomData.description || "",
            maxPlayers: roomData.maxPlayers || 2,
            currentPlayers: roomData.currentPlayers || 0,
            isActive: roomData.isActive !== false,
            difficulty: roomData.difficulty || "Easy",
            category: roomData.category || "General",
            createdBy: roomData.createdBy || "",
            createdAt: roomData.createdAt || Date.now(),
            participants: roomData.participants || [],
            status: roomData.status || "waiting",
            messages: roomData.messages || [],
            currentChallenge: roomData.currentChallenge || null,
          };

          // Update cache
          realtimeCache.set(`room_${roomId}`, room, 60 * 1000);
          callback(room);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Room subscription error:", error);
        callback(null);
      }
    );

    this.unsubscribeCallbacks.set(unsubscribeKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.unsubscribeCallbacks.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeCallbacks.clear();
  }

  /**
   * Invalidate rooms cache
   */
  private invalidateRoomsCache(): void {
    // Clear all rooms-related cache entries
    const stats = dynamicCache.getStats();
    console.log(`🗑️ Invalidating rooms cache (${stats.memoryEntries} entries)`);

    // Since we don't have a way to list all cache keys, we'll clear the entire cache
    // In a production app, you'd want a more sophisticated cache invalidation strategy
    dynamicCache.clear();
  }
}

export const roomsApi = new RoomsApiService();
