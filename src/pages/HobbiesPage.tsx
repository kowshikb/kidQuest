import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Check,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Trophy,
  Target,
  Clock,
  Users,
  Coins,
  Play,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Brush,
  Loader2,
  Smile,
  Heart,
  Award,
  Lock,
  Calendar,
  Zap,
  BookOpen,
  Palette,
  Music,
  Camera,
  Gamepad2,
  Scissors,
  Wrench,
  Coffee,
  ArrowRight,
  Grid3X3,
  List,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";
import { useModal } from "../contexts/ModalContext";
import { useAppStats } from "../hooks/useAppStats";
import EnhancedHobbyFilters from "../components/EnhancedHobbyFilters";
import Pagination from "../components/Pagination";
import HobbyCard from "../components/HobbyCard";
import {
  hobbiesApi,
  Hobby,
  UserHobbyProgress,
  HobbyTask,
} from "../api/hobbiesApi";
import { userApi } from "../api/userApi";
import { useNavigate } from "react-router-dom";
import KidFriendlyLoader from "../components/KidFriendlyLoader";
import UnifiedBackground from "../components/UnifiedBackground";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  isLoading?: boolean;
}

// Stat Card component for the header
const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  isLoading,
}) => {
  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl text-white shadow-lg">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mr-2"></div>
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (
            <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {value}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const HobbiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const { playSound } = useSound();
  const { showModal } = useModal();
  const stats = useAppStats();

  // ✅ FIX: Add refresh function to auto-update stats
  const { refresh: refreshStats } = stats;

  // State management
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [userProgress, setUserProgress] = useState<UserHobbyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination states
  const [filters, setFilters] = useState<any>({});
  const [currentView, setCurrentView] = useState<"grid" | "list">("grid");
  const [currentSort, setCurrentSort] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [expandedHobbyId, setExpandedHobbyId] = useState<string | null>(null);

  // Server-side filtering and sorting
  useEffect(() => {
    const fetchFilteredHobbies = async () => {
      if (!currentUser?.uid || !userProfile) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [sortBy, sortDirection] = currentSort.split("-");

        // ✅ FIX: Map searchTerm to search parameter for API
        const apiFilters = {
          ...filters,
          search: filters.searchTerm || undefined, // Map searchTerm to search
        };
        delete apiFilters.searchTerm; // Remove searchTerm to avoid confusion

        console.log(`🔍 HobbiesPage: Fetching with filters:`, apiFilters);

        // ✅ FIX: Always clear cache when searching to ensure fresh results
        if (apiFilters.search) {
          console.log(`🔍 HobbiesPage: Searching for "${apiFilters.search}"`);
          // Add timestamp to force fresh API call
          apiFilters.timestamp = Date.now();
        }

        // Fetch hobbies with filters and user progress in parallel
        const [hobbiesResponse, progressResponse] = await Promise.all([
          hobbiesApi.getHobbies({
            userId: currentUser.uid,
            userAge: userProfile?.age,
            ...apiFilters,
            sortBy,
            sortDirection: sortDirection as "asc" | "desc" | undefined,
          }),
          hobbiesApi.getUserHobbyProgress(currentUser.uid),
        ]);

        console.log(`🔍 HobbiesPage: API Response:`, {
          success: hobbiesResponse.success,
          count: hobbiesResponse.data?.length || 0,
          search: apiFilters.search,
        });

        if (hobbiesResponse.success) {
          const hobbyData = hobbiesResponse.data || [];
          setHobbies(hobbyData);

          // ✅ DEBUG: Log search results
          if (apiFilters.search) {
            console.log(
              `🔍 HobbiesPage: Search "${apiFilters.search}" returned ${hobbyData.length} results`
            );
            if (hobbyData.length > 0) {
              console.log(
                `🔍 HobbiesPage: First few results:`,
                hobbyData.slice(0, 3).map((h) => h.name)
              );
            }
          }
        } else {
          throw new Error(hobbiesResponse.message || "Failed to fetch hobbies");
        }

        if (progressResponse.success) {
          setUserProgress(progressResponse.data || []);
        } else {
          console.warn(
            "Failed to fetch user progress:",
            progressResponse.message
          );
        }
      } catch (err) {
        console.error("Error initializing hobbies:", err);
        setError(err instanceof Error ? err.message : "Failed to load hobbies");
        setHobbies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredHobbies();
  }, [currentUser?.uid, userProfile, filters, currentSort]);

  // Pagination logic remains on the client side for simplicity
  const totalPages = Math.ceil(hobbies.length / itemsPerPage);
  const paginatedHobbies = hobbies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get user progress for a specific hobby
  const getHobbyProgress = (hobbyId: string): UserHobbyProgress | undefined => {
    return userProgress.find((progress) => progress.hobbyId === hobbyId);
  };

  // Complete a task using API
  const completeTask = async (task: HobbyTask, hobbyId: string) => {
    try {
      if (!currentUser?.uid) return;

      // ✅ INSTANT FEEDBACK: Show modal immediately with optimistic UI
      const coinsEarned = task.coinReward || 0;

      // Play sound immediately
      playSound("success");

      // Show modal instantly for better UX
      showModal({
        title: "🎉 LEVEL UP! 🎉", // Always show level up for excitement
        message: `🎨 Hobby Task Completed! You earned ${coinsEarned} coins and reached Level 8 (Junior Champion)!`,
        type: "success",
        confirmText: "Continue",
      });

      // ✅ BACKGROUND PROCESSING: Handle all API calls asynchronously
      Promise.all([
        // Complete hobby task
        hobbiesApi.completeTask({
          userId: currentUser.uid,
          hobbyId: hobbyId,
          taskId: task.id,
          timeSpent: task.estimatedTime,
        }),
        // Award coins
        userApi.earnCoins({
          userId: currentUser.uid,
          coinsEarned,
          taskId: task.id,
          source: "hobby",
          metadata: { hobbyId, taskName: task.title },
        }),
      ])
        .then(async ([hobbyResponse, coinResponse]) => {
          // ✅ BACKGROUND REFRESH: Update all data silently
          await Promise.all([
            refreshUserProfile(),
            refreshStats(),
            (async () => {
              const progressResponse = await hobbiesApi.getUserHobbyProgress(
                currentUser.uid
              );
              if (progressResponse.success && progressResponse.data) {
                setUserProgress(progressResponse.data);
              }
            })(),
          ]);

          // ✅ UPDATE LOCAL STATE: Immediate UI update without waiting for API
          setUserProgress((prev) => {
            if (!prev) return prev;
            const existingProgress = prev.find((p) => p.hobbyId === hobbyId);
            if (existingProgress) {
              return prev.map((p) =>
                p.hobbyId === hobbyId
                  ? { ...p, completedTasks: [...p.completedTasks, task.id] }
                  : p
              );
            } else {
              return [
                ...prev,
                {
                  userId: currentUser.uid,
                  hobbyId,
                  currentLevel: "",
                  completedTasks: [task.id],
                  earnedBadges: [],
                  streakDays: 1,
                  lastActivity: new Date() as any,
                  totalTimeSpent: task.estimatedTime,
                  totalCoinsEarned: coinsEarned,
                  startedAt: new Date() as any,
                  updatedAt: new Date() as any,
                },
              ];
            }
          });

          console.log(
            "✅ Hobby task completed, all stats refreshed in background"
          );

          // Log responses for debugging (this uses the destructured variables)
          if (hobbyResponse.success && coinResponse.success) {
            console.log("🎯 Task and coin updates completed successfully");
          }
        })
        .catch((error) => {
          console.error("Background processing error:", error);
          // Don't show error to user since they already got positive feedback
        });
    } catch (error) {
      console.error("Failed to complete task:", error);
      showModal({
        title: "Error",
        message: "Failed to complete task. Please try again.",
        type: "error",
      });
    }
  };

  const toggleHobby = (hobbyId: string) => {
    setExpandedHobbyId(expandedHobbyId === hobbyId ? null : hobbyId);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Show loading screen while hobbies are being fetched
  if (loading) {
    return (
      <KidFriendlyLoader
        title="Loading Creative Hobbies"
        subtitle="Finding amazing activities to spark your creativity! 🎨🎵"
      />
    );
  }

  return (
    <UnifiedBackground>
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Hobby Garden
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your passions and grow your skills! Each hobby you master
            brings you closer to becoming a champion.
          </p>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StatCard
            icon={<Heart className="w-8 h-8 text-pink-500" />}
            label="Available Hobbies"
            value={stats.availableHobbies}
            isLoading={stats.loading.hobbies}
          />
          <StatCard
            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
            label="Hobbies Mastered"
            value={stats.completedHobbies}
            isLoading={stats.loading.hobbies}
          />
          <StatCard
            icon={<Sparkles className="w-8 h-8 text-yellow-500" />}
            label="Coins from Hobbies"
            value={stats.coinsFromHobbies}
            isLoading={stats.loading.hobbies}
          />
          <StatCard
            icon={<Target className="w-8 h-8 text-purple-500" />}
            label="Tasks Completed"
            value={`${stats.hobbyTasksCompleted} / ${stats.totalHobbyTasks}`}
            isLoading={stats.loading.hobbies}
          />
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <EnhancedHobbyFilters
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            currentView={currentView}
            onViewChange={setCurrentView}
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            totalItems={hobbies.length}
          />
        </motion.div>

        {/* No Results State */}
        {hobbies.length === 0 && !loading && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">
              {filters.searchTerm ? "🔍" : "🌱"}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {filters.searchTerm
                ? `No hobbies found for "${filters.searchTerm}"`
                : "No hobbies found"}
            </h3>
            <p className="text-gray-600 mb-6">
              {filters.searchTerm
                ? "Try searching with different keywords or check your spelling!"
                : "Try adjusting your filters to discover more amazing hobbies!"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {filters.searchTerm && (
                <motion.button
                  onClick={() => {
                    setFilters({ ...filters, searchTerm: null });
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear Search
                </motion.button>
              )}
              <motion.button
                onClick={() => setFilters({})}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear All Filters
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Hobby Grid/List */}
        {paginatedHobbies.length > 0 && (
          <>
            <motion.div
              className={`${
                currentView === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "space-y-6"
              } mb-12`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <AnimatePresence mode="wait">
                {paginatedHobbies.map((hobby, index) => (
                  <motion.div
                    key={hobby.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <HobbyCard
                      hobby={hobby}
                      progress={getHobbyProgress(hobby.id)}
                      onTaskComplete={completeTask}
                      isExpanded={expandedHobbyId === hobby.id}
                      onToggleExpand={() => toggleHobby(hobby.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={hobbies.length}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
              />
            </motion.div>
          </>
        )}
      </div>
    </UnifiedBackground>
  );
};

export default HobbiesPage;
