import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Trophy, 
  Target, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import { QuestProvider, useQuestContext } from '../contexts/QuestContext';
import QuestCard from '../components/QuestCard';
import QuestFilters from '../components/QuestFilters';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';

const QuestsPageContent: React.FC = () => {
  const { 
    themes, 
    userProgress, 
    loading, 
    error, 
    refreshQuests, 
    filterThemes,
    retryCount,
    lastUpdated 
  } = useQuestContext();
  const { userProfile } = useAuth();
  const { playSound } = useSound();

  const [filters, setFilters] = useState({
    category: null as string | null,
    difficulty: null as string | null,
    searchTerm: null as string | null
  });

  const [filteredThemes, setFilteredThemes] = useState(themes);

  // Update filtered themes when themes or filters change
  useEffect(() => {
    const filtered = filterThemes(filters.category, filters.difficulty, filters.searchTerm);
    setFilteredThemes(filtered);
  }, [themes, filters, filterThemes]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleRefresh = async () => {
    playSound('click');
    await refreshQuests();
  };

  // Calculate overall progress
  const overallProgress = userProgress ? {
    totalTasks: themes.reduce((sum, theme) => sum + theme.totalTasks, 0),
    completedTasks: userProgress.totalTasksCompleted,
    totalRewards: themes.reduce((sum, theme) => sum + theme.totalRewards, 0),
    earnedRewards: userProgress.totalCoinsEarned,
    completionPercentage: themes.reduce((sum, theme) => sum + theme.totalTasks, 0) > 0 
      ? (userProgress.totalTasksCompleted / themes.reduce((sum, theme) => sum + theme.totalTasks, 0)) * 100 
      : 0
  } : null;

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-purple-900 mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Magical Quests
        </motion.h1>
        <motion.p
          className="text-purple-600"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Embark on epic learning adventures and earn legendary rewards!
        </motion.p>
      </div>

      {/* Overall Progress Stats */}
      {overallProgress && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-purple-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                <Target size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Tasks Completed</p>
                <p className="text-xl font-bold text-purple-900">
                  {overallProgress.completedTasks}/{overallProgress.totalTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-purple-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 2a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-yellow-600">Coins Earned</p>
                <p className="text-xl font-bold text-yellow-700">
                  {overallProgress.earnedRewards}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-purple-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600">Progress</p>
                <p className="text-xl font-bold text-green-700">
                  {overallProgress.completionPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-purple-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                <Trophy size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-indigo-600">Available Quests</p>
                <p className="text-xl font-bold text-indigo-700">
                  {themes.length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <QuestFilters
          onFilterChange={handleFilterChange}
          activeFilters={filters}
        />
      </motion.div>

      {/* Status Bar */}
      <motion.div
        className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl shadow-md border-2 border-purple-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-purple-600">
            <Sparkles size={18} className="mr-2" />
            <span className="font-medium">
              {filteredThemes.length} quest{filteredThemes.length !== 1 ? 's' : ''} available
            </span>
          </div>
          
          {lastUpdated && (
            <div className="flex items-center text-gray-500 text-sm">
              <Clock size={14} className="mr-1" />
              <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {retryCount > 0 && (
            <div className="flex items-center text-orange-600 text-sm">
              <AlertCircle size={16} className="mr-1" />
              <span>Retrying... ({retryCount}/3)</span>
            </div>
          )}
          
          <motion.button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Refresh quests"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center">
            <AlertCircle size={24} className="text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-red-800">Quest Loading Error</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && themes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-purple-800">Loading your magical quests...</p>
        </div>
      )}

      {/* Quests Grid */}
      {!loading && filteredThemes.length === 0 && !error ? (
        <div className="text-center py-12">
          <div className="inline-block p-4 rounded-full bg-purple-100 mb-4">
            <Sparkles size={32} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-purple-900 mb-2">No Quests Found</h3>
          <p className="text-purple-600 mb-6">
            {Object.values(filters).some(Boolean) 
              ? "Try adjusting your search or filters to find more quests!"
              : "No quests are available right now. Check back soon for new adventures!"
            }
          </p>
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters({ category: null, difficulty: null, searchTerm: null })}
              className="px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {filteredThemes.map((theme, index) => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <QuestCard theme={theme} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

const QuestsPage: React.FC = () => {
  return (
    <QuestProvider enableRealTimeUpdates={true}>
      <QuestsPageContent />
    </QuestProvider>
  );
};

export default QuestsPage;