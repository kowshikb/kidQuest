import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';

interface QuestFiltersProps {
  onFilterChange: (filters: {
    category?: string | null;
    difficulty?: string | null;
    searchTerm?: string | null;
  }) => void;
  activeFilters: {
    category?: string | null;
    difficulty?: string | null;
    searchTerm?: string | null;
  };
  className?: string;
}

const QuestFilters: React.FC<QuestFiltersProps> = ({
  onFilterChange,
  activeFilters,
  className = ''
}) => {
  const { playSound } = useSound();
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(activeFilters.searchTerm || '');

  const categories = [
    'All',
    'Math',
    'Science',
    'Language',
    'Art',
    'Social-Emotional',
    'Life Skills',
    'Academics',
    'Creative Arts',
    'Community',
    'Health'
  ];

  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const handleCategoryFilter = (category: string) => {
    playSound('click');
    onFilterChange({
      ...activeFilters,
      category: category === 'All' ? null : category
    });
    setIsFilterMenuOpen(false);
  };

  const handleDifficultyFilter = (difficulty: string) => {
    playSound('click');
    onFilterChange({
      ...activeFilters,
      difficulty: difficulty === 'All' ? null : difficulty
    });
    setIsFilterMenuOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFilterChange({
      ...activeFilters,
      searchTerm: value || null
    });
  };

  const clearFilter = (filterType: 'category' | 'difficulty' | 'searchTerm') => {
    playSound('click');
    if (filterType === 'searchTerm') {
      setSearchTerm('');
    }
    onFilterChange({
      ...activeFilters,
      [filterType]: null
    });
  };

  const clearAllFilters = () => {
    playSound('click');
    setSearchTerm('');
    onFilterChange({
      category: null,
      difficulty: null,
      searchTerm: null
    });
    setIsFilterMenuOpen(false);
  };

  const toggleFilterMenu = () => {
    playSound('click');
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  const hasActiveFilters = activeFilters.category || activeFilters.difficulty || activeFilters.searchTerm;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-300"
            placeholder="Search magical quests..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              onClick={() => clearFilter('searchTerm')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter Menu Button */}
        <div className="relative">
          <motion.button
            onClick={toggleFilterMenu}
            className={`flex items-center justify-center px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
              hasActiveFilters
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white border-2 border-purple-200 text-purple-600 hover:border-purple-300'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter size={18} className="mr-2" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-2 bg-white bg-opacity-20 text-xs px-2 py-0.5 rounded-full">
                {[activeFilters.category, activeFilters.difficulty, activeFilters.searchTerm].filter(Boolean).length}
              </span>
            )}
            <motion.div
              animate={{ rotate: isFilterMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="ml-2"
            >
              <ChevronDown size={18} />
            </motion.div>
          </motion.button>

          {/* Filter Dropdown */}
          <AnimatePresence>
            {isFilterMenuOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl z-30 p-6 border-2 border-purple-100"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* Category Filter */}
                <div className="mb-6">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Category
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(category => (
                      <motion.button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          (category === 'All' && !activeFilters.category) || 
                          category === activeFilters.category
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {category}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div className="mb-6">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Difficulty
                  </h3>
                  <div className="flex gap-2">
                    {difficulties.map(difficulty => (
                      <motion.button
                        key={difficulty}
                        onClick={() => handleDifficultyFilter(difficulty)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          (difficulty === 'All' && !activeFilters.difficulty) || 
                          difficulty === activeFilters.difficulty
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {difficulty}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <motion.button
                    onClick={clearAllFilters}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear All Filters
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-sm text-purple-600 font-medium">Active Filters:</span>

          {activeFilters.category && (
            <motion.span
              className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              Category: {activeFilters.category}
              <button
                onClick={() => clearFilter('category')}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                <X size={14} />
              </button>
            </motion.span>
          )}

          {activeFilters.difficulty && (
            <motion.span
              className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              Difficulty: {activeFilters.difficulty}
              <button
                onClick={() => clearFilter('difficulty')}
                className="ml-2 text-orange-600 hover:text-orange-800"
              >
                <X size={14} />
              </button>
            </motion.span>
          )}

          {activeFilters.searchTerm && (
            <motion.span
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              Search: "{activeFilters.searchTerm}"
              <button
                onClick={() => clearFilter('searchTerm')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X size={14} />
              </button>
            </motion.span>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default QuestFilters;