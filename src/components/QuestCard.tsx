import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  Clock,
  Award,
  Star,
  Target,
  Zap,
  Smile,
} from "lucide-react";
import { QuestTheme, QuestTask } from "../api/questsApi";
import { useSound } from "../contexts/SoundContext";

export interface QuestCardProps {
  theme?: QuestTheme;
  completedTasks?: string[];
  onCompleteTask?: (task: QuestTask) => void;
  isLoading?: boolean;
  className?: string;
}

const QuestCard: React.FC<QuestCardProps> = ({
  theme,
  completedTasks = [],
  onCompleteTask,
  isLoading = false,
  className = "",
}) => {
  const { playSound } = useSound();
  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ LOCAL STATE: Track completed tasks for instant UI updates
  const [localCompletedTasks, setLocalCompletedTasks] = useState<Set<string>>(
    new Set(completedTasks)
  );

  // ✅ ANIMATION STATE: Track just-completed tasks for instant visual feedback
  const [justCompletedTasks, setJustCompletedTasks] = useState<Set<string>>(
    new Set()
  );

  // ✅ SYNC: Update local state when completedTasks prop changes
  useEffect(() => {
    setLocalCompletedTasks(new Set(completedTasks));
  }, [completedTasks]);

  if (isLoading) {
    return (
      <div
        className={`bg-white rounded-2xl shadow-lg p-6 animate-pulse ${className}`}
      >
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg mr-4"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="mt-4 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!theme) {
    return null; // Or some other placeholder if needed, but null is fine if we are handling loading state
  }

  const isTaskCompleted = (taskId: string) => {
    // ✅ INSTANT CHECK: Use local state for immediate UI feedback
    return localCompletedTasks.has(taskId);
  };

  const canStartTask = (task: QuestTask) => {
    // Use the canStart property from API if available (new sequential logic)
    if (typeof (task as any).canStart !== "undefined") {
      return (task as any).canStart;
    }

    // Fallback to old logic for compatibility
    if (!task.prerequisites || task.prerequisites.length === 0) {
      return true;
    }
    return task.prerequisites.every((prereqId) =>
      localCompletedTasks.has(prereqId)
    );
  };

  const handleToggleExpand = () => {
    playSound("click");
    setIsExpanded(!isExpanded);
  };

  const handleCompleteTask = (task: QuestTask) => {
    if (!isTaskCompleted(task.id)) {
      // ✅ INSTANT UI UPDATE: Add to local state immediately
      setLocalCompletedTasks((prev) => new Set([...prev, task.id]));

      // ✅ INSTANT ANIMATION: Add to just-completed for visual feedback
      setJustCompletedTasks((prev) => new Set([...prev, task.id]));

      // ✅ CLEAR ANIMATION: Remove from just-completed after animation
      setTimeout(() => {
        setJustCompletedTasks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(task.id);
          return newSet;
        });
      }, 1000);

      playSound("complete");
      if (onCompleteTask) {
        onCompleteTask(task);
      }
    }
  };

  const completedCount = theme.tasks.filter((task) =>
    localCompletedTasks.has(task.id)
  ).length;
  const progressPercentage =
    theme.tasks.length > 0 ? (completedCount / theme.tasks.length) * 100 : 0;

  const isQuestCompleted =
    completedCount === theme.tasks.length && theme.tasks.length > 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get completion state colors based on progress
  const getCompletionStateColors = (
    progressPercentage: number,
    isLocked: boolean
  ) => {
    if (isLocked) {
      return {
        cardBorder: "border-amber-200",
        cardBackground: "bg-white/90",
        progressBar: "bg-gradient-to-r from-amber-300 to-orange-400",
        headerBg: "bg-amber-50/50",
        accentColor: "text-amber-600",
      };
    }

    if (progressPercentage >= 100) {
      // Completed/Mastered - Green/Gold theme
      return {
        cardBorder: "border-emerald-300 shadow-emerald-100",
        cardBackground: "bg-gradient-to-br from-emerald-50 to-green-50",
        progressBar: "bg-gradient-to-r from-emerald-500 to-green-600",
        headerBg: "bg-gradient-to-r from-emerald-100 to-green-100",
        accentColor: "text-emerald-600",
      };
    } else if (progressPercentage > 0) {
      // In Progress - Purple/Indigo theme (keeping quest theme)
      return {
        cardBorder: "border-purple-200 shadow-purple-100",
        cardBackground: "bg-gradient-to-br from-purple-50 to-indigo-50",
        progressBar: "bg-gradient-to-r from-purple-500 to-indigo-600",
        headerBg: "bg-gradient-to-r from-purple-100 to-indigo-100",
        accentColor: "text-purple-600",
      };
    } else {
      // Not Started - Gray theme
      return {
        cardBorder: "border-gray-200",
        cardBackground: "bg-white/90",
        progressBar: "bg-gradient-to-r from-gray-400 to-gray-500",
        headerBg: "bg-gray-50",
        accentColor: "text-gray-600",
      };
    }
  };

  const { cardBorder, cardBackground, progressBar, headerBg, accentColor } =
    getCompletionStateColors(progressPercentage, theme?.isLocked || false);

  const getTaskStatusIcon = (task: QuestTask) => {
    const completed = isTaskCompleted(task.id);
    const can = canStartTask(task);
    const isSequentiallyLocked = (task as any).isSequentiallyLocked;

    if (completed) {
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <Check size={20} />
        </div>
      );
    }

    if (!can) {
      // Different icon for sequentially locked vs prerequisite locked
      if (isSequentiallyLocked) {
        return (
          <div
            className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"
            title="Complete the previous task first"
          >
            <Clock size={20} />
          </div>
        );
      }
      return (
        <div
          className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center"
          title="Prerequisites required"
        >
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
        title="Start this task"
      >
        <Target size={20} />
      </motion.button>
    );
  };

  return (
    <motion.div
      className={`${cardBackground} rounded-2xl shadow-md overflow-hidden border-2 ${cardBorder} ${
        theme.isLocked ? "relative" : ""
      } ${className}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Age Lock Overlay */}
      {theme.isLocked && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-lg rounded-xl p-6 mx-4 text-center border border-white/30 shadow-xl">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-gray-800 mb-2">
              Age Restricted
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              This quest is for ages {theme.ageRange?.min || 2}+
            </p>
            <p className="text-xs text-amber-600 font-medium">
              🎂 Unlock more adventures as you grow!
            </p>
          </div>
        </div>
      )}

      {/* Theme Header */}
      <div
        className={`p-6 cursor-pointer transition-colors duration-300 ${
          theme.isLocked
            ? "cursor-not-allowed"
            : isExpanded
            ? headerBg
            : `hover:${headerBg
                .replace("bg-gradient-to-r", "bg-gradient-to-r")
                .replace("100", "50")}`
        }`}
        onClick={theme.isLocked ? undefined : handleToggleExpand}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1 pr-4">
            <div className="flex items-center mb-2">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-xl font-bold mr-3 ${
                    theme.isLocked ? "text-gray-500" : "text-purple-900"
                  }`}
                >
                  {theme.name}
                </h3>
                {theme.isLocked && <Lock className="w-5 h-5 text-amber-500" />}
                {progressPercentage >= 100 && !theme.isLocked && (
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-emerald-600 text-sm font-bold">
                      COMPLETED!
                    </span>
                  </div>
                )}
              </div>
              {theme.imageUrl && (
                <div
                  className={`w-8 h-8 rounded-lg overflow-hidden ${
                    theme.isLocked ? "opacity-50" : ""
                  }`}
                >
                  <img
                    src={theme.imageUrl}
                    alt={theme.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <p
              className={`mb-3 ${
                theme.isLocked ? "text-gray-400" : "text-purple-600"
              }`}
            >
              {theme.description}
            </p>

            {/* Age Lock Notice */}
            {theme.isLocked && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <div className="flex items-center text-amber-700">
                  <Lock className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    Age {theme.ageRange?.min || 2}+ Required
                  </span>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-sm ${
                    theme.isLocked ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Progress
                </span>
                <span
                  className={`text-sm font-medium ${
                    theme.isLocked ? "text-gray-400" : "text-purple-700"
                  }`}
                >
                  {completedCount}/{theme.tasks.length} tasks
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-full rounded-full ${progressBar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  theme.isLocked
                    ? "bg-gray-100 text-gray-500"
                    : getDifficultyColor(theme.difficulty)
                }`}
              >
                {theme.difficulty}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  theme.isLocked
                    ? "bg-gray-100 text-gray-500"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {theme.category}
              </span>
              <div
                className={`flex items-center text-sm ${
                  theme.isLocked ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <Clock size={14} className="mr-1" />
                {theme.estimatedDuration}min
              </div>
              <div
                className={`flex items-center text-sm ${
                  theme.isLocked ? "text-gray-400" : "text-yellow-600"
                }`}
              >
                <Award size={14} className="mr-1" />
                {theme.totalRewards} coins
              </div>
              {theme.isLocked && (
                <div className="flex items-center text-amber-600 text-sm">
                  <Lock className="w-4 h-4 mr-1" />
                  Age {theme.ageRange?.min || 2}+
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center space-x-3">
            {progressPercentage === 100 && !theme.isLocked && (
              <div className="flex items-center text-green-600">
                <Star size={20} className="mr-1" />
                <span className="text-sm font-medium">Complete!</span>
              </div>
            )}

            {theme.isLocked ? (
              <div className="text-amber-500">
                <Lock size={20} />
              </div>
            ) : (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-6 h-6 flex items-center justify-center text-purple-400"
              >
                <ChevronDown size={20} />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <AnimatePresence mode="wait">
        {isExpanded && !theme.isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="border-t-2 border-purple-100 overflow-hidden"
          >
            <div className="bg-white">
              {theme.tasks.map((task, taskIndex) => {
                const completed = isTaskCompleted(task.id);
                const canStart = canStartTask(task) && !task.isLocked;
                const isTaskAgeLocked = task.isLocked;
                const isJustCompleted = justCompletedTasks.has(task.id);

                return (
                  <motion.div
                    key={task.id}
                    className={`p-4 flex items-center transition-colors duration-200 ${
                      completed
                        ? isJustCompleted
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 shadow-lg"
                          : "bg-green-50"
                        : isTaskAgeLocked || !canStart
                        ? "bg-gray-50"
                        : "hover:bg-purple-25"
                    } ${
                      taskIndex !== theme.tasks.length - 1
                        ? "border-b border-purple-100"
                        : ""
                    }`}
                    animate={
                      isJustCompleted
                        ? {
                            scale: [1, 1.02, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(16, 185, 129, 0)",
                              "0 0 0 8px rgba(16, 185, 129, 0.2)",
                              "0 0 0 0 rgba(16, 185, 129, 0)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 0.6 }}
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center mb-2">
                        <h4
                          className={`font-medium mr-2 ${
                            completed
                              ? "text-green-700 line-through"
                              : isTaskAgeLocked || !canStart
                              ? "text-gray-500"
                              : "text-gray-800"
                          }`}
                        >
                          {task.title}
                        </h4>

                        {isTaskAgeLocked && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                            <Lock size={10} className="inline mr-1" />
                            Age Lock
                          </span>
                        )}

                        {task.difficulty && !isTaskAgeLocked && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(
                              task.difficulty
                            )}`}
                          >
                            {task.difficulty}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-sm mb-2 ${
                          completed
                            ? "text-green-600 line-through"
                            : isTaskAgeLocked || !canStart
                            ? "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {task.description}
                      </p>

                      {/* Age Lock Notice for Tasks */}
                      {isTaskAgeLocked && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
                          <div className="flex items-center text-amber-700">
                            <Lock className="w-3 h-3 mr-1" />
                            <span className="text-xs font-medium">
                              Age{" "}
                              {task.ageRange?.min || theme.ageRange?.min || 2}+
                              Required
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-4">
                        <div
                          className={`flex items-center text-sm ${
                            isTaskAgeLocked
                              ? "text-gray-400"
                              : "text-orange-600"
                          }`}
                        >
                          <Smile className="w-4 h-4 mr-1" />
                          {task.coinReward} coins
                        </div>

                        {task.estimatedTime && (
                          <div
                            className={`flex items-center text-sm ${
                              isTaskAgeLocked
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            <Clock size={14} className="mr-1" />
                            {task.estimatedTime}min
                          </div>
                        )}

                        {task.prerequisites &&
                          task.prerequisites.length > 0 &&
                          !canStart &&
                          !isTaskAgeLocked && (
                            <div className="flex items-center text-orange-600 text-sm">
                              <Lock size={14} className="mr-1" />
                              Prerequisites required
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Task Status Icon */}
                    {isTaskAgeLocked ? (
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Lock size={20} />
                      </div>
                    ) : (
                      getTaskStatusIcon(task)
                    )}
                  </motion.div>
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
