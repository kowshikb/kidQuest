import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  MessageSquare,
  User,
  VolumeX,
  Volume2,
  LogOut,
  Sparkles,
  Star,
  Bell,
  BookOpen,
  Trophy,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";
import { useModal } from "../contexts/ModalContext";
import CoinCounter from "./CoinCounter";
import NotificationPanel from "./NotificationPanel";

const Header: React.FC = () => {
  const { currentUser, userProfile, signOut } = useAuth();
  const { isSoundEnabled, toggleSound, playSound } = useSound();
  const { showModal } = useModal();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Define navigation items
  const navItems = [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "Quests", path: "/quests", icon: Star },
    { name: "Themes", path: "/themes", icon: Sparkles },
    { name: "Hobbies", path: "/hobbies", icon: BookOpen },
    { name: "Rooms", path: "/rooms", icon: MessageSquare },
    { name: "Friends", path: "/friends", icon: Users },
    { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const getNavLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
      isActive
        ? "bg-white bg-opacity-20 text-white"
        : "text-gray-200 hover:bg-white hover:bg-opacity-10"
    }`;
  };

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Handle toggle sound
  const handleToggleSound = () => {
    toggleSound();
    playSound("click");
  };

  // Handle sign out
  const handleLogout = () => {
    playSound("click");
    showModal({
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      type: "warning",
      confirmText: "Yes, Sign Out",
      cancelText: "Stay Logged In",
      onConfirm: () => {
        signOut();
        navigate("/login");
      },
    });
  };

  const handleNotificationCountChange = (count: number) => {
    console.log("🔔 Header: Notification count updated to", count);
    setNotificationCount(count);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <motion.header
      className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 shadow-lg relative z-30"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center space-x-3 text-white hover:text-gray-200 transition-colors duration-200"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-full">
              <span className="text-2xl">🎯</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">
              KidQuest Champions
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {currentUser && (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => playSound("click")}
                    className={getNavLinkClass(item.path)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="ml-2">{item.name}</span>
                  </Link>
                ))}

                {/* Right side: Actions */}
                <div className="relative flex items-center space-x-2">
                  <CoinCounter coins={userProfile?.coins ?? 0} />

                  {/* Sound Toggle */}
                  <button
                    onClick={handleToggleSound}
                    className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-200"
                    title={isSoundEnabled ? "Turn sound off" : "Turn sound on"}
                  >
                    {isSoundEnabled ? (
                      <Volume2 size={20} />
                    ) : (
                      <VolumeX size={20} />
                    )}
                  </button>

                  {/* Notification Bell with Dynamic Counter */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setIsNotificationPanelOpen(!isNotificationPanelOpen);
                        playSound("click");
                      }}
                      className="relative p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
                    >
                      <Bell className="w-6 h-6" />

                      {/* Dynamic Notification Counter Badge */}
                      <AnimatePresence>
                        {notificationCount > 0 && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                              type: "spring",
                              damping: 15,
                              stiffness: 300,
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-lg border-2 border-white"
                          >
                            <motion.span
                              key={notificationCount}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              {notificationCount > 99
                                ? "99+"
                                : notificationCount}
                            </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Pulse Animation for New Notifications */}
                      {notificationCount > 0 && (
                        <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></div>
                      )}
                    </button>

                    {/* Notification Panel */}
                    <NotificationPanel
                      isOpen={isNotificationPanelOpen}
                      onClose={() => setIsNotificationPanelOpen(false)}
                      notificationCount={notificationCount}
                      onNotificationCountChange={handleNotificationCountChange}
                    />
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-200"
                    title="Sign Out"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationPanelOpen(!isNotificationPanelOpen);
                  playSound("click");
                }}
                className="relative p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
              >
                <Bell className="w-5 h-5" />

                {/* Mobile Counter Badge */}
                <AnimatePresence>
                  {notificationCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-4 flex items-center justify-center border border-white"
                    >
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Mobile Notification Panel */}
              <NotificationPanel
                isOpen={isNotificationPanelOpen}
                onClose={() => setIsNotificationPanelOpen(false)}
                notificationCount={notificationCount}
                onNotificationCountChange={handleNotificationCountChange}
              />
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-2 pt-2 pb-4 space-y-1 bg-white bg-opacity-10 rounded-lg mb-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => playSound("click")}
                    className={`${getNavLinkClass(
                      item.path
                    )} justify-start w-full block`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="ml-3">{item.name}</span>
                  </Link>
                ))}

                {/* Mobile Action Buttons */}
                <div className="pt-4 border-t border-white border-opacity-20">
                  <div className="flex items-center justify-between">
                    <CoinCounter coins={userProfile?.coins ?? 0} />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleToggleSound}
                        className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-200"
                      >
                        {isSoundEnabled ? (
                          <Volume2 size={20} />
                        ) : (
                          <VolumeX size={20} />
                        )}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-200"
                      >
                        <LogOut size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
