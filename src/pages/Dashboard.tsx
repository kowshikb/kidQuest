import React, { useMemo } from "react";
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
  Rocket,
  ArrowRight,
  Brush,
  CheckCircle,
  Smile,
  Map,
  Heart,
  Palette,
  Music,
  Camera,
  CheckSquare,
  Check,
  Activity,
  Gift,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";
import { useAppStats } from "../hooks/useAppStats";
import GlassCard from "../components/GlassCard";
import UnifiedLoader from "../components/UnifiedLoader";
import UnifiedBackground from "../components/UnifiedBackground";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  gradient: string;
  onClick: () => void;
  isLoading: boolean;
  bgIcon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  gradient,
  onClick,
  isLoading,
  bgIcon,
}) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg cursor-pointer group"
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`}
        />
        <div className="absolute top-4 right-4 text-6xl opacity-5">
          {bgIcon || icon}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-3 bg-gradient-to-br ${gradient} rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}
          >
            {icon}
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (
            <div className="text-3xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {value}
            </div>
          )}
          <div className="text-sm font-medium text-gray-600">{label}</div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

const ActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
  accent: string;
  pattern?: string;
}> = ({ title, description, icon, gradient, onClick, accent, pattern }) => (
  <motion.div
    className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl cursor-pointer group h-full"
    whileHover={{ scale: 1.02, y: -12 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    {/* Background Pattern */}
    <div className="absolute inset-0">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`}
      />
      <div className="absolute top-4 right-4 text-8xl opacity-5">{accent}</div>
      {pattern && (
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id={`pattern-${title.replace(/\s+/g, "-")}`}
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="20" cy="20" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill={`url(#pattern-${title.replace(/\s+/g, "-")})`}
            />
          </svg>
        </div>
      )}
    </div>

    {/* Content */}
    <div className="relative z-10 p-8 h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div
          className={`p-4 bg-gradient-to-br ${gradient} rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform`}
        >
          {icon}
        </div>
        <div className="text-4xl">{accent}</div>
      </div>

      <div className="flex-1">
        <h3 className="text-2xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
          {title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {description}
        </p>
      </div>

      <div className="flex items-center text-sm font-bold text-gray-700 group-hover:text-purple-600 transition-colors">
        <span>Explore Now</span>
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-200" />
      </div>
    </div>

    {/* Hover Gradient */}
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
    />
  </motion.div>
);

const FloatingOrb: React.FC<{
  className: string;
  delay: number;
  size?: string;
}> = ({ className, delay, size = "w-4 h-4" }) => (
  <motion.div
    className={`absolute ${size} ${className} rounded-full opacity-20 blur-sm`}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [1, 1.2, 1],
      opacity: [0.2, 0.4, 0.2],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { playSound } = useSound();
  const stats = useAppStats();

  const handleNavigate = (path: string) => {
    playSound("click");
    navigate(path);
  };

  // ✅ UNIFIED LOADING STRATEGY: Wait for all critical data before showing content
  const isFullyLoaded = useMemo(() => {
    // Check if all critical data is loaded
    const authLoaded = !stats.loading.auth && userProfile;
    const questsLoaded = !stats.loading.quests;
    const hobbiesLoaded = !stats.loading.hobbies;

    return authLoaded && questsLoaded && hobbiesLoaded;
  }, [stats.loading, userProfile]);

  // Show unified loading screen while data is being fetched
  if (!isFullyLoaded) {
    return (
      <UnifiedLoader
        title="Loading Your Adventure Dashboard"
        subtitle="Getting your amazing progress ready! 🎮✨"
        showProgress={true}
      />
    );
  }

  // Error state handling
  if (stats.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-gray-600 mb-4">
            We're having trouble loading your dashboard data. Please try
            refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const dashboardSections = [
    {
      id: "quests",
      title: "Life Values & Themes",
      description:
        "Learn gratitude, respect, caring & build character through meaningful quests",
      icon: <Heart size={32} />,
      path: "/quests",
      gradient: "from-rose-400 to-pink-600",
      accent: "💖",
      pattern: "dots",
    },
    {
      id: "hobbies",
      title: "Creative Hobbies",
      description:
        "Drawing, music, chess & amazing skills to spark your creativity",
      icon: <Palette size={32} />,
      path: "/hobbies",
      gradient: "from-purple-400 to-indigo-600",
      accent: "🎨",
      pattern: "dots",
    },
    {
      id: "friends",
      title: "Friends & Community",
      description:
        "Connect with fellow champions and build lasting friendships",
      icon: <Users size={32} />,
      path: "/friends",
      gradient: "from-emerald-400 to-teal-600",
      accent: "👥",
      pattern: "dots",
    },
    {
      id: "leaderboard",
      title: "Champions Board",
      description: "See how you rank among other amazing champions",
      icon: <Trophy size={32} />,
      path: "/leaderboard",
      gradient: "from-amber-400 to-orange-600",
      accent: "🏆",
      pattern: "dots",
    },
    {
      id: "rooms",
      title: "Adventure Rooms",
      description: "Join themed rooms and embark on group adventures",
      icon: <Rocket size={32} />,
      path: "/rooms",
      gradient: "from-blue-400 to-cyan-600",
      accent: "🚀",
      pattern: "dots",
    },
    {
      id: "profile",
      title: "My Profile",
      description: "Customize your champion profile and track your journey",
      icon: <Star size={32} />,
      path: "/profile",
      gradient: "from-violet-400 to-purple-600",
      accent: "⭐",
      pattern: "dots",
    },
  ];

  const statsData = [
    {
      icon: <Target className="w-6 h-6" />,
      label: "Quests Completed",
      value: stats.completedQuests || 0,
      gradient: "from-emerald-500 to-teal-600",
      onClick: () => handleNavigate("/quests"),
      isLoading: stats.loading.quests,
      bgIcon: <Map className="w-32 h-32 opacity-10" />,
    },
    {
      icon: <Brush className="w-6 h-6" />,
      label: "Hobbies Explored",
      value: stats.completedHobbies || 0,
      gradient: "from-pink-500 to-rose-600",
      onClick: () => handleNavigate("/hobbies"),
      isLoading: stats.loading.hobbies,
      bgIcon: <Palette className="w-32 h-32 opacity-10" />,
    },
    {
      icon: <CheckSquare className="w-6 h-6" />,
      label: "Tasks Completed",
      value: stats.totalTasksCompleted || 0,
      gradient: "from-blue-500 to-indigo-600",
      onClick: () => handleNavigate("/profile"),
      isLoading: stats.loading.quests || stats.loading.hobbies,
      bgIcon: <CheckCircle className="w-32 h-32 opacity-10" />,
    },
    {
      icon: <Crown className="w-6 h-6" />,
      label: "Magic Coins",
      value: stats.totalMagicCoins || 0,
      gradient: "from-purple-500 to-violet-600",
      onClick: () => handleNavigate("/profile"),
      isLoading: stats.loading.overall,
      bgIcon: <Trophy className="w-32 h-32 opacity-10" />,
    },
  ];

  return (
    <UnifiedBackground>
      <div className="container mx-auto px-4 py-8">
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-12">
          {/* Modern Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="mb-10">
              <motion.div
                className="inline-block"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GlassCard
                  className="inline-block border-2 border-white/50"
                  size="lg"
                >
                  <div className="flex items-center space-x-8">
                    <div className="relative">
                      <motion.img
                        src={userProfile?.avatarUrl || "/default-avatar.png"}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full border-4 border-white shadow-2xl"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      />
                      <motion.div
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <Crown className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                    <div className="text-left">
                      <motion.h1
                        className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
                        animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                        transition={{ duration: 8, repeat: Infinity }}
                      >
                        Welcome, Champion!
                      </motion.h1>
                      <p className="text-xl text-gray-600 mt-3 font-medium">
                        Ready for a new day of adventure and discovery?
                      </p>
                      <div className="flex items-center mt-4 space-x-6">
                        <motion.div
                          className="flex items-center space-x-2"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Star className="w-6 h-6 text-amber-500" />
                          <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            {userProfile?.rankTitle || "Novice Champion"}
                          </span>
                        </motion.div>
                        <motion.div
                          className="flex items-center space-x-2"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Zap className="w-6 h-6 text-blue-500" />
                          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Level {userProfile?.level || 1}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            {/* Enhanced Progress Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-3xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                Your Progress Overview
              </h2>
              <p className="text-gray-600 mb-10 max-w-2xl mx-auto text-lg">
                Here's a snapshot of your amazing journey. Keep exploring and
                growing! ✨
              </p>

              <GlassCard className="max-w-3xl mx-auto border-2 border-white/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-700">
                    Progress to Level {(userProfile?.level || 1) + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    <span className="text-lg font-bold text-gray-700">
                      {userProfile?.experience || 0}/100 XP
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((userProfile?.experience || 0) / 100) * 100}%`,
                    }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>

          {/* Modern Stats Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {statsData.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <StatCard
                  icon={stat.icon}
                  bgIcon={stat.bgIcon}
                  label={stat.label}
                  value={stat.value}
                  gradient={stat.gradient}
                  onClick={stat.onClick}
                  isLoading={stat.isLoading}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Modern Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="text-center mb-16">
              <motion.h2
                className="text-5xl font-black bg-gradient-to-r from-gray-800 via-purple-600 to-gray-800 bg-clip-text text-transparent mb-6"
                animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                transition={{ duration: 10, repeat: Infinity }}
              >
                Your Adventure Awaits
              </motion.h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto font-medium">
                Choose your path and embark on an incredible journey of
                learning, creativity, and friendship! 🌟
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {dashboardSections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <ActionCard
                    title={section.title}
                    description={section.description}
                    icon={section.icon}
                    gradient={section.gradient}
                    onClick={() => handleNavigate(section.path)}
                    accent={section.accent}
                    pattern={section.pattern}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </UnifiedBackground>
  );
};

export default Dashboard;
