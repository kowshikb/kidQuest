import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Edit,
  CheckCircle,
  LogOut,
  Coins as Coin,
  Award,
  Users,
  Crown,
  Star,
  Zap,
  Trophy,
  Target,
  MapPin,
  Calendar,
  Sparkles,
  Shield,
  Gem,
  Rocket,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";
import { useModal } from "../contexts/ModalContext";
import { useNavigate } from "react-router-dom";

// Define avatar options
const AVATAR_OPTIONS = [
  "https://images.pexels.com/photos/1416736/pexels-photo-1416736.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/3608439/pexels-photo-3608439.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/3662845/pexels-photo-3662845.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/4588465/pexels-photo-4588465.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/4010442/pexels-photo-4010442.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=150",
];

const ProfilePage: React.FC = () => {
  const { currentUser, userProfile, updateProfile, signOut } = useAuth();
  const { playSound } = useSound();
  const { showModal } = useModal();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");

  // Initialize form with user profile data
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || "");
      setAvatarUrl(userProfile.avatarUrl || AVATAR_OPTIONS[0]);
      setCity(userProfile.location?.city || "");
      setState(userProfile.location?.state || "");
      setCountry(userProfile.location?.country || "");
    }
  }, [userProfile]);

  // Toggle edit mode
  const toggleEditMode = () => {
    playSound("click");
    setIsEditing(!isEditing);
  };

  // Save profile changes
  const saveProfile = async () => {
    if (!username.trim()) {
      showModal({
        title: "Missing Information",
        message: "Please enter a username for your champion profile!",
        type: "warning",
      });
      return;
    }

    try {
      playSound("click");

      await updateProfile({
        username: username.trim(),
        avatarUrl,
        location: {
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
        },
      });

      setIsEditing(false);

      showModal({
        title: "Profile Updated!",
        message: "Your legendary champion profile has been updated successfully!",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    showModal({
      title: "Sign Out",
      message: "Are you sure you want to leave your legendary journey for now?",
      type: "warning",
      confirmText: "Sign Out",
      cancelText: "Stay",
      onConfirm: async () => {
        await signOut();
        navigate("/");
      },
    });
  };

  // Calculate profile completion percentage
  const getProfileCompletionPercentage = () => {
    if (!userProfile) return 0;

    let points = 0;
    const total = 5;

    if (userProfile.username) points++;
    if (userProfile.avatarUrl) points++;
    if (userProfile.location?.city) points++;
    if (userProfile.location?.state) points++;
    if (userProfile.location?.country) points++;

    return Math.round((points / total) * 100);
  };

  // Calculate user level and rank
  const getUserLevel = () => Math.floor((userProfile?.coins || 0) / 100) + 1;
  const getProgressToNextLevel = () => ((userProfile?.coins || 0) % 100) / 100;
  const getRankTitle = () => {
    const level = getUserLevel();
    if (level >= 50) return "Legendary Master";
    if (level >= 30) return "Elite Champion";
    if (level >= 20) return "Grand Champion";
    if (level >= 10) return "Champion";
    if (level >= 5) return "Rising Star";
    return "Novice Champion";
  };

  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-25 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-purple-800">Loading your legendary profile...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = getProfileCompletionPercentage();
  const userLevel = getUserLevel();
  const progressToNext = getProgressToNextLevel();
  const rankTitle = getRankTitle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-25 to-pink-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: `linear-gradient(135deg, ${
                ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][Math.floor(Math.random() * 4)]
              }, ${
                ['#A78BFA', '#67E8F9', '#34D399', '#FBBF24'][Math.floor(Math.random() * 4)]
              })`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 py-8 px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
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

          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Champion Profile
          </h1>
          <p className="text-xl text-purple-600 font-medium">
            Customize your legendary identity!
          </p>
        </motion.div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
              {/* Profile Header */}
              <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 p-8">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 text-6xl">👑</div>
                  <div className="absolute bottom-4 left-4 text-4xl">⚡</div>
                </div>

                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center">
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
                        <img
                          src={userProfile.avatarUrl || AVATAR_OPTIONS[0]}
                          alt={userProfile.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                        <Star size={16} className="text-purple-700" />
                      </div>
                    </motion.div>

                    <div className="ml-6 text-white">
                      <h2 className="text-3xl font-bold mb-1">{userProfile.username}</h2>
                      <div className="flex items-center mb-2">
                        <Shield size={18} className="mr-2 text-yellow-300" />
                        <span className="text-yellow-300 font-medium">{rankTitle}</span>
                      </div>
                      {userProfile.location?.city && (
                        <div className="flex items-center text-white/80">
                          <MapPin size={16} className="mr-1" />
                          <span>
                            {[
                              userProfile.location.city,
                              userProfile.location.state,
                              userProfile.location.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <motion.button
                    onClick={toggleEditMode}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isEditing ? <CheckCircle size={24} /> : <Edit size={24} />}
                  </motion.button>
                </div>

                {/* Level Progress */}
                <div className="mt-6 relative z-10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/90 font-medium">Level {userLevel}</span>
                    <span className="text-white/90 text-sm">
                      {(userProfile.coins || 0) % 100}/100 XP
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNext * 100}%` }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              {/* Profile Content */}
              <div className="p-8">
                {isEditing ? (
                  /* Edit Form */
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Champion Name
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-300"
                        placeholder="Enter your champion name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avatar Selection
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {AVATAR_OPTIONS.map((avatar, index) => (
                          <motion.div
                            key={index}
                            className={`cursor-pointer rounded-2xl overflow-hidden border-3 transition-all ${
                              avatarUrl === avatar
                                ? "border-purple-500 shadow-lg shadow-purple-500/25 scale-105"
                                : "border-gray-200 hover:border-purple-300 hover:scale-102"
                            }`}
                            onClick={() => {
                              setAvatarUrl(avatar);
                              playSound("click");
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <img
                              src={avatar}
                              alt={`Avatar option ${index + 1}`}
                              className="w-full h-24 object-cover"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-300"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-300"
                          placeholder="State/Province"
                        />
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-300"
                          placeholder="Country"
                        />
                      </div>
                    </div>

                    <motion.button
                      onClick={saveProfile}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center justify-center">
                        <CheckCircle size={20} className="mr-2" />
                        Save Champion Profile
                      </span>
                    </motion.button>
                  </motion.div>
                ) : (
                  /* Display Profile */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl text-center">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Coin size={20} className="text-white" />
                        </div>
                        <div className="text-sm text-purple-600 mb-1">Coins</div>
                        <div className="font-bold text-purple-900 text-xl">
                          {userProfile.coins}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl text-center">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Target size={20} className="text-white" />
                        </div>
                        <div className="text-sm text-green-600 mb-1">Quests</div>
                        <div className="font-bold text-green-900 text-xl">
                          {userProfile.completedTasks?.length || 0}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl text-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Users size={20} className="text-white" />
                        </div>
                        <div className="text-sm text-blue-600 mb-1">Friends</div>
                        <div className="font-bold text-blue-900 text-xl">
                          {userProfile.friendsList?.length || 0}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-2xl text-center">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Star size={20} className="text-white" />
                        </div>
                        <div className="text-sm text-yellow-600 mb-1">Level</div>
                        <div className="font-bold text-yellow-900 text-xl">{userLevel}</div>
                      </div>
                    </div>

                    {/* Profile Completion */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-medium text-gray-700">
                          Profile Completion
                        </span>
                        <span className="text-lg font-bold text-purple-600">
                          {completionPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${completionPercentage}%` }}
                          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* User ID Section */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        Champion ID
                      </h3>
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-200">
                        <p className="text-gray-600 mb-2 text-sm">
                          Share this ID with friends to connect:
                        </p>
                        <div className="bg-white p-3 rounded-xl font-mono text-sm break-all border border-purple-200">
                          {userProfile.friendlyUserId || currentUser.uid}
                        </div>
                      </div>
                    </div>

                    {/* Sign Out Button */}
                    <motion.button
                      onClick={handleSignOut}
                      className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center justify-center">
                        <LogOut size={20} className="mr-2" />
                        Sign Out
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {/* Achievement Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-purple-100">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6">
                <div className="flex items-center text-white">
                  <Trophy size={24} className="mr-3" />
                  <h3 className="text-xl font-bold">Achievements</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center p-3 bg-yellow-50 rounded-xl">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                    <Rocket size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">First Steps</div>
                    <div className="text-sm text-gray-600">Profile created!</div>
                  </div>
                </div>

                {(userProfile.completedTasks?.length || 0) > 0 && (
                  <div className="flex items-center p-3 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                      <Target size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Quest Master</div>
                      <div className="text-sm text-gray-600">
                        Completed {userProfile.completedTasks?.length} quests
                      </div>
                    </div>
                  </div>
                )}

                {(userProfile.coins || 0) >= 100 && (
                  <div className="flex items-center p-3 bg-purple-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                      <Gem size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Coin Collector</div>
                      <div className="text-sm text-gray-600">Earned 100+ coins</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-purple-100">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                <div className="flex items-center text-white">
                  <Zap size={24} className="mr-3" />
                  <h3 className="text-xl font-bold">Champion Stats</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rank</span>
                  <span className="font-bold text-purple-900">{rankTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Level</span>
                  <span className="font-bold text-purple-900">{userLevel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total XP</span>
                  <span className="font-bold text-purple-900">
                    {userProfile.coins || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Next Level</span>
                  <span className="font-bold text-purple-900">
                    {100 - ((userProfile.coins || 0) % 100)} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl shadow-xl overflow-hidden text-white p-6">
              <div className="flex items-center mb-4">
                <Sparkles size={24} className="mr-3" />
                <h3 className="text-xl font-bold">Coming Soon!</h3>
              </div>
              <p className="mb-4 opacity-90">Exciting new features:</p>
              <ul className="space-y-2 opacity-90">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  Champion Badges
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  Magic Shop
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  Guild System
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  Epic Tournaments
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;