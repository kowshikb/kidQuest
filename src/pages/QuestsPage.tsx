import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Award,
  BookOpen,
  Clock,
  Star,
  ChevronRight,
  Filter,
  Grid3X3,
  List,
  Search,
  Users,
  Trophy,
  Sparkles,
  Map,
  RefreshCw,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";
import { useQuests } from "../hooks/useQuests";
import { useAppStats } from "../hooks/useAppStats";
import { QuestTheme, QuestTask } from "../api/questsApi";
import EnhancedQuestFilters from "../components/EnhancedQuestFilters";
import QuestCard from "../components/QuestCard";
import UnifiedLoader from "../components/UnifiedLoader";
import UnifiedBackground from "../components/UnifiedBackground";
import Pagination from "../components/Pagination";
import KidFriendlyLoader from "../components/KidFriendlyLoader";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  isLoading?: boolean;
}

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
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mr-2"></div>
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

const QuestsPage: React.FC = () => {
  // Filter and pagination states
  const [filters, setFilters] = useState<any>({});
  const [currentView, setCurrentView] = useState<"grid" | "list">("grid");
  const [currentSort, setCurrentSort] = useState<string>("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedTheme, setSelectedTheme] = useState<QuestTheme | null>(null);

  // ✅ PERFORMANCE FIX: Memoize quest options to prevent unnecessary re-renders
  const questOptions = useMemo(() => {
    const [sortBy, sortDirection] = currentSort.split("-");
    return {
      ...filters,
      sortBy,
      sortDirection: sortDirection as "asc" | "desc",
      // ✅ FIX: Map searchTerm to search parameter for API compatibility
      search: filters.searchTerm || undefined,
      // Remove searchTerm to avoid confusion in API
      searchTerm: undefined,
    };
  }, [filters, currentSort]);

  // ✅ PERFORMANCE FIX: Connect to the useQuests hook with stable options and faster loading
  const { themes, userProgress, loading, error, completeTask, refreshQuests } =
    useQuests(questOptions);

  const stats = useAppStats();
  const { refresh: refreshStats } = stats;

  // ✅ PERFORMANCE FIX: Early loading state with instant feedback
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading && initialLoad) {
      setInitialLoad(false);
    }
  }, [loading, initialLoad]);

  const handleCompleteTask = async (
    taskId: string,
    themeId: string,
    coinReward: number
  ) => {
    const success = await completeTask(taskId, themeId, coinReward);
    if (success) {
      console.log("🔄 Refreshing quest stats after task completion...");
      await refreshStats();
      console.log("✅ Quest stats refreshed successfully");
    }
  };

  // ✅ FIX: Apply client-side search filtering for accurate count
  const filteredThemes = useMemo(() => {
    if (!filters.searchTerm) return themes;

    const searchLower = filters.searchTerm.toLowerCase();
    return themes.filter((theme) => {
      const nameMatch = theme.name?.toLowerCase().includes(searchLower);
      const descriptionMatch = theme.description
        ?.toLowerCase()
        .includes(searchLower);
      const categoryMatch = theme.category?.toLowerCase().includes(searchLower);
      return nameMatch || descriptionMatch || categoryMatch;
    });
  }, [themes, filters.searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredThemes.length / itemsPerPage);
  const paginatedThemes = filteredThemes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSelectTheme = (theme: QuestTheme) => {
    setSelectedTheme(theme);
  };

  const handleCloseDetail = () => {
    setSelectedTheme(null);
  };

  // ✅ PERFORMANCE FIX: Show optimistic loading only on initial load, faster subsequent loads
  if (initialLoad && loading) {
    return (
      <UnifiedLoader
        title="Loading Your Quests"
        subtitle="Finding the perfect adventures for you!"
        showProgress={true}
      />
    );
  }

  // ✅ PERFORMANCE FIX: Better error handling with retry options
  if (error && !loading) {
    return (
      <UnifiedBackground>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md mx-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-red-500 text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Quest Loading Failed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <motion.button
                onClick={refreshQuests}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
              <motion.button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Refresh Page
              </motion.button>
            </div>
          </motion.div>
        </div>
      </UnifiedBackground>
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
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Quest Adventures
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Embark on magical learning journeys! Complete quests to unlock new
            skills, earn rewards, and level up your knowledge.
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
            icon={<Target className="w-8 h-8 text-indigo-500" />}
            label="Available Quests"
            value={stats.availableQuests}
            isLoading={stats.loading.quests}
          />
          <StatCard
            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
            label="Quests Completed"
            value={stats.completedQuests}
            isLoading={stats.loading.quests}
          />
          <StatCard
            icon={<Sparkles className="w-8 h-8 text-yellow-500" />}
            label="Coins from Quests"
            value={stats.coinsFromQuests}
            isLoading={stats.loading.quests}
          />
          <StatCard
            icon={<Zap className="w-8 h-8 text-purple-500" />}
            label="Tasks Completed"
            value={`${stats.questTasksCompleted} / ${stats.totalQuestTasks}`}
            isLoading={stats.loading.quests}
          />
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <EnhancedQuestFilters
            onFilterChange={handleFilterChange}
            onViewChange={setCurrentView}
            onSortChange={(sort) => setCurrentSort(`${sort}-asc`)}
            activeFilters={filters}
            currentView={currentView}
            currentSort={currentSort.split("-")[0]}
            totalItems={filteredThemes.length}
            className="mb-8"
          />
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
              >
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded-lg flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded-lg flex-1"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results State */}
        {filteredThemes.length === 0 && !loading && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">
              {filters.searchTerm ? "🔍" : "🗺️"}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {filters.searchTerm
                ? `No quests found for "${filters.searchTerm}"`
                : "No quests found"}
            </h3>
            <p className="text-gray-600 mb-6">
              {filters.searchTerm
                ? "Try searching with different keywords or check your spelling!"
                : "Try adjusting your filters to discover more amazing quests!"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {filters.searchTerm && (
                <motion.button
                  onClick={() => {
                    setFilters({ ...filters, searchTerm: null });
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear Search
                </motion.button>
              )}
              <motion.button
                onClick={() => setFilters({})}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear All Filters
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Quest Grid/List */}
        {!loading && paginatedThemes.length > 0 && (
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
              <AnimatePresence>
                {!loading &&
                  paginatedThemes.map((theme) => (
                    <motion.div
                      key={theme.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <QuestCard
                        theme={theme}
                        completedTasks={userProgress?.completedTasks || []}
                        onCompleteTask={(task) =>
                          handleCompleteTask(task.id, theme.id, task.coinReward)
                        }
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
                totalItems={themes.length}
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

export default QuestsPage;
