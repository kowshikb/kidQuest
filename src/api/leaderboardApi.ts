import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, getBasePath } from "../firebase/config";
import { ApiResponse } from "./gameStateApi";

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  rank: number;
  change: number; // Position change from previous period
  level: number;
  badges: string[];
  location?: {
    city: string;
    state: string;
    country: string;
  };
  lastActive: Timestamp;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userEntry?: LeaderboardEntry;
  totalPlayers: number;
  lastUpdated: string;
  period: "all-time" | "weekly" | "monthly" | "daily";
}

export interface UserRankData {
  currentRank: number;
  totalPlayers: number;
  nearbyCompetitors: LeaderboardEntry[];
  categoryRanks: Record<string, number>;
  weeklyRank: number;
  monthlyRank: number;
  dailyRank: number;
  rankHistory: RankHistoryEntry[];
}

export interface RankHistoryEntry {
  date: string;
  rank: number;
  score: number;
  change: number;
}

export interface LeaderboardFilters {
  category?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
  timeframe?: "daily" | "weekly" | "monthly" | "all-time";
  minLevel?: number;
  maxLevel?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: "score" | "level" | "recent";
  sortOrder?: "asc" | "desc";
}

class LeaderboardApiService {
  /**
   * GET /api/leaderboard
   * Fetch leaderboard with filters and pagination
   */
  async getLeaderboard(
    filters: LeaderboardFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<ApiResponse<LeaderboardData>> {
    try {
      const usersRef = collection(db, `${getBasePath()}/users`);

      // Build query based on filters
      let leaderboardQuery = query(usersRef);

      // Apply location filters
      if (filters.location?.country) {
        leaderboardQuery = query(
          leaderboardQuery,
          where("location.country", "==", filters.location.country)
        );
      }

      if (filters.location?.state) {
        leaderboardQuery = query(
          leaderboardQuery,
          where("location.state", "==", filters.location.state)
        );
      }

      if (filters.location?.city) {
        leaderboardQuery = query(
          leaderboardQuery,
          where("location.city", "==", filters.location.city)
        );
      }

      // Apply level filters
      if (filters.minLevel) {
        leaderboardQuery = query(
          leaderboardQuery,
          where("level", ">=", filters.minLevel)
        );
      }

      if (filters.maxLevel) {
        leaderboardQuery = query(
          leaderboardQuery,
          where("level", "<=", filters.maxLevel)
        );
      }

      // Apply sorting
      const sortField =
        pagination.sortBy === "level"
          ? "level"
          : pagination.sortBy === "recent"
          ? "lastActive"
          : "coins";
      const sortDirection = pagination.sortOrder === "asc" ? "asc" : "desc";

      leaderboardQuery = query(
        leaderboardQuery,
        orderBy(sortField, sortDirection)
      );

      // Apply pagination
      if (pagination.page > 1) {
        const offset = (pagination.page - 1) * pagination.limit;
        // Note: Firestore doesn't support offset, so we'll use startAfter with a cursor
        // For simplicity, we'll fetch all and slice (not optimal for large datasets)
      }

      leaderboardQuery = query(leaderboardQuery, limit(pagination.limit));

      const snapshot = await getDocs(leaderboardQuery);

      const entries: LeaderboardEntry[] = [];
      let rank = (pagination.page - 1) * pagination.limit + 1;

      snapshot.docs.forEach((docSnap) => {
        const userData = docSnap.data();

        // Skip users who opted out of leaderboard
        if (userData.preferences?.privacy?.showOnLeaderboard === false) {
          return;
        }

        const entry: LeaderboardEntry = {
          userId: docSnap.id,
          username: userData.username || "Anonymous Champion",
          avatarUrl: userData.avatarUrl || "",
          score: userData.coins || 0,
          rank: rank++,
          change: 0, // TODO: Calculate from historical data
          level: userData.level || 1,
          badges: (userData.badges || []).map((b: any) => b.id),
          location: userData.location,
          lastActive: userData.lastActive || Timestamp.now(),
        };

        entries.push(entry);
      });

      // Get total count for pagination info
      const totalSnapshot = await getDocs(query(usersRef));
      const totalPlayers = totalSnapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.preferences?.privacy?.showOnLeaderboard !== false;
      }).length;

      const leaderboardData: LeaderboardData = {
        entries,
        totalPlayers,
        lastUpdated: new Date().toISOString(),
        period: filters.timeframe || "all-time",
      };

      return {
        success: true,
        data: leaderboardData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return {
        success: false,
        error: "FETCH_FAILED",
        message: "Failed to fetch leaderboard data",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * GET /api/leaderboard/user-rank
   * Get current user's rank and nearby competitors
   */
  async getUserRank(userId: string): Promise<ApiResponse<UserRankData>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: "INVALID_USER_ID",
          message: "User ID is required",
          timestamp: new Date().toISOString(),
        };
      }

      // Get user data
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return {
          success: false,
          error: "USER_NOT_FOUND",
          message: "User not found",
          timestamp: new Date().toISOString(),
        };
      }

      const userData = userDoc.data();

      // Get all users for ranking calculation
      const usersRef = collection(db, `${getBasePath()}/users`);
      const allUsersQuery = query(usersRef, orderBy("coins", "desc"));
      const allUsersSnapshot = await getDocs(allUsersQuery);

      let currentRank = 0;
      let totalPlayers = 0;
      const nearbyCompetitors: LeaderboardEntry[] = [];

      allUsersSnapshot.docs.forEach((docSnap, index) => {
        const data = docSnap.data();

        // Skip users who opted out
        if (data.preferences?.privacy?.showOnLeaderboard === false) {
          return;
        }

        totalPlayers++;
        const rank = totalPlayers;

        if (docSnap.id === userId) {
          currentRank = rank;
        }

        // Get nearby competitors (±5 positions around user)
        if (Math.abs(rank - currentRank) <= 5 || currentRank === 0) {
          nearbyCompetitors.push({
            userId: docSnap.id,
            username: data.username || "Anonymous Champion",
            avatarUrl: data.avatarUrl || "",
            score: data.coins || 0,
            rank,
            change: 0, // TODO: Calculate from historical data
            level: data.level || 1,
            badges: (data.badges || []).map((b: any) => b.id),
            location: data.location,
            lastActive: data.lastActive || Timestamp.now(),
          });
        }
      });

      // Calculate category-specific ranks
      const categoryRanks = await this.calculateCategoryRanks(userId, userData);

      // Get rank history with proper historical tracking
      const rankHistory = await this.getRankHistory(
        userId,
        currentRank,
        userData.coins || 0
      );

      const userRankData: UserRankData = {
        currentRank,
        totalPlayers,
        nearbyCompetitors: nearbyCompetitors.sort((a, b) => a.rank - b.rank),
        categoryRanks,
        weeklyRank: currentRank, // TODO: Implement weekly rankings
        monthlyRank: currentRank, // TODO: Implement monthly rankings
        dailyRank: currentRank, // TODO: Implement daily rankings
        rankHistory,
      };

      return {
        success: true,
        data: userRankData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching user rank:", error);
      return {
        success: false,
        error: "FETCH_FAILED",
        message: "Failed to fetch user rank data",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * GET /api/leaderboard/categories
   * Get leaderboard for specific categories
   */
  async getCategoryLeaderboard(
    category: string,
    limit: number = 50
  ): Promise<ApiResponse<LeaderboardData>> {
    try {
      // Get all themes for the category
      const themesRef = collection(db, `${getBasePath()}/themes`);
      const categoryThemesQuery = query(
        themesRef,
        where("category", "==", category),
        where("isActive", "==", true)
      );
      const themesSnapshot = await getDocs(categoryThemesQuery);

      // Collect all task IDs for this category
      const categoryTaskIds: string[] = [];
      themesSnapshot.docs.forEach((doc) => {
        const themeData = doc.data();
        const tasks = themeData.tasks || [];
        tasks.forEach((task: any) => {
          categoryTaskIds.push(task.id);
        });
      });

      if (categoryTaskIds.length === 0) {
        return {
          success: true,
          data: {
            entries: [],
            totalPlayers: 0,
            lastUpdated: new Date().toISOString(),
            period: "all-time",
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Get users and calculate category scores
      const usersRef = collection(db, `${getBasePath()}/users`);
      const usersSnapshot = await getDocs(usersRef);

      const categoryScores: Array<{
        userId: string;
        userData: any;
        categoryScore: number;
      }> = [];

      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        const completedTasks = userData.completedTasks || [];

        // Calculate score for this category
        const categoryCompletedTasks = completedTasks.filter((taskId: string) =>
          categoryTaskIds.includes(taskId)
        );

        if (categoryCompletedTasks.length > 0) {
          categoryScores.push({
            userId: doc.id,
            userData,
            categoryScore: categoryCompletedTasks.length,
          });
        }
      });

      // Sort by category score
      categoryScores.sort((a, b) => b.categoryScore - a.categoryScore);

      // Create leaderboard entries
      const entries: LeaderboardEntry[] = categoryScores
        .slice(0, limit)
        .map((item, index) => ({
          userId: item.userId,
          username: item.userData.username || "Anonymous Champion",
          avatarUrl: item.userData.avatarUrl || "",
          score: item.categoryScore,
          rank: index + 1,
          change: 0,
          level: item.userData.level || 1,
          badges: (item.userData.badges || []).map((b: any) => b.id),
          location: item.userData.location,
          lastActive: item.userData.lastActive || Timestamp.now(),
        }));

      return {
        success: true,
        data: {
          entries,
          totalPlayers: categoryScores.length,
          lastUpdated: new Date().toISOString(),
          period: "all-time",
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching category leaderboard:", error);
      return {
        success: false,
        error: "FETCH_FAILED",
        message: "Failed to fetch category leaderboard",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * GET /api/leaderboard/friends
   * Get leaderboard for user's friends
   */
  async getFriendsLeaderboard(
    userId: string
  ): Promise<ApiResponse<LeaderboardData>> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return {
          success: false,
          error: "USER_NOT_FOUND",
          message: "User not found",
          timestamp: new Date().toISOString(),
        };
      }

      const userData = userDoc.data();
      const friendsList = userData.friendsList || [];

      if (friendsList.length === 0) {
        return {
          success: true,
          data: {
            entries: [],
            totalPlayers: 0,
            lastUpdated: new Date().toISOString(),
            period: "all-time",
          },
          timestamp: new Date().toISOString(),
        };
      }

      // Get friends data
      const friendsData: Array<{ userId: string; userData: any }> = [];

      for (const friendId of friendsList) {
        const friendRef = doc(db, `${getBasePath()}/users/${friendId}`);
        const friendDoc = await getDoc(friendRef);

        if (friendDoc.exists()) {
          friendsData.push({
            userId: friendId,
            userData: friendDoc.data(),
          });
        }
      }

      // Include current user
      friendsData.push({
        userId,
        userData,
      });

      // Sort by coins
      friendsData.sort(
        (a, b) => (b.userData.coins || 0) - (a.userData.coins || 0)
      );

      // Create leaderboard entries
      const entries: LeaderboardEntry[] = friendsData.map((friend, index) => ({
        userId: friend.userId,
        username: friend.userData.username || "Anonymous Champion",
        avatarUrl: friend.userData.avatarUrl || "",
        score: friend.userData.coins || 0,
        rank: index + 1,
        change: 0,
        level: friend.userData.level || 1,
        badges: (friend.userData.badges || []).map((b: any) => b.id),
        location: friend.userData.location,
        lastActive: friend.userData.lastActive || Timestamp.now(),
      }));

      // Find user's entry
      const userEntry = entries.find((entry) => entry.userId === userId);

      return {
        success: true,
        data: {
          entries,
          userEntry,
          totalPlayers: entries.length,
          lastUpdated: new Date().toISOString(),
          period: "all-time",
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching friends leaderboard:", error);
      return {
        success: false,
        error: "FETCH_FAILED",
        message: "Failed to fetch friends leaderboard",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Private helper methods

  /**
   * Get and update rank history for a user
   */
  private async getRankHistory(
    userId: string,
    currentRank: number,
    currentScore: number
  ): Promise<RankHistoryEntry[]> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const rankHistoryRef = doc(db, `${getBasePath()}/rankHistory/${userId}`);

      // Get existing rank history
      const historyDoc = await getDoc(rankHistoryRef);
      let existingHistory: RankHistoryEntry[] = [];

      if (historyDoc.exists()) {
        existingHistory = historyDoc.data().history || [];
      }

      // Check if we already have today's entry
      const todayEntryIndex = existingHistory.findIndex(
        (entry) => entry.date === today
      );

      let updatedHistory: RankHistoryEntry[] = [...existingHistory];

      if (todayEntryIndex >= 0) {
        // Update today's entry
        const yesterdayRank =
          existingHistory[todayEntryIndex - 1]?.rank || currentRank;
        updatedHistory[todayEntryIndex] = {
          date: today,
          rank: currentRank,
          score: currentScore,
          change: yesterdayRank - currentRank, // Positive = rank improved (went down in number)
        };
      } else {
        // Add new entry for today
        const lastEntry = existingHistory[existingHistory.length - 1];
        const lastRank = lastEntry?.rank || currentRank;

        const newEntry: RankHistoryEntry = {
          date: today,
          rank: currentRank,
          score: currentScore,
          change: lastRank - currentRank, // Positive = rank improved
        };

        updatedHistory.push(newEntry);

        // Keep only last 30 days of history
        if (updatedHistory.length > 30) {
          updatedHistory = updatedHistory.slice(-30);
        }
      }

      // Update the database with new history
      await setDoc(
        rankHistoryRef,
        {
          userId,
          history: updatedHistory,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );

      return updatedHistory;
    } catch (error) {
      console.error("Error managing rank history:", error);

      // Fallback: return current rank only
      return [
        {
          date: new Date().toISOString().split("T")[0],
          rank: currentRank,
          score: currentScore,
          change: 0,
        },
      ];
    }
  }

  private async calculateCategoryRanks(
    userId: string,
    userData: any
  ): Promise<Record<string, number>> {
    const categoryRanks: Record<string, number> = {};

    try {
      // Get all themes to categorize
      const themesRef = collection(db, `${getBasePath()}/themes`);
      const themesSnapshot = await getDocs(themesRef);

      const categories = new Set<string>();
      const categoryTaskMap: Record<string, string[]> = {};

      themesSnapshot.docs.forEach((doc) => {
        const themeData = doc.data();
        const category = themeData.category;

        if (category) {
          categories.add(category);
          if (!categoryTaskMap[category]) {
            categoryTaskMap[category] = [];
          }

          const tasks = themeData.tasks || [];
          tasks.forEach((task: any) => {
            categoryTaskMap[category].push(task.id);
          });
        }
      });

      // Calculate rank for each category
      for (const category of categories) {
        const categoryLeaderboard = await this.getCategoryLeaderboard(
          category,
          1000
        );

        if (categoryLeaderboard.success && categoryLeaderboard.data) {
          const userEntry = categoryLeaderboard.data.entries.find(
            (entry) => entry.userId === userId
          );
          categoryRanks[category] = userEntry?.rank || 0;
        }
      }
    } catch (error) {
      console.error("Error calculating category ranks:", error);
    }

    return categoryRanks;
  }
}

// Export singleton instance
export const leaderboardApi = new LeaderboardApiService();
