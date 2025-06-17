import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from "firebase/firestore";
import { db, getBasePath } from "../firebase/config";
import { ApiResponse } from "./gameStateApi";
import { dynamicCache, sessionCache } from "../utils/CacheManager";

export interface Friend {
  id: string;
  friendlyUserId: string;
  username: string;
  avatarUrl: string;
  isOnline: boolean;
  lastActive?: number;
  level?: number;
  coins?: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromFriendlyId: string;
  fromAvatarUrl?: string;
  toUserId: string;
  toFriendlyId: string;
  status: "pending" | "accepted" | "rejected";
  type?: "friend" | "room_invitation";
  roomId?: string;
  message?: string;
  createdAt: number;
  respondedAt?: number;
}

export interface UserSearchResult {
  userId: string;
  friendlyUserId: string;
  username: string;
  avatarUrl: string;
  level: number;
  coins: number;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

export interface SendFriendRequestParams {
  fromUserId: string;
  fromUsername: string;
  fromFriendlyId: string;
  fromAvatarUrl?: string;
  toFriendlyId: string;
  message?: string;
}

export interface RespondToRequestParams {
  requestId: string;
  action: "accept" | "reject";
  respondingUserId: string;
}

export interface RemoveFriendParams {
  userId: string;
  friendId: string;
}

export interface SearchUsersParams {
  query: string;
  currentUserId: string;
  limit?: number;
  excludeFriends?: boolean;
}

class FriendsApiService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  /**
   * GET /api/friends - Get user's friends list
   */
  async getFriends(userId: string): Promise<ApiResponse<Friend[]>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: { code: "INVALID_USER_ID", message: "User ID is required" },
          timestamp: new Date().toISOString(),
        };
      }

      const cacheKey = `friends_${userId}`;
      const cachedData = sessionCache.get<Friend[]>(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          metadata: { cached: true, timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        };
      }

      // Get user's profile to access friends list
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return {
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User profile not found" },
          timestamp: new Date().toISOString(),
        };
      }

      const userData = userSnap.data();
      const friendIds = userData.friendsList || [];

      if (friendIds.length === 0) {
        return {
          success: true,
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      // Fetch friend profiles
      const friends: Friend[] = [];

      // Process friends in batches to avoid Firestore 'in' query limit (10 items)
      const batchSize = 10;
      for (let i = 0; i < friendIds.length; i += batchSize) {
        const batch = friendIds.slice(i, i + batchSize);

        const usersRef = collection(db, `${getBasePath()}/users`);
        const friendsQuery = query(usersRef, where("userId", "in", batch));
        const friendsSnapshot = await getDocs(friendsQuery);

        friendsSnapshot.docs.forEach((docSnap) => {
          const friendData = docSnap.data();
          const friend: Friend = {
            id: docSnap.id,
            friendlyUserId: friendData.friendlyUserId || friendData.userId,
            username: friendData.username || "Unknown Champion",
            avatarUrl: friendData.avatarUrl || "",
            isOnline: this.isUserOnline(friendData.lastActive),
            lastActive:
              friendData.lastActive?.toMillis?.() || friendData.lastActive,
            level: friendData.level || 1,
            coins: friendData.coins || 0,
          };
          friends.push(friend);
        });
      }

      // Sort friends by online status, then by last active
      friends.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return (b.lastActive || 0) - (a.lastActive || 0);
      });

      // Cache the results
      sessionCache.set(cacheKey, friends, 10 * 60 * 1000); // 10 minutes

      return {
        success: true,
        data: friends,
        metadata: { cached: false, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching friends:", error);
      return {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: "Failed to fetch friends list",
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * GET /api/friends/requests - Get pending friend requests
   */
  async getFriendRequests(
    userId: string
  ): Promise<ApiResponse<FriendRequest[]>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: { code: "INVALID_USER_ID", message: "User ID is required" },
          timestamp: new Date().toISOString(),
        };
      }

      const cacheKey = `friend_requests_${userId}`;
      const cachedData = dynamicCache.get<FriendRequest[]>(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          metadata: { cached: true, timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        };
      }

      const requestsRef = collection(db, `${getBasePath()}/friendRequests`);
      const requestsQuery = query(
        requestsRef,
        where("toUserId", "==", userId),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const requestsSnapshot = await getDocs(requestsQuery);
      const requests: FriendRequest[] = [];

      requestsSnapshot.docs.forEach((docSnap) => {
        const requestData = docSnap.data();
        const request: FriendRequest = {
          id: docSnap.id,
          fromUserId: requestData.fromUserId,
          fromUsername: requestData.fromUsername || "Unknown Champion",
          fromFriendlyId: requestData.fromFriendlyId || requestData.fromUserId,
          fromAvatarUrl: requestData.fromAvatarUrl || "",
          toUserId: requestData.toUserId,
          toFriendlyId: requestData.toFriendlyId || requestData.toUserId,
          status: requestData.status,
          type: requestData.type || "friend",
          roomId: requestData.roomId,
          message: requestData.message,
          createdAt: requestData.createdAt || Date.now(),
          respondedAt: requestData.respondedAt,
        };
        requests.push(request);
      });

      // Cache for 5 minutes
      dynamicCache.set(cacheKey, requests, 5 * 60 * 1000);

      return {
        success: true,
        data: requests,
        metadata: { cached: false, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      return {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: "Failed to fetch friend requests",
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /api/friends/request - Send friend request
   */
  async sendFriendRequest(
    params: SendFriendRequestParams
  ): Promise<ApiResponse> {
    try {
      const {
        fromUserId,
        fromUsername,
        fromFriendlyId,
        fromAvatarUrl = "",
        toFriendlyId,
        message = "",
      } = params;

      if (!fromUserId || !fromUsername || !fromFriendlyId || !toFriendlyId) {
        return {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Required fields are missing",
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Find target user by friendly ID
      const usersRef = collection(db, `${getBasePath()}/users`);
      const targetUserQuery = query(
        usersRef,
        where("friendlyUserId", "==", toFriendlyId)
      );
      const targetUserSnapshot = await getDocs(targetUserQuery);

      if (targetUserSnapshot.empty) {
        return {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User with this ID not found",
          },
          timestamp: new Date().toISOString(),
        };
      }

      const targetUser = targetUserSnapshot.docs[0];
      const toUserId = targetUser.id;

      // Check if users are already friends
      const fromUserRef = doc(db, `${getBasePath()}/users/${fromUserId}`);
      const fromUserSnap = await getDoc(fromUserRef);

      if (fromUserSnap.exists()) {
        const fromUserData = fromUserSnap.data();
        if (fromUserData.friendsList?.includes(toUserId)) {
          return {
            success: false,
            error: {
              code: "ALREADY_FRIENDS",
              message: "You are already friends with this user",
            },
            timestamp: new Date().toISOString(),
          };
        }
      }

      // Check if there's already a pending request
      const existingRequestsRef = collection(
        db,
        `${getBasePath()}/friendRequests`
      );
      const existingRequestQuery = query(
        existingRequestsRef,
        where("fromUserId", "==", fromUserId),
        where("toUserId", "==", toUserId),
        where("status", "==", "pending")
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      if (!existingRequestSnapshot.empty) {
        return {
          success: false,
          error: {
            code: "REQUEST_ALREADY_SENT",
            message: "Friend request already sent",
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Create friend request
      const requestsRef = collection(db, `${getBasePath()}/friendRequests`);
      await addDoc(requestsRef, {
        fromUserId,
        fromUsername,
        fromFriendlyId,
        fromAvatarUrl,
        toUserId,
        toFriendlyId,
        status: "pending",
        type: "friend",
        message,
        createdAt: Date.now(),
      });

      // Invalidate cache
      dynamicCache.invalidate(`friend_requests_${toUserId}`);

      return {
        success: true,
        message: "Friend request sent successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error sending friend request:", error);
      return {
        success: false,
        error: {
          code: "SEND_FAILED",
          message: "Failed to send friend request",
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /api/friends/respond - Respond to friend request
   */
  async respondToFriendRequest(
    params: RespondToRequestParams
  ): Promise<ApiResponse> {
    try {
      const { requestId, action, respondingUserId } = params;

      if (!requestId || !action || !respondingUserId) {
        return {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Request ID, action, and user ID are required",
          },
          timestamp: new Date().toISOString(),
        };
      }

      const requestRef = doc(
        db,
        `${getBasePath()}/friendRequests/${requestId}`
      );
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        return {
          success: false,
          error: {
            code: "REQUEST_NOT_FOUND",
            message: "Friend request not found",
          },
          timestamp: new Date().toISOString(),
        };
      }

      const requestData = requestSnap.data();

      // Verify user is the recipient
      if (requestData.toUserId !== respondingUserId) {
        return {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You cannot respond to this request",
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Update request status
      await updateDoc(requestRef, {
        status: action === "accept" ? "accepted" : "rejected",
        respondedAt: Date.now(),
      });

      // If accepted, add to friends lists
      if (action === "accept") {
        const batch = writeBatch(db);

        // Add to sender's friends list
        const fromUserRef = doc(
          db,
          `${getBasePath()}/users/${requestData.fromUserId}`
        );
        batch.update(fromUserRef, {
          friendsList: arrayUnion(respondingUserId),
        });

        // Add to recipient's friends list
        const toUserRef = doc(db, `${getBasePath()}/users/${respondingUserId}`);
        batch.update(toUserRef, {
          friendsList: arrayUnion(requestData.fromUserId),
        });

        await batch.commit();

        // Invalidate friends cache for both users
        sessionCache.invalidate(`friends_${requestData.fromUserId}`);
        sessionCache.invalidate(`friends_${respondingUserId}`);
      }

      // Invalidate requests cache
      dynamicCache.invalidate(`friend_requests_${respondingUserId}`);

      return {
        success: true,
        message:
          action === "accept"
            ? "Friend request accepted"
            : "Friend request rejected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error responding to friend request:", error);
      return {
        success: false,
        error: {
          code: "RESPOND_FAILED",
          message: "Failed to respond to friend request",
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * DELETE /api/friends/:friendId - Remove friend
   */
  async removeFriend(params: RemoveFriendParams): Promise<ApiResponse> {
    try {
      const { userId, friendId } = params;

      if (!userId || !friendId) {
        return {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "User ID and friend ID are required",
          },
          timestamp: new Date().toISOString(),
        };
      }

      const batch = writeBatch(db);

      // Remove from user's friends list
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      batch.update(userRef, {
        friendsList: arrayRemove(friendId),
      });

      // Remove from friend's friends list
      const friendRef = doc(db, `${getBasePath()}/users/${friendId}`);
      batch.update(friendRef, {
        friendsList: arrayRemove(userId),
      });

      await batch.commit();

      // Invalidate friends cache for both users
      sessionCache.invalidate(`friends_${userId}`);
      sessionCache.invalidate(`friends_${friendId}`);

      return {
        success: true,
        message: "Friend removed successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error removing friend:", error);
      return {
        success: false,
        error: { code: "REMOVE_FAILED", message: "Failed to remove friend" },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * GET /api/friends/search - Search for users to add as friends
   */
  async searchUsers(
    params: SearchUsersParams
  ): Promise<ApiResponse<UserSearchResult[]>> {
    try {
      const {
        query: searchQuery,
        currentUserId,
        limit: searchLimit = 20,
        excludeFriends = true,
      } = params;

      if (!searchQuery || searchQuery.length < 2) {
        return {
          success: false,
          error: {
            code: "INVALID_QUERY",
            message: "Search query must be at least 2 characters",
          },
          timestamp: new Date().toISOString(),
        };
      }

      const cacheKey = `user_search_${searchQuery}_${currentUserId}_${searchLimit}_${excludeFriends}`;
      const cachedData = dynamicCache.get<UserSearchResult[]>(cacheKey);
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          metadata: { cached: true, timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        };
      }

      // Get current user's friends list and pending requests
      const [currentUserSnap, pendingRequestsSnap] = await Promise.all([
        getDoc(doc(db, `${getBasePath()}/users/${currentUserId}`)),
        getDocs(
          query(
            collection(db, `${getBasePath()}/friendRequests`),
            where("fromUserId", "==", currentUserId),
            where("status", "==", "pending")
          )
        ),
      ]);

      const currentUserData = currentUserSnap.data();
      const friendsList = currentUserData?.friendsList || [];
      const pendingRequests = new Set(
        pendingRequestsSnap.docs.map((doc) => doc.data().toUserId)
      );

      // Search users by username or friendly ID
      const usersRef = collection(db, `${getBasePath()}/users`);

      // Firestore doesn't support case-insensitive searches, so we'll get all users
      // and filter client-side (not ideal for large datasets)
      const usersSnapshot = await getDocs(query(usersRef, limit(100))); // Limit to prevent large queries

      const results: UserSearchResult[] = [];
      const searchTerm = searchQuery.toLowerCase();

      usersSnapshot.docs.forEach((docSnap) => {
        const userData = docSnap.data();
        const userId = docSnap.id;

        // Skip current user
        if (userId === currentUserId) return;

        // Check if matches search query
        const username = (userData.username || "").toLowerCase();
        const friendlyId = (userData.friendlyUserId || "").toLowerCase();

        if (
          !username.includes(searchTerm) &&
          !friendlyId.includes(searchTerm)
        ) {
          return;
        }

        // Skip friends if excludeFriends is true
        if (excludeFriends && friendsList.includes(userId)) {
          return;
        }

        const result: UserSearchResult = {
          userId,
          friendlyUserId: userData.friendlyUserId || userId,
          username: userData.username || "Unknown Champion",
          avatarUrl: userData.avatarUrl || "",
          level: userData.level || 1,
          coins: userData.coins || 0,
          isFriend: friendsList.includes(userId),
          hasPendingRequest: pendingRequests.has(userId),
        };

        results.push(result);
      });

      // Sort by username and limit results
      results.sort((a, b) => a.username.localeCompare(b.username));
      const limitedResults = results.slice(0, searchLimit);

      // Cache for 5 minutes
      dynamicCache.set(cacheKey, limitedResults, 5 * 60 * 1000);

      return {
        success: true,
        data: limitedResults,
        metadata: { cached: false, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error searching users:", error);
      return {
        success: false,
        error: { code: "SEARCH_FAILED", message: "Failed to search users" },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Real-time subscription to friend requests
   */
  subscribeToFriendRequests(
    userId: string,
    callback: (requests: FriendRequest[]) => void
  ): () => void {
    if (!userId) {
      console.warn("Cannot subscribe to friend requests: User ID is required");
      return () => {};
    }

    const unsubscribeKey = `friend_requests_${userId}`;

    // Clean up existing subscription
    if (this.unsubscribeCallbacks.has(unsubscribeKey)) {
      this.unsubscribeCallbacks.get(unsubscribeKey)!();
      this.unsubscribeCallbacks.delete(unsubscribeKey);
    }

    const requestsRef = collection(db, `${getBasePath()}/friendRequests`);
    const requestsQuery = query(
      requestsRef,
      where("toUserId", "==", userId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requests: FriendRequest[] = [];

        snapshot.docs.forEach((docSnap) => {
          const requestData = docSnap.data();
          const request: FriendRequest = {
            id: docSnap.id,
            fromUserId: requestData.fromUserId,
            fromUsername: requestData.fromUsername || "Unknown Champion",
            fromFriendlyId:
              requestData.fromFriendlyId || requestData.fromUserId,
            fromAvatarUrl: requestData.fromAvatarUrl || "",
            toUserId: requestData.toUserId,
            toFriendlyId: requestData.toFriendlyId || requestData.toUserId,
            status: requestData.status,
            type: requestData.type || "friend",
            roomId: requestData.roomId,
            message: requestData.message,
            createdAt: requestData.createdAt || Date.now(),
            respondedAt: requestData.respondedAt,
          };
          requests.push(request);
        });

        // Update cache
        dynamicCache.set(`friend_requests_${userId}`, requests, 5 * 60 * 1000);
        callback(requests);
      },
      (error) => {
        console.error("Friend requests subscription error:", error);
        callback([]);
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
   * Helper method to check if user is online
   */
  private isUserOnline(lastActive: any): boolean {
    if (!lastActive) return false;

    const lastActiveTime = lastActive.toMillis
      ? lastActive.toMillis()
      : lastActive;
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;

    return now - lastActiveTime < fifteenMinutes;
  }
}

export const friendsApi = new FriendsApiService();
