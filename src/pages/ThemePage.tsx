import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme, Theme, Task } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSound } from '../contexts/SoundContext';
import { useModal } from '../contexts/ModalContext';

const ThemePage: React.FC = () => {
  const { filteredThemes, filterThemes, activeFilters, fetchThemes } = useTheme() as any;
  const { userProfile, addCompletedTask, currentUser } = useAuth();
  const { playSound } = useSound();
  const { showModal } = useModal();
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Fetch themes when user is authenticated
  useEffect(() => {
    if (currentUser && fetchThemes) {
      fetchThemes(currentUser);
    }
  }, [currentUser, fetchThemes]);

  // Define categories and difficulties for filtering
  const categories = [
    'All',
    'Life Skills',
    'Academics',
    'Social-Emotional',
    'Creative Arts',
    'Science',
    'Community',
    'Health'
  ];
  
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  // Handle theme expansion toggle
  const toggleTheme = (themeId: string) => {
    playSound('click');
    setExpandedThemeId(expandedThemeId === themeId ? null : themeId);
  };

  // Check if a task is completed
  const isTaskCompleted = (taskId: string) => {
    return userProfile?.completedTasks?.includes(taskId) || false;
  };

  // Complete a task
  const completeTask = async (task: Task, themeId: string) => {
    if (isTaskCompleted(task.id)) return;
    
    playSound('complete');
    
    // Create flying coins animation
    createFlyingCoins(task.coinReward);
    
    // Add completed task and update coins
    await addCompletedTask(task.id, task.coinReward);
    
    // Show success modal
    showModal({
      title: "Quest Completed!",
      message: `Congratulations! You've earned ${task.coinReward} coins for completing this quest.`,
      type: "success"
    });
  };

  // Create flying coins animation
  const createFlyingCoins = (count: number) => {
    const coinCounter = document.querySelector('.coin-counter');
    if (!coinCounter) return;
    
    const coinCounterRect = coinCounter.getBoundingClientRect();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const coin = document.createElement('div');
      coin.classList.add('coin');
      
      // Random starting position
      const startX = Math.random() * 200 - 100;
      const startY = Math.random() * 100 - 50;
      
      // Calculate target position (coin counter)
      const targetX = coinCounterRect.left + coinCounterRect.width / 2;
      const targetY = coinCounterRect.top + coinCounterRect.height / 2;
      
      // Set position and animate
      coin.style.left = `calc(50% + ${startX}px)`;
      coin.style.top = `calc(50% + ${startY}px)`;
      coin.style.setProperty('--targetX', `${targetX - parseInt(coin.style.left)}px`);
      coin.style.setProperty('--targetY', `${targetY - parseInt(coin.style.top)}px`);
      
      // Add to DOM
      document.body.appendChild(coin);
      
      // Remove after animation
      setTimeout(() => {
        coin.remove();
      }, 1000 + i * 100);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterThemes(activeFilters.category, activeFilters.difficulty, value || null);
  };

  // Handle category filter change
  const handleCategoryFilter = (category: string) => {
    playSound('click');
    filterThemes(
      category === 'All' ? null : category,
      activeFilters.difficulty,
      activeFilters.searchTerm
    );
    setIsFilterMenuOpen(false);
  };

  // Handle difficulty filter change
  const handleDifficultyFilter = (difficulty: string) => {
    playSound('click');
    filterThemes(
      activeFilters.category,
      difficulty === 'All' ? null : difficulty,
      activeFilters.searchTerm
    );
    setIsFilterMenuOpen(false);
  };

  // Toggle filter menu
  const toggleFilterMenu = () => {
    playSound('click');
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  // Don't render if user is not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-purple-800">Please log in to access magical quests!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
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
          Discover exciting challenges and earn rewards!
        </motion.p>
      </div>

      {/* Search and Filter */}
      <motion.div 
        className="mb-8 flex flex-col md:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="storybook-input w-full pl-10"
            placeholder="Search magical quests..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="relative">
          <button
            onClick={toggleFilterMenu}
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors duration-300"
          >
            <Filter size={18} className="mr-2" />
            <span>Filters</span>
            {isFilterMenuOpen ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
          </button>
          
          <AnimatePresence>
            {isFilterMenuOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl z-30 p-4 border-2 border-purple-100"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="mb-4">
                  <h3 className="font-bold text-purple-900 mb-2">Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          (category === 'All' && !activeFilters.category) || 
                          category === activeFilters.category
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-purple-900 mb-2">Difficulty</h3>
                  <div className="flex flex-wrap gap-2">
                    {difficulties.map(difficulty => (
                      <button
                        key={difficulty}
                        onClick={() => handleDifficultyFilter(difficulty)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          (difficulty === 'All' && !activeFilters.difficulty) || 
                          difficulty === activeFilters.difficulty
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        }`}
                      >
                        {difficulty}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Active Filters */}
      {(activeFilters.category || activeFilters.difficulty || activeFilters.searchTerm) && (
        <motion.div 
          className="mb-6 flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-sm text-purple-600">Active Filters:</span>
          
          {activeFilters.category && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
              Category: {activeFilters.category}
              <button 
                onClick={() => handleCategoryFilter('All')}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          
          {activeFilters.difficulty && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
              Difficulty: {activeFilters.difficulty}
              <button 
                onClick={() => handleDifficultyFilter('All')}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          
          {activeFilters.searchTerm && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
              Search: {activeFilters.searchTerm}
              <button 
                onClick={() => {
                  setSearchTerm('');
                  filterThemes(activeFilters.category, activeFilters.difficulty, null);
                }}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
        </motion.div>
      )}

      {/* ✅ COMPLETELY FIXED - Themes List with ZERO movement */}
      <div 
        className="space-y-6"
        style={{
          // ✅ CRITICAL: Force stable container
          position: 'relative',
          isolation: 'isolate',
          contain: 'layout style'
        }}
      >
        {filteredThemes.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-purple-100 mb-4">
              <Search size={32} className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-purple-900 mb-2">No Quests Found</h3>
            <p className="text-purple-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredThemes.map((theme: Theme, themeIndex: number) => (
            <div
              key={theme.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden border-2 border-purple-100"
              style={{
                // ✅ BULLETPROOF STABILITY: Each theme card is completely isolated
                position: 'relative',
                zIndex: 1,
                isolation: 'isolate',
                contain: 'layout style size',
                willChange: 'auto',
                // ✅ PREVENT ANY FLEX/GRID INTERFERENCE
                display: 'block',
                width: '100%'
              }}
            >
              {/* ✅ COMPLETELY STABLE THEME HEADER */}
              <div
                className={`p-6 cursor-pointer transition-colors duration-300 ${
                  expandedThemeId === theme.id ? 'bg-purple-50' : 'hover:bg-purple-25'
                }`}
                onClick={() => toggleTheme(theme.id)}
                style={{
                  // ✅ ABSOLUTE STABILITY: Fixed height prevents ANY movement
                  height: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  contain: 'layout style',
                  // ✅ FORCE STABLE POSITIONING
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                <div 
                  className="flex justify-between items-center w-full"
                  style={{
                    // ✅ PREVENT CONTENT FROM AFFECTING LAYOUT
                    height: '100%',
                    alignItems: 'center'
                  }}
                >
                  <div 
                    className="flex-1 pr-4"
                    style={{
                      // ✅ STABLE TEXT CONTAINER
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      height: '100%',
                      overflow: 'hidden'
                    }}
                  >
                    <h2 
                      className="text-xl font-bold text-purple-900 mb-2"
                      style={{
                        // ✅ PREVENT TEXT OVERFLOW FROM AFFECTING LAYOUT
                        lineHeight: '1.2',
                        maxHeight: '2.4em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {theme.name}
                    </h2>
                    <p 
                      className="text-purple-600"
                      style={{
                        // ✅ STABLE DESCRIPTION
                        lineHeight: '1.4',
                        maxHeight: '2.8em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {theme.description}
                    </p>
                  </div>
                  
                  <div 
                    className="flex items-center space-x-2 flex-shrink-0"
                    style={{
                      // ✅ STABLE BADGE CONTAINER
                      height: '100%',
                      alignItems: 'center',
                      minWidth: 'fit-content'
                    }}
                  >
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      theme.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      theme.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {theme.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {theme.category}
                    </span>
                    <div
                      style={{
                        // ✅ ABSOLUTELY STABLE CHEVRON CONTAINER
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '8px'
                      }}
                    >
                      <motion.div
                        animate={{ rotate: expandedThemeId === theme.id ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{
                          // ✅ PREVENT ROTATION FROM AFFECTING LAYOUT
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#A855F7'
                        }}
                      >
                        <ChevronDown size={20} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ✅ COMPLETELY ISOLATED TASK EXPANSION */}
              <AnimatePresence mode="wait">
                {expandedThemeId === theme.id && (
                  <motion.div
                    initial={{ 
                      height: 0, 
                      opacity: 0
                    }}
                    animate={{ 
                      height: 'auto', 
                      opacity: 1
                    }}
                    exit={{ 
                      height: 0, 
                      opacity: 0
                    }}
                    transition={{ 
                      duration: 0.4, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      opacity: { duration: 0.2 }
                    }}
                    className="border-t-2 border-purple-100 overflow-hidden"
                    style={{
                      // ✅ ABSOLUTELY PREVENT LAYOUT IMPACT
                      position: 'relative',
                      zIndex: 2,
                      isolation: 'isolate',
                      contain: 'layout style size',
                      // ✅ FORCE STABLE POSITIONING
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* ✅ STABLE TASK CONTAINER */}
                    <div 
                      className="bg-white"
                      style={{
                        // ✅ PREVENT TASK CONTAINER FROM AFFECTING PARENT LAYOUT
                        position: 'relative',
                        width: '100%'
                      }}
                    >
                      {theme.tasks.map((task, taskIndex) => {
                        const completed = isTaskCompleted(task.id);
                        return (
                          <div
                            key={task.id}
                            className={`p-4 flex items-center transition-colors duration-200 ${
                              completed ? 'bg-green-50' : 'hover:bg-purple-25'
                            } ${taskIndex !== theme.tasks.length - 1 ? 'border-b border-purple-100' : ''}`}
                            style={{
                              // ✅ ABSOLUTELY STABLE TASK POSITIONING
                              minHeight: '80px',
                              display: 'flex',
                              alignItems: 'center',
                              position: 'relative',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div 
                              className="flex-1 pr-4"
                              style={{
                                // ✅ STABLE TASK CONTENT
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                minHeight: '48px'
                              }}
                            >
                              <p 
                                className={`${completed ? 'text-green-700 line-through' : 'text-gray-700'} mb-1`}
                                style={{
                                  // ✅ PREVENT TEXT FROM AFFECTING LAYOUT
                                  lineHeight: '1.4',
                                  wordWrap: 'break-word'
                                }}
                              >
                                {task.description}
                              </p>
                              <div className="flex items-center">
                                <span className="text-yellow-600 flex items-center text-sm">
                                  {/* ✅ CONSISTENT MAGIC COIN SYMBOL */}
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 2a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                                  </svg>
                                  {task.coinReward} coins
                                </span>
                              </div>
                            </div>
                            
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                completeTask(task, theme.id);
                              }}
                              disabled={completed}
                              className={`transition-all duration-200 flex-shrink-0 ${
                                completed
                                  ? 'bg-green-100 text-green-600 cursor-default'
                                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                              }`}
                              whileHover={completed ? {} : { scale: 1.1 }}
                              whileTap={completed ? {} : { scale: 0.95 }}
                              style={{
                                // ✅ ABSOLUTELY STABLE BUTTON
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                // ✅ PREVENT BUTTON FROM AFFECTING LAYOUT
                                flexShrink: 0,
                                position: 'relative'
                              }}
                            >
                              <Check size={20} />
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ThemePage;