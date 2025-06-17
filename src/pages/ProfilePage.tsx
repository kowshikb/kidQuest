import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Edit,
  CheckCircle,
  LogOut,
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
  Camera,
  Save,
  X,
  Heart,
  Smile,
  Map,
  Brush,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";
import { useModal } from "../contexts/ModalContext";
import { useNavigate } from "react-router-dom";
import { useAppStats } from "../hooks/useAppStats";
import GlassCard from "../components/GlassCard";
import KidFriendlyLoader from "../components/KidFriendlyLoader";
import UnifiedBackground from "../components/UnifiedBackground";

// Define avatar options
const AVATAR_OPTIONS = [
  "https://images.pexels.com/photos/1416736/pexels-photo-1416736.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/3608439/pexels-photo-3608439.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/3662845/pexels-photo-3662845.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/4588465/pexels-photo-4588465.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/4010442/pexels-photo-4010442.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=150",
];

const FloatingShape: React.FC<{ className: string; delay: number }> = ({
  className,
  delay,
}) => (
  <motion.div
    className={`absolute rounded-full opacity-15 ${className}`}
    animate={{
      y: [0, -40, 0],
      x: [0, 20, 0],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  gradient: string;
  isLoading?: boolean;
}> = ({ icon, label, value, gradient, isLoading = false }) => (
  <GlassCard gradient={gradient} className="text-center">
    <div
      className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}
    >
      {icon}
    </div>
    {isLoading ? (
      <div className="h-8 w-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse mx-auto mb-1"></div>
    ) : (
      <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
    )}
    <p className="text-sm text-gray-600">{label}</p>
  </GlassCard>
);

const BadgeCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  earned: boolean;
}> = ({ icon, title, description, earned }) => (
  <GlassCard
    className={`text-center ${earned ? "ring-2 ring-amber-300" : "opacity-60"}`}
  >
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
    <p className="text-xs text-gray-600">{description}</p>
    {earned && (
      <div className="mt-2 inline-flex items-center text-amber-600 text-xs font-medium">
        <Trophy className="w-3 h-3 mr-1" />
        Earned
      </div>
    )}
  </GlassCard>
);

const JourneyMilestone: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  date: string;
  gradient: string;
}> = ({ icon, title, description, date, gradient }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-start space-x-4"
  >
    <div
      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}
    >
      {icon}
    </div>
    <GlassCard className="flex-1">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-500">{date}</span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </GlassCard>
  </motion.div>
);

const ProfilePage: React.FC = () => {
  const { currentUser, userProfile, updateProfile, signOut } = useAuth();
  const { playSound } = useSound();
  const { showModal } = useModal();
  const navigate = useNavigate();
  const appStats = useAppStats();

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(userProfile?.username || "");
  const [age, setAge] = useState(userProfile?.age || "");
  const [avatarUrl, setAvatarUrl] = useState(
    userProfile?.avatarUrl || AVATAR_OPTIONS[0]
  );
  const [city, setCity] = useState(userProfile?.location?.city || "");
  const [state, setState] = useState(userProfile?.location?.state || "");
  const [country, setCountry] = useState(userProfile?.location?.country || "");

  // State for validation errors
  const [ageError, setAgeError] = useState("");

  // Initialize form with user profile data
  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || "");
      setAge(userProfile.age || "");
      setAvatarUrl(userProfile.avatarUrl || AVATAR_OPTIONS[0]);
      setCity(userProfile.location?.city || "");
      setState(userProfile.location?.state || "");
      setCountry(userProfile.location?.country || "");
      setAgeError("");
    }
  }, [userProfile]);

  // Age validation function
  const validateAge = (ageValue: string): boolean => {
    setAgeError("");

    if (!ageValue) {
      setAgeError("Age is required");
      return false;
    }

    // Check if it's a number
    const numericAge = parseInt(ageValue);
    if (isNaN(numericAge) || ageValue.includes(".") || ageValue.includes("-")) {
      setAgeError("Age must be a whole number");
      return false;
    }

    // Check range 2-100
    if (numericAge < 2 || numericAge > 100) {
      setAgeError("Age must be between 2 and 100");
      return false;
    }

    return true;
  };

  // Check if the form is valid for saving
  const isFormValid = (): boolean => {
    if (!username.trim()) {
      return false; // Username is required
    }

    // If age is provided, it must be valid
    if (age) {
      const numericAge = parseInt(age.toString());
      if (
        isNaN(numericAge) ||
        age.toString().includes(".") ||
        age.toString().includes("-")
      ) {
        return false; // Invalid age format
      }
      if (numericAge < 2 || numericAge > 100) {
        return false; // Age out of range
      }
    }

    return true; // Form is valid
  };

  // Handle age input with validation
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only numbers (no decimals, negatives, or letters)
    if (value === "" || /^\d{1,3}$/.test(value)) {
      setAge(value);
      if (value !== "") {
        validateAge(value);
      } else {
        setAgeError("");
      }
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    playSound("click");
    setIsEditing(!isEditing);
    setAgeError(""); // Clear any validation errors
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

    // Validate age if provided
    if (age && !validateAge(age.toString())) {
      return; // Don't save if age validation fails
    }

    try {
      playSound("click");

      await updateProfile({
        username: username.trim(),
        age: age ? parseInt(age.toString()) : undefined,
        avatarUrl,
        location: {
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
        },
      });

      setIsEditing(false);
      setAgeError("");

      showModal({
        title: "Profile Updated!",
        message:
          "Your legendary champion profile has been updated successfully!",
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
    const total = 6;

    if (userProfile.username) points++;
    if (userProfile.age) points++;
    if (userProfile.avatarUrl) points++;
    if (userProfile.location?.city) points++;
    if (userProfile.location?.state) points++;
    if (userProfile.location?.country) points++;

    return Math.round((points / total) * 100);
  };

  if (!currentUser || !userProfile) {
    return (
      <KidFriendlyLoader
        title="Loading Your Champion Profile"
        subtitle="Preparing your amazing achievements and progress! 🏆👑"
      />
    );
  }

  const completionPercentage = getProfileCompletionPercentage();

  // Sample badges data
  const badges = [
    {
      icon: "🏆",
      title: "First Quest",
      description: "Completed your first quest",
      earned: appStats.completedQuests > 0,
    },
    {
      icon: "🎨",
      title: "Creative Soul",
      description: "Finished a hobby",
      earned: appStats.completedHobbies > 0,
    },
    {
      icon: "👥",
      title: "Social Butterfly",
      description: "Made 5 friends",
      earned: (userProfile.friendsList?.length || 0) >= 5,
    },
    {
      icon: "⭐",
      title: "Rising Star",
      description: "Reached level 5",
      earned: userProfile.level >= 5,
    },
    {
      icon: "💎",
      title: "Coin Collector",
      description: "Earned 500 coins",
      earned: userProfile.coins >= 500,
    },
    {
      icon: "🚀",
      title: "Explorer",
      description: "Joined 3 rooms",
      earned: false,
    },
  ];

  // Sample journey milestones
  const journeyMilestones = [
    {
      icon: <Star className="w-6 h-6" />,
      title: "Champion Journey Begins",
      description: "Welcome to KidQuest! Your adventure starts here.",
      date: "Today",
      gradient: "from-purple-400 to-indigo-600",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "First Quest Completed",
      description: "You completed your first life values quest!",
      date: "2 days ago",
      gradient: "from-rose-400 to-pink-600",
    },
    {
      icon: <Brush className="w-6 h-6" />,
      title: "Creative Hobby Started",
      description: "You began your first creative hobby journey.",
      date: "1 week ago",
      gradient: "from-purple-400 to-indigo-600",
    },
  ];

  return (
    <UnifiedBackground>
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            My Champion Profile
          </h1>
          <p className="text-xl text-gray-600">
            Track your amazing journey and customize your profile
          </p>
        </motion.div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-8">
            {/* Avatar & Basic Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <GlassCard size="lg" className="text-center">
                <div className="relative inline-block mb-6">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => {
                        /* Avatar selection logic */
                      }}
                      className="absolute top-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-white/60 backdrop-blur-lg border border-white/30 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-transparent text-center text-xl font-bold"
                      placeholder="Your Champion Name"
                    />
                    <input
                      type="number"
                      value={age}
                      onChange={handleAgeChange}
                      className="w-full px-4 py-3 bg-white/60 backdrop-blur-lg border border-white/30 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-transparent text-center text-lg"
                      placeholder="Your Age"
                      min="2"
                      max="100"
                    />
                    {ageError && (
                      <p className="text-xs text-red-500">{ageError}</p>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={saveProfile}
                        disabled={!isFormValid()}
                        className={`flex-1 px-4 py-2 rounded-xl transition-all flex items-center justify-center space-x-2 ${
                          isFormValid()
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={toggleEditMode}
                        className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      {userProfile.username}
                    </h2>
                    <p className="text-lg text-gray-600 mb-4">
                      {userProfile.rankTitle}
                    </p>
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-blue-500" />
                        <span className="font-bold text-gray-700">
                          Level {userProfile.level}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-purple-500" />
                        <span className="font-bold text-gray-700">
                          {userProfile.friendlyUserId}
                        </span>
                      </div>
                      {userProfile.age && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-green-500" />
                          <span className="font-bold text-gray-700">
                            Age {userProfile.age}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={toggleEditMode}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center space-x-2 mx-auto"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                )}
              </GlassCard>
            </motion.div>

            {/* Stats Grid - Now with 7 cards including Total Tasks */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 gap-4"
            >
              <StatCard
                icon={<Smile className="w-6 h-6" />}
                label="Magic Coins"
                value={userProfile.coins}
                gradient="from-amber-400 to-orange-600"
              />
              <StatCard
                icon={<Map className="w-6 h-6" />}
                label="Quests Done"
                value={appStats.completedQuests}
                gradient="from-emerald-400 to-teal-600"
              />
              <StatCard
                icon={<Brush className="w-6 h-6" />}
                label="Hobbies Done"
                value={appStats.completedHobbies}
                gradient="from-purple-400 to-indigo-600"
                isLoading={appStats.loading.hobbies}
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                label="Friends"
                value={userProfile.friendsList?.length || 0}
                gradient="from-blue-400 to-cyan-600"
              />
              <StatCard
                icon={<CheckCircle className="w-6 h-6" />}
                label="Total Tasks"
                value={appStats.totalTasksCompleted ?? "--"}
                gradient="from-rose-400 to-pink-600"
                isLoading={appStats.loading.auth}
              />
              <StatCard
                icon={<Trophy className="w-6 h-6" />}
                label="Level"
                value={userProfile.level}
                gradient="from-violet-400 to-purple-600"
              />
              <StatCard
                icon={<Star className="w-6 h-6" />}
                label="Rank"
                value={userProfile.rankTitle?.split(" ")[0] || "Novice"}
                gradient="from-indigo-400 to-blue-600"
              />
            </motion.div>

            {/* XP Progress */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <GlassCard>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Progress to Level {userProfile.level + 1}
                  </span>
                  <span className="text-sm font-bold text-gray-700">
                    {userProfile.experience}/100 XP
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((userProfile.experience || 0) / 100) * 100}%`,
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </GlassCard>
            </motion.div>

            {/* Sign Out Button */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <button
                onClick={handleSignOut}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all flex items-center justify-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </motion.div>
          </div>

          {/* Right Column - Journey & Badges */}
          <div className="lg:col-span-2 space-y-8">
            {/* Badges Section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Achievement Badges
                </h3>
                <p className="text-gray-600">
                  Collect badges as you complete amazing challenges
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((badge, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    <BadgeCard {...badge} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Journey Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  My Journey
                </h3>
                <p className="text-gray-600">
                  Track your amazing adventure milestones
                </p>
              </div>
              <div className="space-y-6 border-l-4 border-indigo-200 pl-8">
                {journeyMilestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 * index }}
                  >
                    <JourneyMilestone {...milestone} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </UnifiedBackground>
  );
};

export default ProfilePage;
