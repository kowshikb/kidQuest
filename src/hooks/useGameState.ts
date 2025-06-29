import { useState, useEffect, useCallback, useRef } from "react";
import { gameStateApi, GameState, ApiResponse } from "../api/gameStateApi";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";

interface UseGameStateOptions {
  enableRealTimeUpdates?: boolean;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
}

interface UseGameStateReturn {
  gameState: GameState | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  refreshGameState: () => Promise<void>;
  syncChanges: (changes: Partial<GameState>) => Promise<boolean>;

  // State helpers
  isNewUser: boolean;
  hasCompletedTutorial: boolean;
  currentLevel: number;
  totalCoins: number;
  unreadNotifications: number;

  // Retry mechanism
  retryCount: number;
  isRetrying: boolean;
}

export const useGameState = (
  options: UseGameStateOptions = {}
): UseGameStateReturn => {
  const { currentUser } = useAuth();
  const { showModal } = useModal();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    enableRealTimeUpdates = true,
    autoSync = true,
    syncInterval = 30000, // 30 seconds
  } = options;

  const maxRetries = 3;
  const retryDelay = 1000; // Start with 1 second

  // Fetch initial game state
  const fetchGameState = useCallback(
    async (isRetry = false) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        if (!isRetry) {
          setLoading(true);
          setError(null);
        } else {
          setIsRetrying(true);
        }

        const response = await gameStateApi.getInitialGameState(
          currentUser.uid
        );

        if (response.success && response.data) {
          setGameState(response.data);
          setLastUpdated(response.timestamp);
          setError(null);
          setRetryCount(0);

          // Clear any pending retry
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        } else {
          throw new Error(response.message || "Failed to fetch game state");
        }
      } catch (err) {
        console.error("Error fetching game state:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";

        if (retryCount < maxRetries) {
          // Exponential backoff retry
          const delay = retryDelay * Math.pow(2, retryCount);
          setRetryCount((prev) => prev + 1);

          retryTimeoutRef.current = setTimeout(() => {
            fetchGameState(true);
          }, delay);

          setError(
            `Connection issue. Retrying in ${delay / 1000}s... (${
              retryCount + 1
            }/${maxRetries})`
          );
        } else {
          setError(errorMessage);
          setRetryCount(0);

          // Show user-friendly error modal
          showModal({
            title: "Game State Loading Error",
            message:
              "We're having trouble loading your game data. Please check your connection and try again.",
            type: "error",
            confirmText: "Retry",
            onConfirm: () => {
              setRetryCount(0);
              fetchGameState();
            },
          });
        }
      } finally {
        setLoading(false);
        setIsRetrying(false);
      }
    },
    [currentUser, retryCount, showModal]
  );

  // Set up real-time updates
  useEffect(() => {
    if (!currentUser || !enableRealTimeUpdates) return;

    const unsubscribe = gameStateApi.subscribeToGameState(
      currentUser.uid,
      (updatedGameState) => {
        setGameState(updatedGameState);
        setLastUpdated(new Date().toISOString());
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser, enableRealTimeUpdates]);

  // Set up auto-sync
  useEffect(() => {
    if (!autoSync || !currentUser || !gameState) return;

    const syncData = async () => {
      try {
        await gameStateApi.syncGameState(currentUser.uid, gameState);
      } catch (error) {
        console.warn("Auto-sync failed:", error);
      }
    };

    syncTimeoutRef.current = setInterval(syncData, syncInterval);

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [autoSync, currentUser, gameState, syncInterval]);

  // Initial fetch
  useEffect(() => {
    fetchGameState();
  }, [fetchGameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Sync changes to backend
  const syncChanges = useCallback(
    async (changes: Partial<GameState>): Promise<boolean> => {
      if (!currentUser) {
        console.warn("Cannot sync changes: user not authenticated");
        return false;
      }

      try {
        const response = await gameStateApi.syncGameState(
          currentUser.uid,
          changes
        );

        if (response.success) {
          // Update local state optimistically
          setGameState((prev) => (prev ? { ...prev, ...changes } : null));
          setLastUpdated(response.timestamp);
          return true;
        } else {
          console.error("Sync failed:", response.message);
          return false;
        }
      } catch (error) {
        console.error("Error syncing changes:", error);
        return false;
      }
    },
    [currentUser]
  );

  // Refresh game state manually
  const refreshGameState = useCallback(async () => {
    setRetryCount(0);
    await fetchGameState();
  }, [fetchGameState]);

  // Derived state helpers
  const isNewUser = gameState?.user?.isNewUser || false;
  const hasCompletedTutorial = gameState?.user?.hasCompletedTutorial || false;
  const currentLevel = gameState?.user?.currentLevel || 1;
  const totalCoins = gameState?.user?.coins || 0;
  const unreadNotifications = gameState?.home?.unreadCount || 0;

  return {
    gameState,
    loading,
    error,
    lastUpdated,
    refreshGameState,
    syncChanges,
    isNewUser,
    hasCompletedTutorial,
    currentLevel,
    totalCoins,
    unreadNotifications,
    retryCount,
    isRetrying,
  };
};

export default useGameState;
