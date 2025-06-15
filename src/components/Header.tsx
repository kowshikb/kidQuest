import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Award,
  Users,
  MessageSquare,
  User,
  VolumeX,
  Volume2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";
import { useModal } from "../contexts/ModalContext";
import CoinCounter from "./CoinCounter";

const Header: React.FC = () => {
  const { currentUser, userProfile, signOut } = useAuth();
  const { isSoundEnabled, toggleSound, playSound } = useSound();
  const { showModal } = useModal();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Define navigation items
  const navItems = [
    { path: "/dashboard", label: "Home", icon: <Home size={20} /> },
    { path: "/quests", label: "Quests", icon: <Sparkles size={20} /> },
    { path: "/themes", label: "Legacy", icon: <Award size={20} /> },
    { path: "/rooms", label: "Rooms", icon: <MessageSquare size={20} /> },
    { path: "/friends", label: "Friends", icon: <Users size={20} /> },
    { path: "/leaderboard", label: "Leaderboard", icon: <Award size={20} /> },
    { path: "/profile", label: "Profile", icon: <User size={20} /> },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Toggle mobile menu
  const toggleMenu = () => {
    playSound("click");
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle toggle sound
  const handleToggleSound = () => {
    toggleSound();
    playSound("click");
  };

  // Handle navigate with sound
  const handleNavigate = (path: string) => {
    playSound("click");
    navigate(path);
  };

  // Handle sign out
  const handleSignOut = () => {
    playSound("click");
    showModal({
      title: "Sign Out",
      message: "Are you sure you want to leave your magical journey for now?",
      type: "warning",
      confirmText: "Sign Out",
      cancelText: "Stay",
      onConfirm: async () => {
        try {
          await signOut();
          navigate("/");
        } catch (error) {
          console.error("Logout error:", error);
        }
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 shadow-md py-3">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center"
            onClick={() => playSound("click")}
          >
            <motion.div
              className="text-white font-bold text-xl md:text-2xl font-gaegu flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="bg-yellow-400 text-purple-800 rounded-full w-10 h-10 flex items-center justify-center mr-2">
                KQ
              </span>
              <span className="hidden sm:inline">KidQuest Champions</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {currentUser && (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => playSound("click")}
                    className={`px-4 py-2 rounded-full transition-colors duration-200 flex items-center ${
                      location.pathname === item.path
                        ? "bg-white bg-opacity-30 text-white font-medium"
                        : "text-white hover:bg-white hover:bg-opacity-10"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-1">{item.label}</span>
                  </Link>
                ))}

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

                {/* Logout Button */}
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-200"
                  title="Sign out"
                >
                  <LogOut size={20} />
                </button>

                {/* Coin Counter - Always show, even with 0 coins */}
                <div className="coin-counter">
                  <CoinCounter coins={userProfile?.coins || 0} />
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {currentUser && (
              <>
                {/* Mobile Coin Counter */}
                <div className="coin-counter mr-3">
                  <CoinCounter coins={userProfile?.coins || 0} />
                </div>
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-10"
                >
                  <div className="w-6 h-5 flex flex-col justify-between">
                    <span
                      className={`block w-full h-0.5 bg-white transition-transform duration-300 ${
                        isMenuOpen ? "rotate-45 translate-y-2" : ""
                      }`}
                    ></span>
                    <span
                      className={`block w-full h-0.5 bg-white transition-opacity duration-300 ${
                        isMenuOpen ? "opacity-0" : ""
                      }`}
                    ></span>
                    <span
                      className={`block w-full h-0.5 bg-white transition-transform duration-300 ${
                        isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                      }`}
                    ></span>
                  </div>
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-3 space-y-1">
                {navItems.map((item) => (
                  <motion.div
                    key={item.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => playSound("click")}
                      className={`block px-4 py-2 rounded-lg transition-colors duration-200 flex items-center ${
                        location.pathname === item.path
                          ? "bg-white bg-opacity-20 text-white font-medium"
                          : "text-white hover:bg-white hover:bg-opacity-10"
                      }`}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}

                {/* Sound Toggle Mobile */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <button
                    onClick={handleToggleSound}
                    className="w-full px-4 py-2 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-200 flex items-center"
                  >
                    {isSoundEnabled ? (
                      <Volume2 size={20} />
                    ) : (
                      <VolumeX size={20} />
                    )}
                    <span className="ml-2">
                      {isSoundEnabled ? "Sound On" : "Sound Off"}
                    </span>
                  </button>
                </motion.div>

                {/* Logout Mobile */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-colors duration-200 flex items-center"
                  >
                    <LogOut size={20} />
                    <span className="ml-2">Sign Out</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;