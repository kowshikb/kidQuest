import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Users,
  Target,
  Heart,
  Grid3X3,
  List,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useSound } from "../contexts/SoundContext";

interface EnhancedHobbyFiltersProps {
  onFilterChange: (filters: {
    category?: string | null;
    difficulty?: string | null;
    ageGroup?: string | null;
    searchTerm?: string | null;
  }) => void;
  onViewChange: (view: "grid" | "list") => void;
  onSortChange: (
    sort: "name" | "difficulty" | "age" | "popularity" | "recent"
  ) => void;
  activeFilters: {
    category?: string | null;
    difficulty?: string | null;
    ageGroup?: string | null;
    searchTerm?: string | null;
  };
  currentView: "grid" | "list";
  currentSort: string;
  totalItems: number;
  className?: string;
}

const EnhancedHobbyFilters: React.FC<EnhancedHobbyFiltersProps> = ({
  onFilterChange,
  onViewChange,
  onSortChange,
  activeFilters,
  currentView,
  currentSort,
  totalItems,
  className = "",
}) => {
  const { playSound } = useSound();
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(activeFilters.searchTerm || "");
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchTerm(activeFilters.searchTerm || "");
  }, [activeFilters.searchTerm]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced categories for hobbies
  const categories = [
    "All",
    "Art & Creative",
    "Music & Performance",
    "Literature & Language",
    "Sports & Fitness",
    "Mindful & Wellness",
    "STEM & Technology",
    "Outdoor & Adventure",
    "Life Skills & Practical",
  ];

  const difficulties = [
    "All",
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
  ];

  const ageGroups = [
    "All",
    "5-8 years",
    "9-12 years",
    "13-16 years",
    "17-25 years",
  ];

  const sortOptions = [
    { value: "name", label: "Name A-Z" },
    { value: "difficulty", label: "Difficulty" },
    { value: "age", label: "Age Group" },
    { value: "popularity", label: "Popularity" },
    { value: "recent", label: "Recently Added" },
  ];

  const handleCategoryFilter = (category: string) => {
    playSound("click");
    onFilterChange({
      ...activeFilters,
      category: category === "All" ? null : category,
    });
  };

  const handleDifficultyFilter = (difficulty: string) => {
    playSound("click");
    onFilterChange({
      ...activeFilters,
      difficulty: difficulty === "All" ? null : difficulty,
    });
  };

  const handleAgeGroupFilter = (ageGroup: string) => {
    playSound("click");
    onFilterChange({
      ...activeFilters,
      ageGroup: ageGroup === "All" ? null : ageGroup,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // ✅ IMPROVED: Clear previous timeout and show loading immediately
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // ✅ UX: Show searching state for better feedback
    setIsSearching(true);

    // ✅ PERFORMANCE: Debounce search with ref-based timeout
    searchTimeoutRef.current = setTimeout(() => {
      console.log(`🔍 HobbyFilters: Triggering search for "${value}"`);

      onFilterChange({
        ...activeFilters,
        searchTerm: value || null,
      });

      // ✅ UX: Hide loading after brief delay for smooth transition
      setTimeout(() => setIsSearching(false), 100);
    }, 300);
  };

  const clearFilter = (
    filterType: "category" | "difficulty" | "ageGroup" | "searchTerm"
  ) => {
    playSound("click");
    if (filterType === "searchTerm") {
      setSearchTerm("");
    }
    onFilterChange({
      ...activeFilters,
      [filterType]: null,
    });
  };

  const clearAllFilters = () => {
    playSound("click");
    setSearchTerm("");
    onFilterChange({
      category: null,
      difficulty: null,
      ageGroup: null,
      searchTerm: null,
    });
    setIsFilterMenuOpen(false);
  };

  const toggleFilterMenu = () => {
    playSound("click");
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  const handleViewChange = (view: "grid" | "list") => {
    playSound("click");
    onViewChange(view);
  };

  const handleSortChange = (sort: string) => {
    playSound("click");
    onSortChange(sort as any);
  };

  const hasActiveFilters =
    activeFilters.category ||
    activeFilters.difficulty ||
    activeFilters.ageGroup ||
    activeFilters.searchTerm;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Header with Results Count */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800">Hobby Garden</h2>
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full">
            <span className="text-sm font-semibold text-pink-800">
              {totalItems} Amazing Hobbies
            </span>
          </div>
        </div>

        {/* View and Sort Controls */}
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex bg-white rounded-xl border-2 border-gray-200 p-1">
            <button
              onClick={() => handleViewChange("grid")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentView === "grid"
                  ? "bg-pink-600 text-white shadow-md"
                  : "text-gray-600 hover:text-pink-600"
              }`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => handleViewChange("list")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentView === "list"
                  ? "bg-pink-600 text-white shadow-md"
                  : "text-gray-600 hover:text-pink-600"
              }`}
            >
              <List size={16} />
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-200 text-sm font-medium"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Enhanced Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <RefreshCw size={20} className="text-pink-500 animate-spin" />
            ) : (
              <Search size={20} className="text-gray-400" />
            )}
          </div>
          <input
            type="text"
            className={`w-full pl-12 pr-12 py-4 rounded-2xl border-2 transition-all duration-300 text-lg ${
              isSearching
                ? "border-pink-300 bg-pink-50 focus:border-pink-500"
                : "border-pink-200 focus:border-pink-500"
            } focus:ring focus:ring-pink-200 focus:ring-opacity-50`}
            placeholder={
              isSearching
                ? "Searching hobbies..."
                : "Discover amazing hobbies to explore..."
            }
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && !isSearching && (
            <button
              onClick={() => clearFilter("searchTerm")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          )}
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="text-xs text-pink-600 font-medium">
                Searching...
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Filter Menu Button */}
        <div className="relative">
          <motion.button
            onClick={toggleFilterMenu}
            className={`flex items-center justify-center px-8 py-4 rounded-2xl font-semibold transition-all duration-300 min-w-[140px] ${
              hasActiveFilters
                ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl"
                : "bg-white border-2 border-pink-200 text-pink-600 hover:border-pink-300 hover:shadow-lg"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <SlidersHorizontal size={20} className="mr-2" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-2 bg-white bg-opacity-25 text-xs px-2 py-1 rounded-full font-bold">
                {
                  [
                    activeFilters.category,
                    activeFilters.difficulty,
                    activeFilters.ageGroup,
                    activeFilters.searchTerm,
                  ].filter(Boolean).length
                }
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

          {/* Enhanced Filter Dropdown */}
          <AnimatePresence>
            {isFilterMenuOpen && (
              <motion.div
                className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl z-30 p-8 border border-gray-100"
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Category Filter */}
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                    <Heart className="w-5 h-5 text-pink-500 mr-2" />
                    Category
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {categories.map((category) => (
                      <motion.button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                          (category === "All" && !activeFilters.category) ||
                          category === activeFilters.category
                            ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg"
                            : "bg-pink-50 text-pink-800 hover:bg-pink-100 hover:shadow-md"
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
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                    <Target className="w-5 h-5 text-orange-500 mr-2" />
                    Skill Level
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {difficulties.map((difficulty) => (
                      <motion.button
                        key={difficulty}
                        onClick={() => handleDifficultyFilter(difficulty)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          (difficulty === "All" && !activeFilters.difficulty) ||
                          difficulty === activeFilters.difficulty
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                            : "bg-orange-50 text-orange-800 hover:bg-orange-100 hover:shadow-md"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {difficulty}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Age Group Filter */}
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                    <Users className="w-5 h-5 text-green-500 mr-2" />
                    Age Group
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ageGroups.map((ageGroup) => (
                      <motion.button
                        key={ageGroup}
                        onClick={() => handleAgeGroupFilter(ageGroup)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          (ageGroup === "All" && !activeFilters.ageGroup) ||
                          ageGroup === activeFilters.ageGroup
                            ? "bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg"
                            : "bg-green-50 text-green-800 hover:bg-green-100 hover:shadow-md"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {ageGroup}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <motion.button
                    onClick={clearAllFilters}
                    className="w-full px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 text-sm font-semibold flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw size={16} className="mr-2" />
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
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-sm text-pink-600 font-semibold flex items-center">
            <Filter size={16} className="mr-1" />
            Active Filters:
          </span>

          {activeFilters.category && (
            <motion.span
              className="bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 px-4 py-2 rounded-full text-sm flex items-center font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Heart size={14} className="mr-1" />
              {activeFilters.category}
              <button
                onClick={() => clearFilter("category")}
                className="ml-2 text-pink-600 hover:text-pink-800"
              >
                <X size={14} />
              </button>
            </motion.span>
          )}

          {activeFilters.difficulty && (
            <motion.span
              className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 px-4 py-2 rounded-full text-sm flex items-center font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Target size={14} className="mr-1" />
              {activeFilters.difficulty}
              <button
                onClick={() => clearFilter("difficulty")}
                className="ml-2 text-orange-600 hover:text-orange-800"
              >
                <X size={14} />
              </button>
            </motion.span>
          )}

          {activeFilters.ageGroup && (
            <motion.span
              className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-4 py-2 rounded-full text-sm flex items-center font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Users size={14} className="mr-1" />
              {activeFilters.ageGroup}
              <button
                onClick={() => clearFilter("ageGroup")}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X size={14} />
              </button>
            </motion.span>
          )}

          {activeFilters.searchTerm && (
            <motion.span
              className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-4 py-2 rounded-full text-sm flex items-center font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Search size={14} className="mr-1" />"{activeFilters.searchTerm}"
              <button
                onClick={() => clearFilter("searchTerm")}
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

export default EnhancedHobbyFilters;
