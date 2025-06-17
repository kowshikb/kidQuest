import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { getBasePath } from "../firebase/config";
import { dynamicCache, sessionCache } from "../utils/CacheManager";

// Types for Hobby system
export interface HobbyTask {
  id: string;
  day: number;
  title: string;
  description: string;
  instructions: string[];
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  estimatedTime: number; // in minutes
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  materials?: string[];
  parentGuidance?: boolean;
  coinReward: number;
  ageRange: {
    min: number;
    max: number;
  };
  prerequisites?: string[]; // Task IDs that must be completed first
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HobbyLevel {
  id: string;
  name: string;
  description: string;
  tasks: HobbyTask[];
  badge: string;
  badgeIcon: string;
  unlockMessage: string;
  prerequisite?: string; // Previous level ID
  totalDays: number;
  totalCoins: number;
  ageRange: {
    min: number;
    max: number;
  };
  order: number;
  isActive: boolean;
  isLocked?: boolean; // Add lock state for age-restricted content
}

export interface Hobby {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  imageUrl?: string;
  ageRange: {
    min: number;
    max: number;
  };
  levels: HobbyLevel[];
  totalDays: number;
  skills: string[];
  popularityRank: number;
  isActive: boolean;
  isLocked: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  totalCoins: number; // Sum of all coins from all levels
}

export interface UserHobbyProgress {
  userId: string;
  hobbyId: string;
  currentLevel: string;
  completedTasks: string[];
  earnedBadges: string[];
  streakDays: number;
  lastActivity: Timestamp;
  totalTimeSpent: number; // in minutes
  totalCoinsEarned: number;
  startedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?:
    | string
    | {
        code: string;
        message: string;
        details?: any;
      };
  message?: string;
  timestamp?: string;
  metadata?: {
    cached: boolean;
    timestamp: string;
  };
}

export interface GetHobbiesParams {
  userId: string;
  userAge?: number;
  category?: string;
  difficulty?: string;
  ageGroup?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  includeInactive?: boolean;
  timestamp?: string;
}

export interface CompleteTaskParams {
  userId: string;
  hobbyId: string;
  taskId: string;
  timeSpent?: number;
}

class HobbiesApiService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  /**
   * GET /api/hobbies - Retrieve all available hobbies filtered by user age
   */
  async getHobbies(params: GetHobbiesParams): Promise<ApiResponse<Hobby[]>> {
    try {
      const {
        userId,
        userAge,
        category,
        difficulty,
        ageGroup,
        search,
        sortBy = "name",
        sortDirection = "asc",
        includeInactive = false,
        timestamp,
      } = params;

      console.log(`🚀 Hobby API - Fetching hobbies with params:`, {
        userId,
        userAge,
        category,
        difficulty,
        ageGroup,
        search,
        sortBy,
        sortDirection,
        includeInactive,
        hasTimestamp: !!timestamp,
      });

      if (!userId) {
        return {
          success: false,
          error: "INVALID_USER_ID",
          message: "User ID is required",
        };
      }

      const cacheKey = `hobbies_${userId}_${userAge || "all"}_${
        category || "all"
      }_${difficulty || "all"}_${includeInactive}_${
        search || ""
      }_${sortBy}_${sortDirection}${timestamp ? `_${timestamp}` : ""}`;

      if (!search && !timestamp) {
        const cachedData = dynamicCache.get<Hobby[]>(cacheKey);
        if (cachedData) {
          console.log(`🎯 Cache HIT: ${cacheKey}`);
          return {
            success: true,
            data: cachedData,
            message: `Found ${cachedData.length} hobbies (cached)`,
            metadata: { cached: true, timestamp: new Date().toISOString() },
          };
        }
      } else {
        console.log(`🔍 Skipping cache for search query: "${search}"`);
      }

      console.log(
        `📊 Fetching fresh hobbies data for ${userId}, age: ${userAge}`
      );

      // Build query for hobbies
      const basePath = getBasePath();
      console.log("🔍 Hobbies API - Base path:", basePath);
      console.log(
        "🔍 Hobbies API - Full collection path:",
        `${basePath}/hobbies`
      );

      const hobbiesRef = collection(db, `${basePath}/hobbies`);

      const queryConstraints = [];

      if (category) {
        queryConstraints.push(where("category", "==", category));
      }
      if (!includeInactive) {
        queryConstraints.push(where("isActive", "==", true));
      }

      // Add sorting
      if (sortBy) {
        queryConstraints.push(orderBy(sortBy, sortDirection || "asc"));
      } else {
        queryConstraints.push(orderBy("popularityRank", "asc"));
      }

      const hobbiesQuery = query(hobbiesRef, ...queryConstraints);

      const querySnapshot = await getDocs(hobbiesQuery);
      console.log(`Found ${querySnapshot.docs.length} hobbies in database`);

      let hobbies: Hobby[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const isLocked =
          userAge && userAge > 0 ? (data.ageRange?.min || 0) > userAge : false;

        return {
          id: doc.id,
          ...data,
          isLocked,
        } as Hobby;
      });

      // In-memory search is still needed for partial text matching
      if (search) {
        console.log(`🔍 Searching hobbies for: "${search}"`);
        console.log(`🔍 Total hobbies before search: ${hobbies.length}`);

        const originalHobbies = [...hobbies];
        hobbies = hobbies.filter((hobby) => {
          const searchLower = search.toLowerCase().trim();
          const nameMatch = hobby.name?.toLowerCase().includes(searchLower);
          const descriptionMatch = hobby.description
            ?.toLowerCase()
            .includes(searchLower);
          const categoryMatch = hobby.category
            ?.toLowerCase()
            .includes(searchLower);
          const skillsMatch = hobby.skills?.some((skill) =>
            skill.toLowerCase().includes(searchLower)
          );

          const isMatch =
            nameMatch || descriptionMatch || categoryMatch || skillsMatch;

          // Debug logging for first few hobbies
          if (originalHobbies.indexOf(hobby) < 5) {
            console.log(`🔍 Debug hobby "${hobby.name}":`, {
              searchTerm: searchLower,
              nameMatch,
              descriptionMatch,
              categoryMatch,
              skillsMatch,
              isMatch,
            });
          }

          return isMatch;
        });

        console.log(`🔍 Hobbies after search: ${hobbies.length}`);

        // If no results and we're searching for short terms, try broader search
        if (hobbies.length === 0 && search.length <= 3) {
          console.log(
            `🔍 No results for short search "${search}", trying broader search...`
          );
          hobbies = originalHobbies.filter((hobby) => {
            const searchLower = search.toLowerCase().trim();
            // More flexible matching for short terms
            const flexibleNameMatch = hobby.name
              ?.toLowerCase()
              .replace(/\s+/g, "")
              .includes(searchLower);
            const flexibleCategoryMatch = hobby.category
              ?.toLowerCase()
              .replace(/\s+/g, "")
              .includes(searchLower);
            return flexibleNameMatch || flexibleCategoryMatch;
          });
          console.log(`🔍 Broader search results: ${hobbies.length}`);
        }
      }

      // Cache the results for 10 minutes
      dynamicCache.set(cacheKey, hobbies, 10 * 60 * 1000);

      console.log(
        `✅ Successfully fetched ${hobbies.length} hobbies for age ${userAge}`
      );

      return {
        success: true,
        data: hobbies,
        message: `Found ${hobbies.length} hobbies`,
        metadata: { cached: false, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      console.error("Error fetching hobbies:", error);
      return {
        success: false,
        error: {
          code: "FETCH_HOBBIES_ERROR",
          message: "Failed to fetch hobbies",
          details: error,
        },
      };
    }
  }

  /**
   * GET /api/hobbies/progress - Get user's progress across all hobbies
   */
  async getUserHobbyProgress(
    userId: string
  ): Promise<ApiResponse<UserHobbyProgress[]>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: "INVALID_USER_ID",
          message: "User ID is required",
        };
      }

      // Check cache first
      const cacheKey = `hobby_progress_${userId}`;
      const cachedData = sessionCache.get<UserHobbyProgress[]>(cacheKey);
      if (cachedData) {
        console.log(`🎯 Cache HIT: Hobby progress for ${userId}`);
        return {
          success: true,
          data: cachedData,
          message: "Hobby progress retrieved from cache",
          metadata: { cached: true, timestamp: new Date().toISOString() },
        };
      }

      console.log(`📊 Fetching hobby progress for ${userId}`);

      const progressRef = collection(
        db,
        `${getBasePath()}/users/${userId}/hobbyProgress`
      );
      const progressSnapshot = await getDocs(progressRef);

      const progressData: UserHobbyProgress[] = [];
      progressSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        progressData.push({
          userId,
          hobbyId: doc.id,
          currentLevel: data.currentLevel || "",
          completedTasks: data.completedTasks || [],
          earnedBadges: data.earnedBadges || [],
          streakDays: data.streakDays || 0,
          lastActivity: data.lastActivity || Timestamp.now(),
          totalTimeSpent: data.totalTimeSpent || 0,
          totalCoinsEarned: data.totalCoinsEarned || 0,
          startedAt: data.startedAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
        });
      });

      // Cache for 30 minutes
      sessionCache.set(cacheKey, progressData, 30 * 60 * 1000);

      return {
        success: true,
        data: progressData,
        message: `Found progress for ${progressData.length} hobbies`,
        metadata: { cached: false, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      console.error("Error fetching hobby progress:", error);
      return {
        success: false,
        error: {
          code: "FETCH_PROGRESS_ERROR",
          message: "Failed to fetch hobby progress",
          details: error,
        },
      };
    }
  }

  /**
   * POST /api/hobbies/complete-task - Complete a hobby task and award coins
   */
  async completeTask(params: CompleteTaskParams): Promise<
    ApiResponse<{
      coinsEarned: number;
      newTotalCoins: number;
      badgeEarned?: string;
      levelCompleted?: boolean;
    }>
  > {
    try {
      const { userId, hobbyId, taskId, timeSpent = 0 } = params;

      if (!userId || !hobbyId || !taskId) {
        return {
          success: false,
          error: "MISSING_PARAMETERS",
          message: "User ID, hobby ID, and task ID are required",
        };
      }

      console.log(
        `🎯 Completing task ${taskId} for user ${userId} in hobby ${hobbyId}`
      );

      // Get the hobby to find task details
      const hobbyDoc = await getDoc(
        doc(db, `${getBasePath()}/hobbies`, hobbyId)
      );
      if (!hobbyDoc.exists()) {
        return {
          success: false,
          error: "HOBBY_NOT_FOUND",
          message: "Hobby not found",
        };
      }

      const hobbyData = hobbyDoc.data();
      let taskData: HobbyTask | null = null;
      let levelData: HobbyLevel | null = null;

      // Find the task in the hobby levels
      for (const level of hobbyData.levels || []) {
        const task = level.tasks.find((t: any) => t.id === taskId);
        if (task) {
          taskData = task;
          levelData = level;
          break;
        }
      }

      if (!taskData) {
        return {
          success: false,
          error: "TASK_NOT_FOUND",
          message: "Task not found in hobby",
        };
      }

      const coinsEarned = taskData.coinReward || 0;

      // Use batch for atomic updates
      const batch = writeBatch(db);

      // Update user's hobby progress
      const progressRef = doc(
        db,
        `${getBasePath()}/users/${userId}/hobbyProgress`,
        hobbyId
      );
      const progressDoc = await getDoc(progressRef);

      let currentProgress: any = {
        currentLevel: levelData?.id || "",
        completedTasks: [],
        earnedBadges: [],
        streakDays: 0,
        lastActivity: Timestamp.now(),
        totalTimeSpent: 0,
        totalCoinsEarned: 0,
        startedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (progressDoc.exists()) {
        currentProgress = { ...currentProgress, ...progressDoc.data() };
      }

      // Add completed task if not already completed
      if (!currentProgress.completedTasks.includes(taskId)) {
        currentProgress.completedTasks.push(taskId);
        currentProgress.totalTimeSpent += timeSpent;
        currentProgress.totalCoinsEarned += coinsEarned;
        currentProgress.lastActivity = Timestamp.now();
        currentProgress.updatedAt = Timestamp.now();

        // Calculate streak
        const now = new Date();
        const lastActivity = currentProgress.lastActivity.toDate();
        const daysDiff = Math.floor(
          (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= 1) {
          currentProgress.streakDays = (currentProgress.streakDays || 0) + 1;
        } else {
          currentProgress.streakDays = 1;
        }
      }

      batch.set(progressRef, currentProgress);

      // Update user's total coins
      const userRef = doc(db, `${getBasePath()}/users`, userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const newTotalCoins = (userData.coins || 0) + coinsEarned;

        batch.update(userRef, {
          coins: newTotalCoins,
          updatedAt: Timestamp.now(),
        });

        // Check if level is completed
        let levelCompleted = false;
        let badgeEarned: string | undefined;

        if (levelData) {
          const levelTaskIds = levelData.tasks.map((t: any) => t.id);
          const completedLevelTasks = currentProgress.completedTasks.filter(
            (id: string) => levelTaskIds.includes(id)
          );

          if (completedLevelTasks.length === levelTaskIds.length) {
            levelCompleted = true;
            badgeEarned = levelData.badge;

            if (!currentProgress.earnedBadges.includes(badgeEarned)) {
              currentProgress.earnedBadges.push(badgeEarned);
              batch.update(progressRef, {
                earnedBadges: currentProgress.earnedBadges,
              });
            }
          }
        }

        // Commit all updates
        await batch.commit();

        // Invalidate caches
        sessionCache.invalidate(`hobby_progress_${userId}`);
        dynamicCache.invalidate(`hobbies_${userId}_*`);

        console.log(
          `✅ Task completed! User earned ${coinsEarned} coins. New total: ${newTotalCoins}`
        );

        return {
          success: true,
          data: {
            coinsEarned,
            newTotalCoins,
            badgeEarned,
            levelCompleted,
          },
          message: `Task completed! Earned ${coinsEarned} coins.`,
        };
      } else {
        return {
          success: false,
          error: "USER_NOT_FOUND",
          message: "User not found",
        };
      }
    } catch (error) {
      console.error("Error completing task:", error);
      return {
        success: false,
        error: {
          code: "COMPLETE_TASK_ERROR",
          message: "Failed to complete task",
          details: error,
        },
      };
    }
  }

  /**
   * GET /api/hobbies/categories - Get all available hobby categories
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const cacheKey = "hobby_categories";
      const cachedData = sessionCache.get<string[]>(cacheKey);

      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          message: "Categories retrieved from cache",
          metadata: { cached: true, timestamp: new Date().toISOString() },
        };
      }

      const hobbiesRef = collection(db, `${getBasePath()}/hobbies`);
      const hobbiesSnapshot = await getDocs(
        query(hobbiesRef, where("isActive", "==", true))
      );

      const categories = new Set<string>();
      hobbiesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });

      const categoriesArray = Array.from(categories).sort();

      // Cache for 1 hour
      sessionCache.set(cacheKey, categoriesArray, 60 * 60 * 1000);

      return {
        success: true,
        data: categoriesArray,
        message: `Found ${categoriesArray.length} categories`,
        metadata: { cached: false, timestamp: new Date().toISOString() },
      };
    } catch (error) {
      console.error("Error fetching categories:", error);
      return {
        success: false,
        error: {
          code: "FETCH_CATEGORIES_ERROR",
          message: "Failed to fetch categories",
          details: error,
        },
      };
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    this.unsubscribeCallbacks.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeCallbacks.clear();
  }

  async getCompletedHobbiesCount(userId: string): Promise<number> {
    if (!userId) return 0;

    const progressCollectionRef = collection(
      db,
      `${getBasePath()}/users/${userId}/hobbyProgress`
    );
    const progressSnapshot = await getDocs(progressCollectionRef);
    if (progressSnapshot.empty) return 0;

    const hobbiesCollectionRef = collection(db, `${getBasePath()}/hobbies`);
    const hobbiesSnapshot = await getDocs(hobbiesCollectionRef);
    const allHobbies = hobbiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Hobby[];

    let completedCount = 0;
    progressSnapshot.docs.forEach((progressDoc) => {
      const progressData = progressDoc.data() as UserHobbyProgress;
      const hobby = allHobbies.find((h) => h.id === progressData.hobbyId);
      if (!hobby) return;

      const totalTasks = hobby.levels.reduce(
        (sum: number, level: any) => sum + level.tasks.length,
        0
      );
      if (totalTasks > 0 && progressData.completedTasks.length >= totalTasks) {
        completedCount++;
      }
    });

    return completedCount;
  }
}

// Export singleton instance
export const hobbiesApi = new HobbiesApiService();
export default hobbiesApi;
