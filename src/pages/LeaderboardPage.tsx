import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Users, MapPin, Filter, Search } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db, getBasePath } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useSound } from "../contexts/SoundContext";

interface LeaderboardUser {
  id: string; // Firebase UID
  friendlyUserId: string; // User-friendly ID
  username: string;
  avatarUrl: string;
  coins: number;
  location: {
    city: string;
    state: string;
    country: string;
  };
}

type FilterType = "global" | "country" | "state" | "city" | "friends";

const LeaderboardPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { playSound } = useSound();

  const [allUsers, setAllUsers] = useState<LeaderboardUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("global");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users for leaderboard
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const usersRef = collection(db, `${getBasePath()}/users`);
        const querySnapshot = await getDocs(usersRef);

        const users: LeaderboardUser[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as Omit<LeaderboardUser, "id">;
          users.push({
            id: doc.id, // Firebase document ID
            ...userData,
          });
        });

        // Sort by coins (descending)
        users.sort((a, b) => b.coins - a.coins);

        setAllUsers(users);
        setFilteredUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Apply filter when changed
  useEffect(() => {
    if (!userProfile) return;

    let filtered = [...allUsers];

    // Apply search filter first
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.friendlyUserId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply location/friends filter
    switch (activeFilter) {
      case "country":
        filtered = filtered.filter(
          (user) => user.location?.country === userProfile.location?.country
        );
        break;
      case "state":
        filtered = filtered.filter(
          (user) =>
            user.location?.state === userProfile.location?.state &&
            user.location?.country === userProfile.location?.country
        );
        break;
      case "city":
        filtered = filtered.filter(
          (user) =>
            user.location?.city === userProfile.location?.city &&
            user.location?.state === userProfile.location?.state &&
            user.location?.country === userProfile.location?.country
        );
        break;
      case "friends":
        filtered = filtered.filter((user) =>
          userProfile.friendsList?.includes(user.id)
        );
        break;
      default:
        // Global - no additional filtering
        break;
    }

    setFilteredUsers(filtered);
  }, [activeFilter, allUsers, userProfile, searchTerm]);

  // Change filter type
  const changeFilter = (filter: FilterType) => {
    playSound("click");
    setActiveFilter(filter);
  };

  // Get filter display name
  const getFilterName = () => {
    switch (activeFilter) {
      case "global":
        return "Global Champions";
      case "country":
        return "My Kingdom";
      case "state":
        return "My Village";
      case "city":
        return "My Neighborhood";
      case "friends":
        return "My Alliance";
    }
  };

  // Get medal for top 3 users
  const getMedal = (index: number) => {
    if (index === 0) {
      return <Trophy size={24} className="text-yellow-500" />;
    } else if (index === 1) {
      return <Medal size={24} className="text-gray-400" />;
    } else if (index === 2) {
      return <Medal size={24} className="text-amber-700" />;
    }
    return null;
  };

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="py-6">
      <div className="mb-8 text-center">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-purple-900 mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Champions Hall of Fame
        </motion.h1>
        <motion.p
          className="text-purple-600"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          See the top legendary champions in the KidQuest world!
        </motion.p>
      </div>

      {/* Filter Tabs */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => changeFilter("global")}
            className={`px-4 py-2 rounded-full flex items-center ${
              activeFilter === "global"
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-800 hover:bg-purple-200"
            }`}
          >
            <Trophy size={18} className="mr-2" />
            Global Champions
          </button>
          <button
            onClick={() => changeFilter("country")}
            className={`px-4 py-2 rounded-full flex items-center ${
              activeFilter === "country"
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-800 hover:bg-purple-200"
            }`}
          >
            <MapPin size={18} className="mr-2" />
            My Kingdom
          </button>
          <button
            onClick={() => changeFilter("state")}
            className={`px-4 py-2 rounded-full flex items-center ${
              activeFilter === "state"
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-800 hover:bg-purple-200"
            }`}
          >
            <MapPin size={18} className="mr-2" />
            My Village
          </button>
          <button
            onClick={() => changeFilter("city")}
            className={`px-4 py-2 rounded-full flex items-center ${
              activeFilter === "city"
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-800 hover:bg-purple-200"
            }`}
          >
            <MapPin size={18} className="mr-2" />
            My Neighborhood
          </button>
          <button
            onClick={() => changeFilter("friends")}
            className={`px-4 py-2 rounded-full flex items-center ${
              activeFilter === "friends"
                ? "bg-purple-600 text-white"
                : "bg-purple-100 text-purple-800 hover:bg-purple-200"
            }`}
          >
            <Users size={18} className="mr-2" />
            My Alliance
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        className="mb-6 max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="storybook-input w-full pl-10"
            placeholder="Search champions..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        className="bg-white rounded-2xl shadow-md overflow-hidden border-2 border-purple-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-purple-50 p-4 border-b-2 border-purple-100">
          <div className="flex items-center">
            <Filter size={20} className="text-purple-600 mr-2" />
            <h2 className="font-bold text-purple-900">{getFilterName()}</h2>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-600">Loading the champions...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Trophy size={48} className="text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-purple-900 mb-2">
              No Champions Found
            </h3>
            <p className="text-purple-600">
              {activeFilter === "friends"
                ? "Add some champion friends to see them on the leaderboard!"
                : "Try a different filter to see more champions!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-purple-50">
                  <th className="py-3 px-4 text-left text-sm font-medium text-purple-900">
                    Rank
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-purple-900">
                    Champion
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-purple-900">
                    Champion ID
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-purple-900">
                    Location
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-purple-900">
                    Coins
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {filteredUsers.map((user, index) => {
                  const isCurrentUser = user.id === userProfile?.userId;

                  return (
                    <motion.tr
                      key={user.id}
                      className={`${
                        isCurrentUser ? "bg-purple-50" : "hover:bg-gray-50"
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.3 }}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className="font-medium text-purple-900 mr-2">
                            {index + 1}
                          </span>
                          {index < 3 && getMedal(index)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                            <img
                              src={user.avatarUrl}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span
                            className={`font-medium ${
                              isCurrentUser
                                ? "text-purple-700"
                                : "text-gray-900"
                            }`}
                          >
                            {user.username}
                            {isCurrentUser && (
                              <span className="ml-2 text-purple-500">
                                (You)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-gray-600">
                        {user.friendlyUserId}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {user.location?.city ? (
                          <div className="flex items-center">
                            <MapPin size={16} className="text-gray-400 mr-1" />
                            <span>
                              {user.location.city}, {user.location.country}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unknown</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 font-medium">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 2a6 6 0 100 12 6 6 0 000-12z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {user.coins}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LeaderboardPage;