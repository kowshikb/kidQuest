import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Lock, 
  Clock, 
  Award,
  Star,
  Target,
  Zap
} from 'lucide-react';
import { QuestTheme, QuestTask } from '../api/questsApi';
import { useQuestContext } from '../contexts/QuestContext';
import { useSound } from '../contexts/SoundContext';

interface QuestCardProps {
  theme: QuestTheme;
  className?: string;
}

const QuestCard: React.FC<QuestCardProps> = ({ theme, className = '' }) => {
  const { completeTask, isTaskCompleted, canStartTask, getThemeProgress } = useQuestContext();
  const { playSound } = useSound();
  const [isExpanded, setIsExpanded] = useState(false);
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());

  const progress = getThemeProgress(theme.id);

  const toggleExpanded = () => {
    playSound('click');
    setIsExpanded(!isExpanded);
  };

  const handleCompleteTask = async (task: QuestTask) => {
    if (isTaskCompleted(task.id) || completingTasks.has(task.id)) return;
    
    setCompletingTasks(prev => new Set(prev).add(task.id));
    
    try {
      const success = await completeTask(task.id, theme.id, task.coinReward);
      if (success) {
        // Create flying coins animation
        createFlyingCoins(task.coinReward);
      }
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  const createFlyingCoins = (count: number) => {
    const coinCounter = document.querySelector('.coin-counter');
    if (!coinCounter) return;

    const coinCounterRect = coinCounter.getBoundingClientRect();

    for (let i = 0; i < Math.min(count / 10, 10); i++) {
      const coin = document.createElement('div');
      coin.classList.add('coin');

      const startX = Math.random() * 200 - 100;
      const startY = Math.random() * 100 - 50;

      const targetX = coinCounterRect.left + coinCounterRect.width / 2;
      const targetY = coinCounterRect.top + coinCounterRect.height / 2;

      coin.style.left = `calc(50% + ${startX}px)`;
      coin.style.top = `calc(50% + ${startY}px)`;
      coin.style.setProperty('--targetX', `${targetX - parseInt(coin.style.left)}px`);
      coin.style.setProperty('--targetY', `${targetY - parseInt(coin.style.top)}px`);

      document.body.appendChild(coin);

      setTimeout(() => {
        coin.remove();
      }, 1000 + i * 100);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusIcon = (task: QuestTask) => {
    const completed = isTaskCompleted(task.id);
    const canStart = canStartTask(task.id, task.prerequisites);
    const isCompleting = completingTasks.has(task.id);

    if (isCompleting) {
      return (
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (completed) {
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <Check size={20} />
        </div>
      );
    }

    if (!canStart) {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
          <Lock size={20} />
        </div>
      );
    }

    return (
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          handleCompleteTask(task);
        }}
        className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 flex items-center justify-center transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        disabled={isCompleting}
      >
        <Target size={20} />
      </motion.button>
    );
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-md overflow-hidden border-2 border-purple-100 ${className}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Theme Header */}
      <div
        className={`p-6 cursor-pointer transition-colors duration-300 ${
          isExpanded ? 'bg-purple-50' : 'hover:bg-purple-25'
        }`}
        onClick={toggleExpanded}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1 pr-4">
            <div className="flex items-center mb-2">
              <h3 className="text-xl font-bold text-purple-900 mr-3">
                {theme.name}
              </h3>
              {theme.imageUrl && (
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <img 
                    src={theme.imageUrl} 
                    alt={theme.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            
            <p className="text-purple-600 mb-3">
              {theme.description}
            </p>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-purple-700">
                  {progress.completed}/{progress.total} tasks
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(theme.difficulty)}`}>
                {theme.difficulty}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                {theme.category}
              </span>
              <div className="flex items-center text-sm text-gray-500">
                <Clock size={14} className="mr-1" />
                {theme.estimatedDuration}min
              </div>
              <div className="flex items-center text-sm text-yellow-600">
                <Award size={14} className="mr-1" />
                {theme.totalRewards} coins
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center space-x-3">
            {progress.percentage === 100 && (
              <div className="flex items-center text-green-600">
                <Star size={20} className="mr-1" />
                <span className="text-sm font-medium">Complete!</span>
              </div>
            )}
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-6 h-6 flex items-center justify-center text-purple-400"
            >
              <ChevronDown size={20} />
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Tasks List */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="border-t-2 border-purple-100 overflow-hidden"
          >
            <div className="bg-white">
              {theme.tasks.map((task, taskIndex) => {
                const completed = isTaskCompleted(task.id);
                const canStart = canStartTask(task.id, task.prerequisites);
                const isCompleting = completingTasks.has(task.id);

                return (
                  <div
                    key={task.id}
                    className={`p-4 flex items-center transition-colors duration-200 ${
                      completed ? 'bg-green-50' : 
                      !canStart ? 'bg-gray-50' :
                      'hover:bg-purple-25'
                    } ${taskIndex !== theme.tasks.length - 1 ? 'border-b border-purple-100' : ''}`}
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center mb-2">
                        <h4 className={`font-medium mr-2 ${
                          completed ? 'text-green-700 line-through' : 
                          !canStart ? 'text-gray-500' :
                          'text-gray-800'
                        }`}>
                          {task.title}
                        </h4>
                        
                        {task.difficulty && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                        )}
                      </div>
                      
                      <p className={`text-sm mb-2 ${
                        completed ? 'text-green-600 line-through' : 
                        !canStart ? 'text-gray-400' :
                        'text-gray-600'
                      }`}>
                        {task.description}
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-yellow-600 text-sm">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 2a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                          </svg>
                          {task.coinReward} coins
                        </div>
                        
                        {task.estimatedTime && (
                          <div className="flex items-center text-gray-500 text-sm">
                            <Clock size={14} className="mr-1" />
                            {task.estimatedTime}min
                          </div>
                        )}
                        
                        {task.prerequisites && task.prerequisites.length > 0 && !canStart && (
                          <div className="flex items-center text-orange-600 text-sm">
                            <Lock size={14} className="mr-1" />
                            Prerequisites required
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {getTaskStatusIcon(task)}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestCard;