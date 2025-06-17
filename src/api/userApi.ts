import {
  doc,
  updateDoc,
  getDoc,
  increment,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { getBasePath } from "../firebase/config";

export interface UserProfile {
  userId: string;
  friendlyUserId: string;
  username: string;
  avatarUrl: string;
  coins: number;
  age?: number;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalExperience: number;
  rankTitle: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  completedTasks: string[];
  friendsList: string[];
  createdAt: any;
  lastActive: any;
}

export interface UpdateProfileRequest {
  username?: string;
  age?: number;
  avatarUrl?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface EarnCoinsRequest {
  userId: string;
  coinsEarned: number;
  taskId: string;
  source: "quest" | "hobby" | "achievement";
  metadata?: {
    themeId?: string;
    hobbyId?: string;
    taskName?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// Level calculation functions
const calculateLevel = (totalExperience: number): number => {
  return Math.floor(totalExperience / 100) + 1;
};

const calculateExperienceInCurrentLevel = (totalExperience: number): number => {
  return totalExperience % 100;
};

const calculateExperienceToNextLevel = (totalExperience: number): number => {
  return 100 - (totalExperience % 100);
};

const getRankTitle = (level: number): string => {
  if (level >= 100) return "Legendary Champion";
  if (level >= 75) return "Grand Champion";
  if (level >= 50) return "Elite Champion";
  if (level >= 25) return "Senior Champion";
  if (level >= 15) return "Advanced Champion";
  if (level >= 10) return "Skilled Champion";
  if (level >= 5) return "Junior Champion";
  return "Novice Champion";
};

class UserApiService {
  private basePath = () => `${getBasePath()}/users`;

  /**
   * GET /api/users/{userId} - Get user profile with fresh data
   */
  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      console.log(`📥 Fetching fresh user profile for: ${userId}`);

      const userRef = doc(db, `${this.basePath()}/${userId}`);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return {
          success: false,
          error: "USER_NOT_FOUND",
          message: "User profile not found",
          timestamp: new Date().toISOString(),
        };
      }

      const userData = userSnap.data() as UserProfile;

      console.log(
        `✅ User profile loaded: ${userData.username}, Coins: ${userData.coins}`
      );

      return {
        success: true,
        data: userData,
        message: "User profile retrieved successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return {
        success: false,
        error: "FETCH_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch user profile",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * PATCH /api/users/{userId}/profile - Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: UpdateProfileRequest
  ): Promise<ApiResponse<UserProfile>> {
    try {
      console.log(`🔄 PATCH: Updating profile for user ${userId}:`, updates);

      const userRef = doc(db, `${this.basePath()}/${userId}`);

      // Prepare update data
      const updateData: any = {
        ...updates,
        lastActive: serverTimestamp(),
      };

      // If location is being updated, merge with existing location
      if (updates.location) {
        const currentProfile = await this.getUserProfile(userId);
        if (currentProfile.success && currentProfile.data) {
          updateData.location = {
            ...currentProfile.data.location,
            ...updates.location,
          };
        }
      }

      await updateDoc(userRef, updateData);

      // Fetch and return updated profile
      const updatedProfile = await this.getUserProfile(userId);

      console.log(`✅ Profile updated successfully for user ${userId}`);

      return {
        success: true,
        data: updatedProfile.data,
        message: "Profile updated successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error updating user profile:", error);
      return {
        success: false,
        error: "UPDATE_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to update profile",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * PATCH /api/users/{userId}/coins - Award coins and update experience
   */
  async earnCoins(request: EarnCoinsRequest): Promise<
    ApiResponse<{
      newCoinTotal: number;
      coinsEarned: number;
      newLevel: number;
      leveledUp: boolean;
      newRankTitle: string;
      newExperience: number;
      newExperienceToNext: number;
    }>
  > {
    try {
      const { userId, coinsEarned, taskId, source, metadata } = request;

      console.log(
        `💰 PATCH: Awarding ${coinsEarned} coins to user ${userId} for ${source}`
      );

      const userRef = doc(db, `${this.basePath()}/${userId}`);

      // Get current user data
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        throw new Error("User profile not found");
      }

      const user = currentProfile.data;

      // Check if task is already completed
      if (user.completedTasks.includes(taskId)) {
        return {
          success: false,
          error: "TASK_ALREADY_COMPLETED",
          message: "This task has already been completed",
          timestamp: new Date().toISOString(),
        };
      }

      // Calculate new values
      const newCoinTotal = user.coins + coinsEarned;
      const newTotalExperience = newCoinTotal; // Using coins as experience
      const previousLevel = user.level;
      const newLevel = calculateLevel(newTotalExperience);
      const newExperience =
        calculateExperienceInCurrentLevel(newTotalExperience);
      const newExperienceToNext =
        calculateExperienceToNextLevel(newTotalExperience);
      const newRankTitle = getRankTitle(newLevel);
      const leveledUp = newLevel > previousLevel;

      // Update user document
      const updateData = {
        coins: newCoinTotal,
        completedTasks: [...user.completedTasks, taskId],
        totalExperience: newTotalExperience,
        level: newLevel,
        experience: newExperience,
        experienceToNextLevel: newExperienceToNext,
        rankTitle: newRankTitle,
        lastActive: serverTimestamp(),
      };

      await updateDoc(userRef, updateData);

      console.log(
        `✅ Coins awarded successfully. New total: ${newCoinTotal}, Level: ${newLevel}${
          leveledUp ? " (LEVEL UP!)" : ""
        }`
      );

      return {
        success: true,
        data: {
          newCoinTotal,
          coinsEarned,
          newLevel,
          leveledUp,
          newRankTitle,
          newExperience,
          newExperienceToNext,
        },
        message: `Successfully earned ${coinsEarned} coins!`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error awarding coins:", error);
      return {
        success: false,
        error: "COINS_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to award coins",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * PATCH /api/users/{userId}/friends - Add or remove friends
   */
  async updateFriends(
    userId: string,
    friendId: string,
    action: "add" | "remove"
  ): Promise<ApiResponse<string[]>> {
    try {
      console.log(
        `👥 PATCH: ${action}ing friend ${friendId} for user ${userId}`
      );

      const userRef = doc(db, `${this.basePath()}/${userId}`);

      // Get current friends list
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        throw new Error("User profile not found");
      }

      const currentFriends = currentProfile.data.friendsList || [];
      let newFriends: string[];

      if (action === "add") {
        if (currentFriends.includes(friendId)) {
          return {
            success: false,
            error: "FRIEND_ALREADY_EXISTS",
            message: "User is already in friends list",
            timestamp: new Date().toISOString(),
          };
        }
        newFriends = [...currentFriends, friendId];
      } else {
        newFriends = currentFriends.filter((id) => id !== friendId);
      }

      await updateDoc(userRef, {
        friendsList: newFriends,
        lastActive: serverTimestamp(),
      });

      console.log(`✅ Friends list updated. New count: ${newFriends.length}`);

      return {
        success: true,
        data: newFriends,
        message: `Friend ${
          action === "add" ? "added" : "removed"
        } successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error updating friends:", error);
      return {
        success: false,
        error: "FRIENDS_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to update friends",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const userApi = new UserApiService();
export default userApi;
