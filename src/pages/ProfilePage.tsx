import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Edit,
  CheckCircle,
  LogOut,
  Coins as Coin,
  Award,
  Users,
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
        message: "Please enter a username for your profile!",
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
        message: "Your magical profile has been updated successfully!",
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
      message: "Are you sure you want to leave your magical journey for now?",
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

  if (!currentUser || !userProfile) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-purple-800">Loading your magical profile...</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-8 text-center">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-purple-900 mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          My Magical Profile
        </motion.h1>
        <motion.p
          className="text-purple-600"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Customize your adventure identity!
        </motion.p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          className="md:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border-2 border-purple-100">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Explorer Profile</h2>
              <button
                onClick={toggleEditMode}
                className="p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-colors"
              >
                {isEditing ? <CheckCircle size={20} /> : <Edit size={20} />}
              </button>
            </div>

            <div className="p-6">
              {isEditing ? (
                /* Edit Form */
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="username\"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="storybook-input w-full"
                      placeholder="Enter your explorer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avatar
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {AVATAR_OPTIONS.map((avatar, index) => (
                        <div
                          key={index}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            avatarUrl === avatar
                              ? "border-purple-500 shadow-md"
                              : "border-gray-200 hover:border-purple-300"
                          }`}
                          onClick={() => {
                            setAvatarUrl(avatar);
                            playSound("click");
                          }}
                        >
                          <img
                            src={avatar}
                            alt={`Avatar option ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="storybook-input w-full"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="storybook-input w-full"
                          placeholder="State/Province"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="storybook-input w-full"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button onClick={saveProfile} className="btn-magic w-full">
                      <span className="flex items-center justify-center">
                        <CheckCircle size={18} className="mr-2" />
                        Save Profile
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Profile */
                <div>
                  <div className="flex flex-col md:flex-row items-center md:items-start">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 md:mb-0 md:mr-6 border-4 border-purple-200">
                      <img
                        src={userProfile.avatarUrl || AVATAR_OPTIONS[0]}
                        alt={userProfile.username}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-purple-900 mb-1">
                        {userProfile.username}
                      </h3>

                      <div className="mb-4">
                        {userProfile.location?.city && (
                          <p className="text-gray-600 flex items-center justify-center md:justify-start">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {[
                              userProfile.location.city,
                              userProfile.location.state,
                              userProfile.location.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-50 p-3 rounded-xl text-center">
                          <div className="text-sm text-purple-600 mb-1">
                            Coins
                          </div>
                          <div className="font-bold text-purple-900 text-xl">
                            {userProfile.coins}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-xl text-center">
                          <div className="text-sm text-purple-600 mb-1">
                            Quests
                          </div>
                          <div className="font-bold text-purple-900 text-xl">
                            {userProfile.completedTasks?.length || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        Profile Completion
                      </span>
                      <span className="text-sm font-medium text-purple-600">
                        {getProfileCompletionPercentage()}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-purple-600 h-2.5 rounded-full"
                        style={{
                          width: `${getProfileCompletionPercentage()}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-gray-600 mb-2">
                      User ID (Share with friends to connect):
                    </p>
                    <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                      {userProfile.friendlyUserId || currentUser.uid}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 flex items-center justify-center"
                    >
                      <LogOut size={18} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats & Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border-2 border-purple-100">
              <div className="p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-4">
                  Adventure Stats
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-purple-50 rounded-xl">
                    <div className="p-2 bg-purple-100 rounded-full mr-4">
                      <Coin size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-purple-600">Total Coins</div>
                      <div className="font-bold text-purple-900">
                        {userProfile.coins}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-green-50 rounded-xl">
                    <div className="p-2 bg-green-100 rounded-full mr-4">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-green-600">
                        Quests Completed
                      </div>
                      <div className="font-bold text-green-900">
                        {userProfile.completedTasks?.length || 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-yellow-50 rounded-xl">
                    <div className="p-2 bg-yellow-100 rounded-full mr-4">
                      <Award size={20} className="text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-sm text-yellow-600">
                        Leaderboard Rank
                      </div>
                      <div className="font-bold text-yellow-900">
                        {/* This would be dynamically calculated in a real app */}
                        Coming Soon
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-blue-50 rounded-xl">
                    <div className="p-2 bg-blue-100 rounded-full mr-4">
                      <Users size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-blue-600">Friends</div>
                      <div className="font-bold text-blue-900">
                        {userProfile.friendsList?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-md overflow-hidden text-white p-6">
              <h3 className="text-lg font-bold mb-2">Coming Soon!</h3>
              <p className="mb-4 opacity-90">
                Exciting new features are on the way:
              </p>
              <ul className="space-y-2 opacity-90">
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L11 10.586V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Magic Shop for Rewards
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L11 10.586V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Custom Badge Collection
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L11 10.586V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Team Challenges
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
