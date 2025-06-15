import { useState, useEffect, useCallback } from 'react';
import { 
  leaderboardApi, 
  LeaderboardData, 
  UserRankData, 
  LeaderboardFilters, 
  PaginationOptions 
} from '../api/leaderboardApi';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';

interface UseLeaderboardReturn {
  leaderboard: LeaderboardData | null;
  userRank: UserRankData | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshLeaderboard: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  applyFilters: (filters: LeaderboardFilters) => Promise<void>;
  
  // State
  currentPage: number;
  filters: LeaderboardFilters;
  hasNextPage: boolean;
}

export const useLeaderboard = (
  initialFilters: LeaderboardFilters = {},
  initialPagination: PaginationOptions = { page: 1, limit: 50 }
): UseLeaderboardReturn => {
  const { currentUser } = useAuth();
  const { showModal } = useModal();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [userRank, setUserRank] = useState<UserRankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [filters, setFilters] = useState<LeaderboardFilters>(initialFilters);
  const [pagination, setPagination] = useState<PaginationOptions>(initialPagination);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (
    newFilters: LeaderboardFilters = filters,
    newPagination: PaginationOptions = pagination
  ) => {
    try {
      setLoading(true);
      setError(null);

      const [leaderboardResponse, userRankResponse] = await Promise.all([
        leaderboardApi.getLeaderboard(newFilters, newPagination),
        currentUser ? leaderboardApi.getUserRank(currentUser.uid) : Promise.resolve(null)
      ]);

      if (leaderboardResponse.success && leaderboardResponse.data) {
        setLeaderboard(leaderboardResponse.data);
      } else {
        throw new Error(leaderboardResponse.message || 'Failed to fetch leaderboard');
      }

      if (userRankResponse && userRankResponse.success && userRankResponse.data) {
        setUserRank(userRankResponse.data);
      }

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      showModal({
        title: "Leaderboard Loading Error",
        message: "We couldn't load the leaderboard. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters, pagination, showModal]);

  // Load specific page
  const loadPage = useCallback(async (page: number) => {
    const newPagination = { ...pagination, page };
    setPagination(newPagination);
    setCurrentPage(page);
    await fetchLeaderboard(filters, newPagination);
  }, [fetchLeaderboard, filters, pagination]);

  // Apply filters
  const applyFilters = useCallback(async (newFilters: LeaderboardFilters) => {
    setFilters(newFilters);
    const resetPagination = { ...pagination, page: 1 };
    setPagination(resetPagination);
    setCurrentPage(1);
    await fetchLeaderboard(newFilters, resetPagination);
  }, [fetchLeaderboard, pagination]);

  // Refresh leaderboard
  const refreshLeaderboard = useCallback(async () => {
    await fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Calculate if there's a next page
  const hasNextPage = leaderboard ? 
    (currentPage * pagination.limit) < leaderboard.totalPlayers : 
    false;

  return {
    leaderboard,
    userRank,
    loading,
    error,
    refreshLeaderboard,
    loadPage,
    applyFilters,
    currentPage,
    filters,
    hasNextPage
  };
};

export default useLeaderboard;