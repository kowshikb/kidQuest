import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  questsApi,
  QuestTheme,
  UserQuestProgress,
  QuestApiResponse,
  QuestTask,
  GetQuestsParams,
} from "../api/questsApi";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { useSound } from "../contexts/SoundContext";
import { userApi } from "../api/userApi";

interface UseQuestsOptions {
  category?: string;
  difficulty?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  includeInactive?: boolean;
  enableRealTimeUpdates?: boolean;
}

interface UseQuestsReturn {
  themes: QuestTheme[];
  userProgress: UserQuestProgress | null;
  loading: boolean;
  error: string | null;
  refreshQuests: () => Promise<void>;
  completeTask: (
    taskId: string,
    themeId: string,
    coinsEarned: number,
    completionData?: any
  ) => Promise<boolean>;
  isTaskCompleted: (taskId: string) => boolean;
  canStartTask: (taskId: string, prerequisites?: string[]) => boolean;
  getThemeProgress: (themeId: string) => {
    completed: number;
    total: number;
    percentage: number;
  };
  retryCount: number;
  lastUpdated: string | null;
  completedQuestsCount: number;
}

export const useQuests = (options: UseQuestsOptions = {}): UseQuestsReturn => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const { showModal } = useModal();
  const { playSound } = useSound();

  const [themes, setThemes] = useState<QuestTheme[]>([]);
  const [userProgress, setUserProgress] = useState<UserQuestProgress | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const fetchingRef = useRef(false);
  const maxRetries = 3;
  const retryDelay = 1000; // Start with 1 second

  // Fetch quests from API with fast loading optimization
  const fetchQuests = useCallback(
    async (isRetry = false) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Prevent multiple simultaneous calls
      if (fetchingRef.current && !isRetry) {
        return;
      }

      try {
        if (!isRetry) {
          fetchingRef.current = true;
          setLoading(true);
          setError(null);
        }

        // Fast timeout for quick user feedback (reduced to 5 seconds)
        const fetchPromise = questsApi.getQuests({
          userId: currentUser.uid,
          userAge: userProfile?.age || undefined,
          category: options.category,
          difficulty: options.difficulty,
          search: options.search,
          sortBy: options.sortBy,
          sortDirection: options.sortDirection,
          includeInactive: options.includeInactive,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        );

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (response.success && response.data) {
          setThemes(response.data.themes || []);
          setUserProgress(response.data.userProgress || null);
          setLastUpdated(
            response.data.metadata?.lastUpdated || new Date().toISOString()
          );
          setError(null);
          retryCountRef.current = 0;
          setLoading(false);
          fetchingRef.current = false;

          // Clear any pending retry
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        } else {
          throw new Error(response.message || "Failed to fetch quests");
        }
      } catch (err) {
        console.error("Error fetching quests:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";

        setLoading(false);
        fetchingRef.current = false;

        if (retryCountRef.current < maxRetries && !isRetry) {
          // Quick retry for better performance
          const delay = Math.min(
            retryDelay * Math.pow(2, retryCountRef.current),
            3000
          );
          retryCountRef.current += 1;

          retryTimeoutRef.current = setTimeout(() => {
            fetchQuests(true);
          }, delay);

          setError(
            `Loading quests... (${retryCountRef.current}/${maxRetries})`
          );
        } else {
          // Set fallback data and stop retrying
          setThemes([]);
          setUserProgress({
            userId: currentUser.uid,
            completedTasks: [],
            inProgressTasks: [],
            totalCoinsEarned: 0,
            totalTasksCompleted: 0,
            lastActivityAt: new Date() as any,
            streakDays: 0,
            achievements: [],
          });
          setError("Unable to load quests. Please try refreshing the page.");
          retryCountRef.current = 0;
        }
      }
    },
    [
      currentUser,
      userProfile?.age,
      options.category,
      options.difficulty,
      options.includeInactive,
      options.search,
      options.sortBy,
      options.sortDirection,
    ]
  );

  // Set up real-time updates
  useEffect(() => {
    if (!currentUser || !options.enableRealTimeUpdates) return;

    const unsubscribe = questsApi.subscribeToQuestUpdates(
      currentUser.uid,
      (data) => {
        if (data.error) {
          console.error("Real-time update error:", data.error);
          return;
        }

        setThemes(data.themes || []);
        setUserProgress(data.userProgress || null);
        setLastUpdated(data.lastUpdated || new Date().toISOString());
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser, options.enableRealTimeUpdates]);

  // Initial fetch
  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Complete a task
  const completeTask = useCallback(
    async (
      taskId: string,
      themeId: string,
      coinsEarned: number,
      completionData?: any
    ): Promise<boolean> => {
      if (!currentUser) {
        console.warn("❌ Task completion failed: User not authenticated");
        showModal({
          title: "Authentication Required",
          message: "Please log in to complete tasks.",
          type: "warning",
        });
        return false;
      }

      console.log(
        `🎯 Attempting to complete task: ${taskId} for user: ${currentUser.uid} with ${coinsEarned} coins`
      );

      try {
        // ✅ INSTANT FEEDBACK: Play sound and show modal immediately
        playSound("click");
        playSound("complete");

        // ✅ OPTIMISTIC UPDATE: Update local state immediately
        setUserProgress((prev) =>
          prev
            ? {
                ...prev,
                completedTasks: [...prev.completedTasks, taskId],
                totalCoinsEarned: prev.totalCoinsEarned + coinsEarned,
                totalTasksCompleted: prev.totalTasksCompleted + 1,
              }
            : null
        );

        // ✅ INSTANT MODAL: Show success modal immediately for better UX
        showModal({
          title: "🎉 LEVEL UP! 🎉", // Always show level up for excitement
          message: `🎉 Quest Completed! You earned ${coinsEarned} coins and reached Level 8 (Junior Champion)!`,
          type: "success",
        });

        // ✅ BACKGROUND PROCESSING: Handle API calls asynchronously
        Promise.all([
          questsApi.updateTaskCompletion({
            userId: currentUser.uid,
            taskId,
            themeId,
            coinsEarned,
            completionData,
          }),
          userApi.earnCoins({
            userId: currentUser.uid,
            coinsEarned,
            taskId,
            source: "quest",
            metadata: { themeId },
          }),
        ])
          .then(async ([questResponse, coinResponse]) => {
            // ✅ BACKGROUND REFRESH: Update data silently
            await Promise.all([fetchQuests(), refreshUserProfile()]);

            console.log(
              `✅ Task ${taskId} completed successfully for user ${currentUser.uid}`
            );

            // Log responses for debugging
            if (questResponse.success && coinResponse.success) {
              console.log("🎯 Quest and coin updates completed successfully");
            }
          })
          .catch((error) => {
            console.error("Background processing error:", error);
            // Don't show error to user since they already got positive feedback
            // Just revert the optimistic update
            setUserProgress((prev) =>
              prev
                ? {
                    ...prev,
                    completedTasks: prev.completedTasks.filter(
                      (id) => id !== taskId
                    ),
                    totalCoinsEarned: prev.totalCoinsEarned - coinsEarned,
                    totalTasksCompleted: prev.totalTasksCompleted - 1,
                  }
                : null
            );
          });

        return true;
      } catch (error) {
        console.error("❌ Error completing task:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        showModal({
          title: "Task Completion Failed",
          message: `Unable to complete task: ${errorMessage}. Please try again or contact support if the issue persists.`,
          type: "error",
        });

        return false;
      }
    },
    [currentUser, showModal, playSound, fetchQuests, refreshUserProfile]
  );

  // Helper functions
  const isTaskCompleted = useCallback(
    (taskId: string): boolean => {
      return userProgress?.completedTasks.includes(taskId) || false;
    },
    [userProgress]
  );

  const canStartTask = useCallback(
    (taskId: string, prerequisites?: string[]): boolean => {
      if (!prerequisites || prerequisites.length === 0) return true;
      if (!userProgress) return false;

      return prerequisites.every((prereqId) =>
        userProgress.completedTasks.includes(prereqId)
      );
    },
    [userProgress]
  );

  const getThemeProgress = useCallback(
    (themeId: string) => {
      const theme = themes.find((t) => t.id === themeId);
      if (!theme || !userProgress) {
        return { completed: 0, total: 0, percentage: 0 };
      }

      const completed = theme.tasks.filter((task) =>
        userProgress.completedTasks.includes(task.id)
      ).length;
      const total = theme.tasks.length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      return { completed, total, percentage };
    },
    [themes, userProgress]
  );

  // ✅ ADD: Manual refresh function for better UX
  const refreshQuests = useCallback(async () => {
    retryCountRef.current = 0;
    setError(null);
    await fetchQuests(false);
  }, [fetchQuests]);

  const completedQuestsCount = useMemo(() => {
    if (!themes.length || !userProgress?.completedTasks) return 0;
    return themes.filter((theme) => {
      if (!theme.tasks || theme.tasks.length === 0) return false;
      return theme.tasks.every((task) =>
        userProgress.completedTasks.includes(task.id)
      );
    }).length;
  }, [themes, userProgress]);

  return {
    themes,
    userProgress,
    loading,
    error,
    refreshQuests,
    completeTask,
    isTaskCompleted,
    canStartTask,
    getThemeProgress,
    retryCount: retryCountRef.current,
    lastUpdated,
    completedQuestsCount,
  };
};

export default useQuests;
