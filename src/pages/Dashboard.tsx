import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, BookOpen, Users, MessageSquare, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSound } from "../contexts/SoundContext";

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { themes } = useTheme();
  const { playSound } = useSound();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");

  // Create time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    let newGreeting = "";

    if (hour < 12) {
      newGreeting = "Good Morning";
    } else if (hour < 18) {
      newGreeting = "Good Afternoon";
    } else {
      newGreeting = "Good Evening";
    }

    setGreeting(newGreeting);
  }, []);

  // Navigation with sound
  const handleNavigate = (path: string) => {
    playSound("click");
    navigate(path);
  };

  // Card variants for staggered animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  // Dashboard sections
  const dashboardSections = [
    {
      id: "themes",
      title: "Magical Quests",
      description: "Explore exciting quests and earn coins",
      icon: <BookOpen size={24} />,
      path: "/themes",
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "challenges",
      title: "Challenge Room",
      description: "Compete with friends in real-time challenges",
      icon: <MessageSquare size={24} />,
      path: "/rooms",
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "friends",
      title: "Friend Alliance",
      description: "Connect with other brave explorers",
      icon: <Users size={24} />,
      path: "/friends",
      color: "from-green-500 to-teal-600",
    },
    {
      id: "leaderboard",
      title: "Champions Gallery",
      description: "See who's leading the adventure",
      icon: <Award size={24} />,
      path: "/leaderboard",
      color: "from-amber-500 to-orange-600",
    },
  ];

  // Get completed tasks count
  const completedTasksCount = userProfile?.completedTasks?.length || 0;

  // Find a recommended quest (first incomplete theme with tasks)
  const recommendedQuest = themes.find((theme) =>
    theme.tasks.some((task) => !userProfile?.completedTasks?.includes(task.id))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-6"
    >
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-purple-900 mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {greeting}, {userProfile?.username || "Explorer"}!
        </motion.h1>
        <motion.p
          className="text-purple-600"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Your magical adventure awaits!
        </motion.p>
      </div>

      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-100">
          <p className="text-sm text-purple-500 mb-1">Coins Earned</p>
          <p className="text-2xl font-bold text-purple-900">
            {userProfile?.coins || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-100">
          <p className="text-sm text-purple-500 mb-1">Quests Completed</p>
          <p className="text-2xl font-bold text-purple-900">
            {completedTasksCount}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-100">
          <p className="text-sm text-purple-500 mb-1">Friends</p>
          <p className="text-2xl font-bold text-purple-900">
            {userProfile?.friendsList?.length || 0}
          </p>
        </div>
      </motion.div>

      {/* Recommended Quest */}
      {recommendedQuest && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-purple-900 mb-4">
            Recommended Quest
          </h2>
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg cursor-pointer"
            onClick={() => handleNavigate("/themes")}
          >
            <div className="flex items-start">
              <div className="bg-white bg-opacity-20 p-3 rounded-full mr-4">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {recommendedQuest.name}
                </h3>
                <p className="opacity-90 mb-3">
                  {recommendedQuest.description}
                </p>
                <div className="flex space-x-2">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    {recommendedQuest.difficulty}
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    {recommendedQuest.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboardSections.map((section, i) => (
          <motion.div
            key={section.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-gradient-to-r ${section.color} text-white rounded-2xl shadow-md overflow-hidden cursor-pointer`}
            onClick={() => handleNavigate(section.path)}
          >
            <div className="p-6">
              <div className="bg-white bg-opacity-20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                {section.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{section.title}</h3>
              <p className="opacity-90">{section.description}</p>
            </div>
            <div className="bg-black bg-opacity-10 px-6 py-3 flex justify-between items-center">
              <span className="font-medium">Explore</span>
              <svg
                className="w-5 h-5"
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
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;
