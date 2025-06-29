import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  runTransaction,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db, getBasePath } from "../firebase/config";
import { staticCache, dynamicCache, sessionCache } from "../utils/CacheManager";

export interface QuestTask {
  id: string;
  title: string;
  description: string;
  coinReward: number;
  type:
    | "quiz"
    | "activity"
    | "creative"
    | "matching"
    | "drawing"
    | "reading"
    | "group";
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedTime: number; // in minutes
  ageRange?: {
    min: number;
    max: number;
  };
  data?: any;
  prerequisites?: string[]; // task IDs that must be completed first
  isActive: boolean;
  isLocked?: boolean; // Add lock state for age-restricted content
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuestTheme {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  imageUrl: string;
  ageRange?: {
    min: number;
    max: number;
  };
  isActive: boolean;
  isLocked?: boolean; // Add lock state for age-restricted content
  order: number;
  tasks: QuestTask[];
  totalTasks: number;
  totalRewards: number;
  estimatedDuration: number; // total time in minutes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserQuestProgress {
  userId: string;
  completedTasks: string[];
  inProgressTasks: string[];
  totalCoinsEarned: number;
  totalTasksCompleted: number;
  lastActivityAt: Timestamp;
  streakDays: number;
  achievements: string[];
}

export interface QuestApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface GetQuestsParams {
  userId: string;
  userAge?: number;
  category?: string;
  difficulty?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  includeInactive?: boolean;
}

export interface UpdateTaskParams {
  userId: string;
  taskId: string;
  themeId: string;
  coinsEarned: number;
  completionData?: any;
}

class QuestsApiService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  /**
   * GET /api/quests?userId={userId} - Retrieve all available quests and user progress
   */
  async getQuests(params: GetQuestsParams): Promise<QuestApiResponse> {
    try {
      const {
        userId,
        userAge,
        category,
        difficulty,
        search,
        sortBy,
        sortDirection,
        includeInactive = false,
      } = params;

      if (!userId) {
        return {
          success: false,
          error: "INVALID_USER_ID",
          message: "User ID is required",
        };
      }

      // Create cache key for this specific request
      const cacheKey = `quests_${userId}_${userAge || "all"}_${
        category || "all"
      }_${difficulty || "all"}_${includeInactive}_${search || ""}_${
        sortBy || "order"
      }_${sortDirection || "asc"}`;

      // Check cache first for fast loading
      const cachedData = dynamicCache.get<any>(cacheKey);
      if (cachedData) {
        console.log("🚀 Quest API - Returning cached data (instant load)");
        return {
          success: true,
          data: cachedData,
          message: "Quests retrieved from cache",
        };
      }

      // ⚡ PERFORMANCE OPTIMIZATION: Parallel data fetching
      const startTime = Date.now();
      console.log("🚀 Quest API - Starting parallel data fetch...");

      const basePath = getBasePath();

      // Fetch themes and user progress in parallel
      const [themesResult, userProgress] = await Promise.all([
        this.fetchThemesOptimized(basePath, {
          category,
          difficulty,
          includeInactive,
          search,
          sortBy,
          sortDirection,
        }),
        this.getUserProgress(userId),
      ]);

      const themes = themesResult;
      console.log(
        `🚀 Quest API - Parallel fetch completed in ${Date.now() - startTime}ms`
      );

      // ✅ TASK ORDERING FIX: Process themes with proper sequential task ordering
      const processedThemes = themes
        .map((theme) => {
          const isThemeLocked =
            userAge && userAge > 0
              ? (theme.ageRange?.min || 0) > userAge
              : false;

          const tasks: QuestTask[] = (theme.tasks || []).map((task: any) => ({
            ...task,
            isCompleted: userProgress.completedTasks.includes(task.id),
            isLocked:
              isThemeLocked ||
              (userAge && userAge > 0
                ? (task.ageRange?.min || 0) > userAge
                : false),
          }));

          return {
            ...theme,
            isLocked: isThemeLocked,
            tasks,
          };
        })
        .filter(Boolean) as QuestTheme[];

      // Apply sorting
      if (sortBy && sortBy !== "order") {
        processedThemes.sort((a, b) => {
          let aVal, bVal;
          switch (sortBy) {
            case "name":
              aVal = a.name.toLowerCase();
              bVal = b.name.toLowerCase();
              break;
            case "category":
              aVal = a.category.toLowerCase();
              bVal = b.category.toLowerCase();
              break;
            case "difficulty":
              const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
              aVal = difficultyOrder[a.difficulty] || 0;
              bVal = difficultyOrder[b.difficulty] || 0;
              break;
            case "totalRewards":
              aVal = a.totalRewards;
              bVal = b.totalRewards;
              break;
            case "totalTasks":
              aVal = a.totalTasks;
              bVal = b.totalTasks;
              break;
            default:
              aVal = a.order;
              bVal = b.order;
          }

          if (sortDirection === "desc") {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
          }
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        });
      }

      const questData = {
        themes: processedThemes,
        userProgress,
        metadata: {
          totalThemes: processedThemes.length,
          totalTasks: processedThemes.reduce(
            (sum, theme) => sum + theme.totalTasks,
            0
          ),
          totalPossibleRewards: processedThemes.reduce(
            (sum, theme) => sum + theme.totalRewards,
            0
          ),
          userCompletionRate: this.calculateCompletionRate(
            processedThemes,
            userProgress
          ),
          lastUpdated: new Date().toISOString(),
          loadTime: Date.now() - startTime,
        },
      };

      // ⚡ Cache the results for 3 minutes for faster loads
      dynamicCache.set(cacheKey, questData, 3 * 60 * 1000);

      console.log(
        `🚀 Quest API - Total processing time: ${Date.now() - startTime}ms`
      );

      return {
        success: true,
        data: questData,
      };
    } catch (error) {
      console.error("Error fetching quests:", error);
      return {
        success: false,
        error: "FETCH_FAILED",
        message: "Failed to fetch quest data. Please try again.",
      };
    }
  }

  // ⚡ NEW: Optimized theme fetching method
  private async fetchThemesOptimized(
    basePath: string,
    filters: any
  ): Promise<any[]> {
    const themesRef = collection(db, `${basePath}/themes`);

    const queryConstraints = [];
    if (filters.category) {
      queryConstraints.push(where("category", "==", filters.category));
    }
    if (filters.difficulty) {
      queryConstraints.push(where("difficulty", "==", filters.difficulty));
    }
    if (!filters.includeInactive) {
      queryConstraints.push(where("isActive", "==", true));
    }

    if (filters.sortBy) {
      queryConstraints.push(
        orderBy(filters.sortBy, filters.sortDirection || "asc")
      );
    } else {
      queryConstraints.push(orderBy("order", "asc"));
    }

    // Apply search filter if provided
    if (filters.search) {
      console.log(`🔍 Searching themes for: "${filters.search}"`);

      const searchQuery = query(
        themesRef,
        ...queryConstraints
        // Note: Firestore doesn't support text search, so we'll do client-side filtering
      );

      const snapshot = await getDocs(searchQuery);
      let allThemes: any[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Client-side search filtering
      const searchLower = filters.search.toLowerCase().trim();
      allThemes = allThemes.filter((theme: any) => {
        const nameMatch = theme.name?.toLowerCase().includes(searchLower);
        const descriptionMatch = theme.description
          ?.toLowerCase()
          .includes(searchLower);
        const categoryMatch = theme.category
          ?.toLowerCase()
          .includes(searchLower);
        return nameMatch || descriptionMatch || categoryMatch;
      });

      console.log(`🔍 Found ${allThemes.length} themes matching search`);
      return allThemes;
    } else {
      const searchQuery = query(themesRef, ...queryConstraints);
      const snapshot = await getDocs(searchQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
  }

  /**
   * PATCH /api/quests/task/{taskId} - Update task completion status
   */
  async updateTaskCompletion(
    params: UpdateTaskParams
  ): Promise<QuestApiResponse> {
    try {
      const { userId, taskId, themeId, coinsEarned, completionData } = params;

      // Invalidate quest cache after task completion
      dynamicCache.invalidateByPrefix(`quests_${userId}`);

      if (!userId || !taskId) {
        const errorMsg = "User ID and Task ID are required";
        console.error(`❌ ${errorMsg}`);
        return {
          success: false,
          error: "INVALID_PARAMETERS",
          message: errorMsg,
        };
      }

      // Validate task exists and user can complete it
      const validation = await this.validateTaskCompletion(
        userId,
        taskId,
        themeId
      );
      if (!validation.success) {
        console.error(`❌ Task validation failed:`, validation);
        return validation;
      }

      // Get current user progress
      const userProgress = await this.getUserProgress(userId);

      // Check if task is already completed
      if (userProgress.completedTasks.includes(taskId)) {
        console.warn(`⚠️ Task ${taskId} already completed by user ${userId}`);
        return {
          success: false,
          error: "TASK_ALREADY_COMPLETED",
          message: "This task has already been completed",
        };
      }

      // Update user profile
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.error(`❌ User document not found for user: ${userId}`);
        // Create user document if it doesn't exist
        const newUserData = {
          completedTasks: [taskId],
          coins: coinsEarned,
          totalExperience: coinsEarned,
          level: Math.floor(coinsEarned / 100) + 1,
          experience: coinsEarned % 100,
          experienceToNextLevel: 100 - (coinsEarned % 100),
          rankTitle: this.getRankTitle(Math.floor(coinsEarned / 100) + 1),
          lastActive: Timestamp.now(),
          createdAt: Timestamp.now(),
          inProgressTasks: [],
        };

        await setDoc(userRef, newUserData);

        return {
          success: true,
          data: {
            taskId,
            coinsEarned,
            newTotalCoins: coinsEarned,
            newLevel: newUserData.level,
            newExperience: newUserData.experience,
            experienceToNextLevel: newUserData.experienceToNextLevel,
            rankTitle: newUserData.rankTitle,
            completedTasksCount: 1,
            newAchievements: [],
            completionTimestamp: new Date().toISOString(),
          },
          message: `Task completed! You earned ${coinsEarned} coins.`,
        };
      }

      const userData = userDoc.data();
      const updatedCompletedTasks = [
        ...(userData.completedTasks || []),
        taskId,
      ];
      const updatedCoins = (userData.coins || 0) + coinsEarned;
      const updatedInProgress = (userData.inProgressTasks || []).filter(
        (id: string) => id !== taskId
      );

      // Calculate new level data
      const newTotalExperience = updatedCoins;
      const newLevel = Math.floor(newTotalExperience / 100) + 1;
      const newExperience = newTotalExperience % 100;
      const newExperienceToNext = 100 - (newTotalExperience % 100);
      const newRankTitle = this.getRankTitle(newLevel);

      // Update user document with error handling
      const updateData = {
        completedTasks: updatedCompletedTasks,
        inProgressTasks: updatedInProgress,
        coins: updatedCoins,
        totalExperience: newTotalExperience,
        level: newLevel,
        experience: newExperience,
        experienceToNextLevel: newExperienceToNext,
        rankTitle: newRankTitle,
        lastActive: Timestamp.now(),
        // Update completion data if provided
        ...(completionData && {
          [`taskCompletionData.${taskId}`]: completionData,
        }),
      };

      await updateDoc(userRef, updateData);

      // Update streak and achievements
      try {
        await this.updateUserStreak(userId);
        const newAchievements = await this.checkForNewAchievements(
          userId,
          updatedCompletedTasks,
          updatedCoins
        );
      } catch (achievementError) {
        console.warn(
          `⚠️ Achievement update failed for user ${userId}:`,
          achievementError
        );
        // Continue despite achievement error
      }

      return {
        success: true,
        data: {
          taskId,
          coinsEarned,
          newTotalCoins: updatedCoins,
          newLevel,
          newExperience,
          experienceToNextLevel: newExperienceToNext,
          rankTitle: newRankTitle,
          completedTasksCount: updatedCompletedTasks.length,
          newAchievements: [],
          completionTimestamp: new Date().toISOString(),
        },
        message: `Task completed! You earned ${coinsEarned} coins.`,
      };
    } catch (error) {
      console.error("❌ Error updating task completion:", error);
      return {
        success: false,
        error: "UPDATE_FAILED",
        message: `Failed to update task completion: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Set up real-time listener for quest updates with improved error handling
   */
  subscribeToQuestUpdates(
    userId: string,
    callback: (data: any) => void
  ): () => void {
    const unsubscribeKey = `quests_${userId}`;

    // Clean up existing subscription
    if (this.unsubscribeCallbacks.has(unsubscribeKey)) {
      try {
        this.unsubscribeCallbacks.get(unsubscribeKey)!();
        this.unsubscribeCallbacks.delete(unsubscribeKey);
      } catch (error) {
        console.warn(
          `⚠️ Error cleaning up subscription ${unsubscribeKey}:`,
          error
        );
      }
    }

    const themesRef = collection(db, `${getBasePath()}/themes`);
    const themesQuery = query(themesRef, orderBy("order", "asc"));

    const unsubscribe = onSnapshot(
      themesQuery,
      async (snapshot) => {
        try {
          const userProgress = await this.getUserProgress(userId);

          const themes: QuestTheme[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();

            // Skip inactive themes
            if (data.isActive === false) {
              return;
            }

            const tasks: QuestTask[] = (data.tasks || []).map((task: any) => ({
              ...task,
              isCompleted: userProgress.completedTasks.includes(task.id),
              isInProgress: userProgress.inProgressTasks.includes(task.id),
              canStart: this.canStartTask(task, userProgress.completedTasks),
            }));

            const themeWithTasks = {
              id: doc.id,
              name: data.name || "Untitled Quest",
              description: data.description || "",
              category: data.category || "General",
              difficulty: data.difficulty || "Easy",
              imageUrl: data.imageUrl || "",
              isActive: data.isActive !== false,
              order: data.order || 0,
              tasks,
              totalTasks: tasks.length,
              totalRewards: tasks.reduce(
                (sum, task) => sum + (task.coinReward || 0),
                0
              ),
              estimatedDuration: tasks.reduce(
                (sum, task) => sum + (task.estimatedTime || 5),
                0
              ),
              createdAt: data.createdAt || Timestamp.now(),
              updatedAt: data.updatedAt || Timestamp.now(),
            } as QuestTheme;

            themes.push(themeWithTasks);
          });

          callback({
            themes,
            userProgress,
            lastUpdated: new Date().toISOString(),
          });
        } catch (error) {
          console.error("❌ Error processing real-time quest updates:", error);
          callback({ error: "Real-time update failed" });
        }
      },
      (error) => {
        console.error("❌ Quest subscription error:", error);

        // Handle specific Firestore errors
        if (error.code === "permission-denied") {
          callback({ error: "Permission denied - check Firestore rules" });
        } else if (error.code === "unavailable") {
          callback({ error: "Service temporarily unavailable" });
        } else if (error.code === "failed-precondition") {
          callback({ error: "Failed precondition - check indexes" });
        } else {
          callback({ error: `Subscription failed: ${error.message}` });
        }
      }
    );

    this.unsubscribeCallbacks.set(unsubscribeKey, unsubscribe);

    // Return wrapped unsubscribe that includes logging
    return () => {
      try {
        unsubscribe();
        this.unsubscribeCallbacks.delete(unsubscribeKey);
      } catch (error) {
        console.warn(`⚠️ Error during unsubscribe:`, error);
      }
    };
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

  // Private helper methods

  private async getUserProgress(userId: string): Promise<UserQuestProgress> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return {
          userId,
          completedTasks: [],
          inProgressTasks: [],
          totalCoinsEarned: 0,
          totalTasksCompleted: 0,
          lastActivityAt: Timestamp.now(),
          streakDays: 0,
          achievements: [],
        };
      }

      const data = userDoc.data();
      return {
        userId,
        completedTasks: data.completedTasks || [],
        inProgressTasks: data.inProgressTasks || [],
        totalCoinsEarned: data.coins || 0,
        totalTasksCompleted: (data.completedTasks || []).length,
        lastActivityAt: data.lastActive || Timestamp.now(),
        streakDays: data.streakDays || 0,
        achievements: data.achievements || [],
      };
    } catch (error) {
      console.error("Error fetching user progress:", error);
      throw error;
    }
  }

  private canStartTask(task: any, completedTasks: string[]): boolean {
    if (!task.prerequisites || task.prerequisites.length === 0) {
      return true;
    }

    return task.prerequisites.every((prereqId: string) =>
      completedTasks.includes(prereqId)
    );
  }

  private calculateCompletionRate(
    themes: QuestTheme[],
    userProgress: UserQuestProgress
  ): number {
    const totalTasks = themes.reduce((sum, theme) => sum + theme.totalTasks, 0);
    if (totalTasks === 0) return 0;

    return (userProgress.totalTasksCompleted / totalTasks) * 100;
  }

  private async validateTaskCompletion(
    userId: string,
    taskId: string,
    themeId: string
  ): Promise<QuestApiResponse> {
    try {
      // Check if theme exists
      const themeRef = doc(db, `${getBasePath()}/themes/${themeId}`);
      const themeDoc = await getDoc(themeRef);

      if (!themeDoc.exists()) {
        return {
          success: false,
          error: "THEME_NOT_FOUND",
          message: "Quest theme not found",
        };
      }

      const themeData = themeDoc.data();
      const task = (themeData.tasks || []).find((t: any) => t.id === taskId);

      if (!task) {
        return {
          success: false,
          error: "TASK_NOT_FOUND",
          message: "Task not found in the specified theme",
        };
      }

      if (!task.isActive) {
        return {
          success: false,
          error: "TASK_INACTIVE",
          message: "This task is currently not available",
        };
      }

      // Check prerequisites
      const userProgress = await this.getUserProgress(userId);
      if (!this.canStartTask(task, userProgress.completedTasks)) {
        return {
          success: false,
          error: "PREREQUISITES_NOT_MET",
          message: "You must complete prerequisite tasks first",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error validating task completion:", error);
      return {
        success: false,
        error: "VALIDATION_FAILED",
        message: "Failed to validate task completion",
      };
    }
  }

  private getRankTitle(level: number): string {
    if (level >= 50) return "Legendary Master";
    if (level >= 30) return "Elite Champion";
    if (level >= 20) return "Grand Champion";
    if (level >= 10) return "Champion";
    if (level >= 5) return "Rising Star";
    return "Novice Champion";
  }

  private async updateUserStreak(userId: string): Promise<void> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const lastActivity = userData.lastActivityAt?.toDate() || new Date();
      const today = new Date();
      const daysDiff = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      let newStreak = userData.streakDays || 0;

      if (daysDiff === 1) {
        // Consecutive day
        newStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If daysDiff === 0, it's the same day, don't change streak

      await updateDoc(userRef, {
        streakDays: newStreak,
        lastActivityAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating user streak:", error);
    }
  }

  // 🔒 DUPLICATION FIX: Achievement operations lock to prevent race conditions
  private achievementLocks = new Map<string, Promise<string[]>>();

  private async checkForNewAchievements(
    userId: string,
    completedTasks: string[],
    totalCoins: number
  ): Promise<string[]> {
    // 🔒 RACE CONDITION FIX: Ensure only one achievement check per user at a time
    if (this.achievementLocks.has(userId)) {
      console.log(
        `⏳ Achievement check already in progress for user ${userId}, waiting...`
      );
      return await this.achievementLocks.get(userId)!;
    }

    const achievementOperation = this.performAchievementCheck(
      userId,
      completedTasks,
      totalCoins
    );
    this.achievementLocks.set(userId, achievementOperation);

    try {
      const result = await achievementOperation;
      return result;
    } finally {
      this.achievementLocks.delete(userId);
    }
  }

  private async performAchievementCheck(
    userId: string,
    completedTasks: string[],
    totalCoins: number
  ): Promise<string[]> {
    const newAchievements: string[] = [];

    // Define achievement criteria
    const achievements = [
      {
        id: "first_task",
        name: "First Steps",
        condition: () => completedTasks.length >= 1,
      },
      {
        id: "task_master_5",
        name: "Task Master",
        condition: () => completedTasks.length >= 5,
      },
      {
        id: "task_master_10",
        name: "Quest Warrior",
        condition: () => completedTasks.length >= 10,
      },
      {
        id: "task_master_25",
        name: "Quest Champion",
        condition: () => completedTasks.length >= 25,
      },
      {
        id: "coin_collector_100",
        name: "Coin Collector",
        condition: () => totalCoins >= 100,
      },
      {
        id: "coin_collector_500",
        name: "Treasure Hunter",
        condition: () => totalCoins >= 500,
      },
      {
        id: "coin_collector_1000",
        name: "Wealth Master",
        condition: () => totalCoins >= 1000,
      },
    ];

    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);

      // 🔒 ATOMIC OPERATION: Use a transaction to prevent duplication
      const db_transaction = await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          console.log(`❌ User ${userId} not found for achievement check`);
          return [];
        }

        const userData = userDoc.data();
        const currentAchievements = userData.achievements || [];
        const achievementsToAdd: string[] = [];

        // Check for new achievements
        for (const achievement of achievements) {
          if (
            !currentAchievements.includes(achievement.id) &&
            achievement.condition()
          ) {
            achievementsToAdd.push(achievement.id);
            console.log(
              `🏆 New achievement unlocked for ${userId}: ${achievement.name} (${achievement.id})`
            );
          }
        }

        // 🔒 DUPLICATION PREVENTION: Only update if there are truly new achievements
        if (achievementsToAdd.length > 0) {
          // Double-check to prevent duplicates (in case of concurrent transactions)
          const uniqueNewAchievements = achievementsToAdd.filter(
            (id) => !currentAchievements.includes(id)
          );

          if (uniqueNewAchievements.length > 0) {
            const updatedAchievements = [
              ...currentAchievements,
              ...uniqueNewAchievements,
            ];
            transaction.update(userRef, {
              achievements: updatedAchievements,
            });

            console.log(
              `✅ Added ${uniqueNewAchievements.length} new achievements for user ${userId}`
            );
            return uniqueNewAchievements;
          }
        }

        return [];
      });

      return db_transaction;
    } catch (error) {
      console.error("Error checking achievements:", error);
      return [];
    }
  }
}

// Export singleton instance
export const questsApi = new QuestsApiService();
