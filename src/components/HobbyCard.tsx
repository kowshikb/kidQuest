import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  Clock,
  Coins,
  Play,
  Calendar,
} from "lucide-react";
import { Hobby, HobbyTask, UserHobbyProgress } from "../api/hobbiesApi";
import { useSound } from "../contexts/SoundContext";

export interface HobbyCardProps {
  hobby: Hobby;
  progress?: UserHobbyProgress;
  onTaskComplete: (task: HobbyTask, hobbyId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Beginner":
      return "bg-green-100 text-green-800 border-green-200";
    case "Intermediate":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Advanced":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Expert":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
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
      button: "bg-gray-100",
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
      button:
        "bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100",
      headerBg: "bg-gradient-to-r from-emerald-100 to-green-100",
      accentColor: "text-emerald-600",
    };
  } else if (progressPercentage > 0) {
    // In Progress - Blue/Purple theme
    return {
      cardBorder: "border-blue-200 shadow-blue-100",
      cardBackground: "bg-gradient-to-br from-blue-50 to-indigo-50",
      progressBar: "bg-gradient-to-r from-blue-500 to-indigo-600",
      button:
        "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100",
      headerBg: "bg-gradient-to-r from-blue-100 to-indigo-100",
      accentColor: "text-blue-600",
    };
  } else {
    // Not Started - Gray theme
    return {
      cardBorder: "border-gray-200",
      cardBackground: "bg-white/90",
      progressBar: "bg-gradient-to-r from-gray-400 to-gray-500",
      button:
        "bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200",
      headerBg: "bg-gray-50",
      accentColor: "text-gray-600",
    };
  }
};

const HobbyCard: React.FC<HobbyCardProps> = ({
  hobby,
  progress,
  onTaskComplete,
  isExpanded,
  onToggleExpand,
}) => {
  const { playSound } = useSound();

  // ✅ LOCAL STATE: Track completed tasks for instant UI updates
  const [localCompletedTasks, setLocalCompletedTasks] = React.useState<
    Set<string>
  >(new Set(progress?.completedTasks || []));

  // ✅ ANIMATION STATE: Track just-completed tasks for instant visual feedback
  const [justCompletedTasks, setJustCompletedTasks] = React.useState<
    Set<string>
  >(new Set());

  // ✅ SYNC: Update local state when progress prop changes
  React.useEffect(() => {
    setLocalCompletedTasks(new Set(progress?.completedTasks || []));
  }, [progress?.completedTasks]);

  const isTaskCompleted = (taskId: string) => {
    // ✅ INSTANT CHECK: Use local state for immediate UI feedback
    return localCompletedTasks.has(taskId);
  };

  const handleTaskComplete = (task: HobbyTask) => {
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
      onTaskComplete(task, hobby.id);
    }
  };

  const totalTasks = hobby.levels.reduce(
    (sum, level) => sum + level.tasks.length,
    0
  );
  const completedTasks = localCompletedTasks.size; // ✅ USE LOCAL STATE for instant updates
  const progressPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const isLevelUnlocked = (levelIndex: number): boolean => {
    if (levelIndex === 0) return true; // First level is always unlocked
    const prevLevel = hobby.levels[levelIndex - 1];
    const prevLevelTasks = prevLevel.tasks.map((task) => task.id);
    const completedPrevLevelTasks =
      progress?.completedTasks.filter((taskId) =>
        prevLevelTasks.includes(taskId)
      ) || [];
    return completedPrevLevelTasks.length === prevLevelTasks.length;
  };

  const {
    cardBorder,
    cardBackground,
    progressBar,
    button,
    headerBg,
    accentColor,
  } = getCompletionStateColors(progressPercentage, hobby.isLocked);

  return (
    <motion.div
      className={`${cardBackground} backdrop-blur-sm rounded-2xl shadow-lg border ${cardBorder} overflow-hidden ${
        hobby.isLocked ? "relative" : ""
      }`}
      whileHover={{ y: -4, shadow: "0 20px 40px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Age Lock Overlay */}
      {hobby.isLocked && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-lg rounded-xl p-6 mx-4 text-center border border-white/30 shadow-xl">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-gray-800 mb-2">
              Age Restricted
            </h4>
            <p className="text-sm text-gray-600 mb-1">
              This hobby is for ages {hobby.ageRange?.min || 2}+
            </p>
            <p className="text-xs text-amber-600 font-medium">
              🎂 Unlock more content as you grow!
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={`p-6 border-b border-gray-100 ${
          progressPercentage >= 100 && !hobby.isLocked ? headerBg : ""
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3
                className={`text-xl font-bold ${
                  hobby.isLocked ? "text-gray-500" : "text-gray-800"
                }`}
              >
                {hobby.name}
              </h3>
              {hobby.isLocked && <Lock className="w-5 h-5 text-amber-500" />}
              {progressPercentage >= 100 && !hobby.isLocked && (
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-emerald-600 text-sm font-bold">
                    MASTERED!
                  </span>
                </div>
              )}
            </div>
            <p
              className={`text-sm leading-relaxed mb-3 ${
                hobby.isLocked ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {hobby.description}
            </p>
            <div className="flex items-center space-x-3 mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  hobby.isLocked
                    ? "bg-gray-100 text-gray-500 border-gray-200"
                    : getDifficultyColor(hobby.category)
                }`}
              >
                {hobby.category}
              </span>
              <div
                className={`flex items-center text-sm ${
                  hobby.isLocked ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <Calendar className="w-4 h-4 mr-1" />
                {hobby.totalDays} days
              </div>
              <div
                className={`flex items-center text-sm ${
                  hobby.isLocked ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <Coins className="w-4 h-4 mr-1" />
                {hobby.totalCoins} coins
              </div>
              {hobby.isLocked && (
                <div className="flex items-center text-amber-600 text-sm">
                  <Lock className="w-4 h-4 mr-1" />
                  Age {hobby.ageRange?.min || 2}+
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl mb-2 ${hobby.isLocked ? "opacity-50" : ""}`}
            >
              {hobby.icon}
            </div>
            <div
              className={`text-sm ${
                hobby.isLocked ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {completedTasks}/{totalTasks} tasks
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-sm font-medium ${
                hobby.isLocked ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Progress
            </span>
            <span
              className={`text-sm font-bold ${
                hobby.isLocked ? "text-gray-400" : "text-gray-700"
              }`}
            >
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${progressBar}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Toggle Button */}
        <motion.button
          onClick={hobby.isLocked ? undefined : onToggleExpand}
          disabled={hobby.isLocked}
          className={`w-full flex items-center justify-center py-3 rounded-xl transition-all duration-200 ${button} ${
            hobby.isLocked ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          whileHover={!hobby.isLocked ? { scale: 1.02 } : undefined}
          whileTap={!hobby.isLocked ? { scale: 0.98 } : undefined}
        >
          <span
            className={`text-sm font-medium mr-2 ${
              hobby.isLocked ? "text-gray-400" : "text-gray-700"
            }`}
          >
            {hobby.isLocked ? (
              <>
                <Lock className="w-4 h-4 inline mr-1" />
                Locked - Age {hobby.ageRange?.min || 2}+
              </>
            ) : isExpanded ? (
              "Hide Details"
            ) : (
              "View Levels & Tasks"
            )}
          </span>
          {!hobby.isLocked &&
            (isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ))}
        </motion.button>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && !hobby.isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {hobby.levels.map((level, levelIndex) => {
                const unlocked = isLevelUnlocked(levelIndex) && !level.isLocked;
                const isAgeLocked = level.isLocked;
                return (
                  <div
                    key={level.id}
                    className={`border-l-4 pl-4 transition-all duration-300 ${
                      unlocked ? "border-pink-200" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4
                        className={`text-lg font-semibold ${
                          unlocked ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {level.name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          unlocked
                            ? getDifficultyColor(level.name.split(" ")[0])
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {unlocked ? (
                          level.name.split(" ")[0]
                        ) : (
                          <Lock size={12} className="inline-block mr-1" />
                        )}
                        {!unlocked && (isAgeLocked ? "Age Locked" : "Locked")}
                      </span>
                    </div>
                    <p
                      className={`text-sm mb-4 ${
                        unlocked ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {level.description}
                    </p>

                    {/* Age Lock Notice for Levels */}
                    {isAgeLocked && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center text-amber-700">
                          <Lock className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            Age{" "}
                            {level.ageRange?.min || hobby.ageRange?.min || 2}+
                            Required
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tasks Preview - EXPANDED TO SHOW ALL TASKS */}
                    {unlocked && (
                      <div className="space-y-3">
                        {/* Show all tasks instead of limiting to 4 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                          {level.tasks.map((task) => {
                            const isCompleted = isTaskCompleted(task.id);
                            const isJustCompleted = justCompletedTasks.has(
                              task.id
                            );
                            return (
                              <motion.div
                                key={task.id}
                                className={`p-4 border rounded-xl transition-all duration-200 ${
                                  isCompleted
                                    ? isJustCompleted
                                      ? "bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 shadow-lg"
                                      : "bg-green-50 border-green-200"
                                    : "bg-gray-50 border-gray-200 hover:border-purple-300"
                                }`}
                                whileHover={{ scale: 1.02 }}
                                animate={
                                  isJustCompleted
                                    ? {
                                        scale: [1, 1.05, 1],
                                        boxShadow: [
                                          "0 0 0 0 rgba(16, 185, 129, 0)",
                                          "0 0 0 10px rgba(16, 185, 129, 0.2)",
                                          "0 0 0 0 rgba(16, 185, 129, 0)",
                                        ],
                                      }
                                    : {}
                                }
                                transition={{ duration: 0.6 }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-800 text-sm">
                                      {task.title}
                                    </h5>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                    <div className="flex items-center mt-2 text-xs text-gray-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {task.estimatedTime} min
                                      <Coins className="w-3 h-3 ml-3 mr-1" />
                                      {task.coinReward}
                                    </div>
                                  </div>
                                  <motion.button
                                    onClick={() => handleTaskComplete(task)}
                                    disabled={isCompleted}
                                    className={`ml-3 p-2 rounded-lg transition-all duration-200 ${
                                      isCompleted
                                        ? "bg-green-100 text-green-600 cursor-not-allowed"
                                        : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                                    }`}
                                    whileHover={
                                      !isCompleted ? { scale: 1.1 } : undefined
                                    }
                                    whileTap={
                                      !isCompleted ? { scale: 0.9 } : undefined
                                    }
                                  >
                                    {isCompleted ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        {/* Show summary instead of partial count */}
                        {level.tasks.length > 6 && (
                          <div className="text-sm text-gray-600 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                Level Progress:
                              </span>
                              <span className="font-bold">
                                {
                                  level.tasks.filter((task) =>
                                    localCompletedTasks.has(task.id)
                                  ).length
                                }{" "}
                                / {level.tasks.length} completed
                              </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    (level.tasks.filter((task) =>
                                      localCompletedTasks.has(task.id)
                                    ).length /
                                      level.tasks.length) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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

export default HobbyCard;
