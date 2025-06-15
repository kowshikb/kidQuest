import { useState, useEffect, useCallback, useRef } from 'react';
import { questsApi, QuestTheme, UserQuestProgress, QuestApiResponse } from '../api/questsApi';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useSound } from '../contexts/SoundContext';

interface UseQuestsOptions {
  category?: string;
  difficulty?: string;
  includeInactive?: boolean;
  enableRealTimeUpdates?: boolean;
}

interface UseQuestsReturn {
  themes: QuestTheme[];
  userProgress: UserQuestProgress | null;
  loading: boolean;
  error: string | null;
  refreshQuests: () => Promise<void>;
  completeTask: (taskId: string, themeId: string, coinsEarned: number, completionData?: any) => Promise<boolean>;
  isTaskCompleted: (taskId: string) => boolean;
  canStartTask: (taskId: string, prerequisites?: string[]) => boolean;
  getThemeProgress: (themeId: string) => { completed: number; total: number; percentage: number };
  retryCount: number;
  lastUpdated: string | null;
}

export const useQuests = (options: UseQuestsOptions = {}): UseQuestsReturn => {
  const { currentUser } = useAuth();
  const { showModal } = useModal();
  const { playSound } = useSound();
  
  const [themes, setThemes] = useState<QuestTheme[]>([]);
  const [userProgress, setUserProgress] = useState<UserQuestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;
  const retryDelay = 1000; // Start with 1 second

  // Fetch quests from API
  const fetchQuests = useCallback(async (isRetry = false) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      const response = await questsApi.getQuests({
        userId: currentUser.uid,
        category: options.category,
        difficulty: options.difficulty,
        includeInactive: options.includeInactive
      });

      if (response.success && response.data) {
        setThemes(response.data.themes || []);
        setUserProgress(response.data.userProgress || null);
        setLastUpdated(response.data.metadata?.lastUpdated || new Date().toISOString());
        setError(null);
        setRetryCount(0);
        
        // Clear any pending retry
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      } else {
        throw new Error(response.message || 'Failed to fetch quests');
      }
    } catch (err) {
      console.error('Error fetching quests:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      if (retryCount < maxRetries) {
        // Exponential backoff retry
        const delay = retryDelay * Math.pow(2, retryCount);
        setRetryCount(prev => prev + 1);
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchQuests(true);
        }, delay);
        
        setError(`Connection issue. Retrying in ${delay / 1000}s... (${retryCount + 1}/${maxRetries})`);
      } else {
        setError(errorMessage);
        setRetryCount(0);
        
        // Show user-friendly error modal
        showModal({
          title: "Quest Loading Error",
          message: "We're having trouble loading your quests. Please check your connection and try again.",
          type: "error",
          confirmText: "Retry",
          onConfirm: () => {
            setRetryCount(0);
            fetchQuests();
          }
        });
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, options.category, options.difficulty, options.includeInactive, retryCount, showModal]);

  // Set up real-time updates
  useEffect(() => {
    if (!currentUser || !options.enableRealTimeUpdates) return;

    const unsubscribe = questsApi.subscribeToQuestUpdates(
      currentUser.uid,
      (data) => {
        if (data.error) {
          console.error('Real-time update error:', data.error);
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
  const completeTask = useCallback(async (
    taskId: string, 
    themeId: string, 
    coinsEarned: number, 
    completionData?: any
  ): Promise<boolean> => {
    if (!currentUser) {
      showModal({
        title: "Authentication Required",
        message: "Please log in to complete tasks.",
        type: "warning"
      });
      return false;
    }

    try {
      playSound('click');

      const response = await questsApi.updateTaskCompletion({
        userId: currentUser.uid,
        taskId,
        themeId,
        coinsEarned,
        completionData
      });

      if (response.success) {
        playSound('complete');
        
        // Update local state immediately for better UX
        setUserProgress(prev => prev ? {
          ...prev,
          completedTasks: [...prev.completedTasks, taskId],
          totalCoinsEarned: prev.totalCoinsEarned + coinsEarned,
          totalTasksCompleted: prev.totalTasksCompleted + 1
        } : null);

        // Show success message
        showModal({
          title: "Quest Completed! 🎉",
          message: response.message || `Great job! You earned ${coinsEarned} coins.`,
          type: "success"
        });

        // Refresh data to ensure consistency
        await fetchQuests();
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to complete task');
      }
    } catch (err) {
      console.error('Error completing task:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      showModal({
        title: "Task Completion Failed",
        message: errorMessage,
        type: "error"
      });
      
      return false;
    }
  }, [currentUser, showModal, playSound, fetchQuests]);

  // Helper functions
  const isTaskCompleted = useCallback((taskId: string): boolean => {
    return userProgress?.completedTasks.includes(taskId) || false;
  }, [userProgress]);

  const canStartTask = useCallback((taskId: string, prerequisites?: string[]): boolean => {
    if (!prerequisites || prerequisites.length === 0) return true;
    if (!userProgress) return false;
    
    return prerequisites.every(prereqId => 
      userProgress.completedTasks.includes(prereqId)
    );
  }, [userProgress]);

  const getThemeProgress = useCallback((themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme || !userProgress) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = theme.tasks.filter(task => 
      userProgress.completedTasks.includes(task.id)
    ).length;
    const total = theme.tasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }, [themes, userProgress]);

  const refreshQuests = useCallback(async () => {
    setRetryCount(0);
    await fetchQuests();
  }, [fetchQuests]);

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
    retryCount,
    lastUpdated
  };
};

export default useQuests;