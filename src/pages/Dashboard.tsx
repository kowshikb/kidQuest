import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Star,
  Trophy,
  Zap,
  Target,
  Crown,
  Gem,
  Rocket
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSound } from "../contexts/SoundContext";

const Dashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { themes, loading: themesLoading, fetchThemes } = useTheme() as any;
  const { playSound } = useSound();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [themesLoaded, setThemesLoaded] = useState(false);

  // Update time every minute for dynamic greeting
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Create time-based greeting with more personality
  useEffect(() => {
    const hour = new Date().getHours();
    let newGreeting = "";

    if (hour < 6) {
      newGreeting = "🌙 Late Night Explorer";
    } else if (hour < 12) {
      newGreeting = "🌅 Good Morning";
    } else if (hour < 17) {
      newGreeting = "☀️ Good Afternoon";
    } else if (hour < 21) {
      newGreeting = "🌆 Good Evening";
    } else {
      newGreeting = "✨ Night Owl";
    }

    setGreeting(newGreeting);
  }, [currentTime]);

  // Fetch themes when user is authenticated and track loading state
  useEffect(() => {
    if (currentUser && fetchThemes && !themesLoaded && !themesLoading) {
      fetchThemes(currentUser)
        .then(() => {
          setThemesLoaded(true);
        })
        .catch((error) => {
          console.error("Failed to fetch themes:", error);
          setThemesLoaded(true); // Set to true even on error to stop loading state
        });
    }
  }, [currentUser, fetchThemes, themesLoaded, themesLoading]);

  // Reset themes loaded state when user changes
  useEffect(() => {
    if (!currentUser) {
      setThemesLoaded(false);
    }
  }, [currentUser]);

  // Navigation with sound
  const handleNavigate = (path: string) => {
    playSound("click");
    navigate(path);
  };

  // Enhanced card variants for staggered animation
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
  };

  // Floating animation for background elements
  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Dashboard sections with enhanced styling
  const dashboardSections = [
    {
      id: "themes",
      title: "Magical Quests",
      description: "Embark on epic learning adventures",
      icon: <BookOpen size={28} />,
      path: "/themes",
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      shadowColor: "shadow-emerald-500/25",
      hoverShadow: "hover:shadow-emerald-500/40",
      accent: "🎯",
    },
    {
      id: "challenges",
      title: "Battle Arena",
      description: "Challenge friends in epic duels",
      icon: <MessageSquare size={28} />,
      path: "/rooms",
      gradient: "from-purple-500 via-violet-600 to-indigo-700",
      shadowColor: "shadow-purple-500/25",
      hoverShadow: "hover:shadow-purple-500/40",
      accent: "⚔️",
    },
    {
      id: "friends",
      title: "Guild Alliance",
      description: "Unite with fellow champions",
      icon: <Users size={28} />,
      path: "/friends",
      gradient: "from-rose-400 via-pink-500 to-purple-600",
      shadowColor: "shadow-rose-500/25",
      hoverShadow: "hover:shadow-rose-500/40",
      accent: "🤝",
    },
    {
      id: "leaderboard",
      title: "Hall of Fame",
      description: "Witness legendary champions",
      icon: <Trophy size={28} />,
      path: "/leaderboard",
      gradient: "from-amber-400 via-orange-500 to-red-600",
      shadowColor: "shadow-amber-500/25",
      hoverShadow: "hover:shadow-amber-500/40",
      accent: "👑",
    },
  ];

  // Get completed tasks count
  const completedTasksCount = userProfile?.completedTasks?.length || 0;
  const totalCoins = userProfile?.coins || 0;
  const friendsCount = userProfile?.friendsList?.length || 0;

  // Calculate user level based on coins
  const getUserLevel = (coins: number) => {
    return Math.floor(coins / 100) + 1;
  };

  // Calculate progress to next level
  const getProgressToNextLevel = (coins: number) => {
    return (coins % 100) / 100;
  };

  // Find a recommended quest - only show if themes are loaded and available
  const recommendedQuest = themesLoaded && themes && themes.length > 0 
    ? themes.find((theme: any) =>
        theme.tasks?.some((task: any) => !userProfile?.completedTasks?.includes(task.id))
      )
    : null;

  const userLevel = getUserLevel(totalCoins);
  const progressToNext = getProgressToNextLevel(totalCoins);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-25 to-pink-50" />
        
        {/* Floating Orbs */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 120 + 60}px`,
              height: `${Math.random() * 120 + 60}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: `linear-gradient(135deg, ${
                ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)]
              }, ${
                ['#A78BFA', '#67E8F9', '#34D399', '#FBBF24', '#F87171'][Math.floor(Math.random() * 5)]
              })`,
            }}
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: i * 0.5 }}
          />
        ))}

        {/* Sparkle Effects */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute text-yellow-400"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 1.5 + 0.5}rem`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 py-8 px-4">
        {/* Hero Welcome Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="inline-block mb-6"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <Crown size={40} className="text-yellow-300" />
              </div>
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={16} className="text-purple-700" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {greeting}, {userProfile?.username || "Champion"}!
          </motion.h1>
          
          <motion.p
            className="text-xl text-purple-600 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Ready for your next legendary adventure?
          </motion.p>
        </motion.div>

        {/* Enhanced Stats Overview */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Level & Progress */}
          <motion.div
            className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-purple-500/10 border border-purple-100"
            whileHover={{ y: -5, shadow: "0 25px 50px -12px rgba(139, 92, 246, 0.25)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                  <Star size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-500 font-medium">Champion Level</p>
                  <p className="text-3xl font-bold text-purple-900">{userLevel}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Next Level</p>
                <p className="text-lg font-bold text-purple-700">{totalCoins % 100}/100</p>
              </div>
            </div>
            <div className="w-full bg-purple-100 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext * 100}%` }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Coins */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-yellow-500/10 border border-yellow-100"
            whileHover={{ y: -5, shadow: "0 25px 50px -12px rgba(245, 158, 11, 0.25)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-4">
                <Gem size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">Magic Coins</p>
                <p className="text-2xl font-bold text-yellow-700">{totalCoins}</p>
              </div>
            </div>
          </motion.div>

          {/* Quests Completed */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-green-500/10 border border-green-100"
            whileHover={{ y: -5, shadow: "0 25px 50px -12px rgba(34, 197, 94, 0.25)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Quests Done</p>
                <p className="text-2xl font-bold text-green-700">{completedTasksCount}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Featured Quest Recommendation - Only show when themes are properly loaded */}
        <AnimatePresence mode="wait">
          {recommendedQuest && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              key="featured-quest"
            >
              <h2 className="text-3xl font-bold text-purple-900 mb-6 text-center">
                🌟 Featured Quest
              </h2>
              <motion.div
                className="relative bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 rounded-3xl p-8 shadow-2xl shadow-purple-500/25 overflow-hidden cursor-pointer"
                onClick={() => handleNavigate("/themes")}
                whileHover={{ 
                  scale: 1.02,
                  shadow: "0 25px 50px -12px rgba(139, 92, 246, 0.4)"
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 text-6xl">🎯</div>
                  <div className="absolute bottom-4 left-4 text-4xl">✨</div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5">🏆</div>
                </div>

                <div className="relative z-10 flex items-center">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mr-6">
                    <Rocket size={32} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {recommendedQuest.name}
                    </h3>
                    <p className="text-purple-100 mb-4 text-lg">
                      {recommendedQuest.description}
                    </p>
                    <div className="flex items-center space-x-4">
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium">
                        {recommendedQuest.difficulty}
                      </span>
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium">
                        {recommendedQuest.category}
                      </span>
                      <motion.div
                        className="flex items-center text-yellow-300 font-bold"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap size={20} className="mr-1" />
                        Start Quest
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Navigation Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          {dashboardSections.map((section, i) => (
            <motion.div
              key={section.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ 
                y: -10, 
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
              className={`relative bg-gradient-to-br ${section.gradient} rounded-3xl shadow-2xl ${section.shadowColor} ${section.hoverShadow} overflow-hidden cursor-pointer group`}
              onClick={() => handleNavigate(section.path)}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 text-4xl">{section.accent}</div>
                <div className="absolute bottom-4 left-4 text-2xl opacity-50">{section.accent}</div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />

              <div className="relative z-10 p-8">
                <div className="flex items-center mb-6">
                  <motion.div
                    className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mr-4"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {section.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{section.title}</h3>
                    <p className="text-white/80 text-lg">{section.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <motion.span 
                    className="text-white/90 font-medium text-lg"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    Explore Now
                  </motion.span>
                  <motion.div
                    className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                    whileHover={{ x: 5, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Stats Footer */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="inline-flex items-center bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center text-purple-700">
                <Users size={16} className="mr-1" />
                <span className="font-medium">{friendsCount} Friends</span>
              </div>
              <div className="w-1 h-1 bg-purple-400 rounded-full" />
              <div className="flex items-center text-purple-700">
                <Award size={16} className="mr-1" />
                <span className="font-medium">Level {userLevel} Champion</span>
              </div>
              <div className="w-1 h-1 bg-purple-400 rounded-full" />
              <div className="flex items-center text-purple-700">
                <Sparkles size={16} className="mr-1" />
                <span className="font-medium">Ready for Adventure</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;