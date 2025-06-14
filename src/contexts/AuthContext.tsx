import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, getBasePath } from "../firebase/config";
import { useModal } from "./ModalContext";
import { useSound } from "./SoundContext";

const AVATAR_OPTIONS = [
  "https://images.pexels.com/photos/1416736/pexels-photo-1416736.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/3608439/pexels-photo-3608439.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/3662845/pexels-photo-3662845.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/4588465/pexels-photo-4588465.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/4010442/pexels-photo-4010442.jpeg?auto=compress&cs=tinysrgb&w=150",
  "https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=150",
];

// Generate a unique user-friendly ID (KQ + 6 digits)
const generateFriendlyUserId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `KQ${timestamp.slice(0, 3)}${random}`;
};

interface UserProfile {
  userId: string;
  friendlyUserId: string;
  username: string;
  avatarUrl: string;
  coins: number;
  // ✅ DYNAMIC LEVEL SYSTEM - All calculated and stored in DB
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalExperience: number;
  rankTitle: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  completedTasks: string[];
  friendsList: string[];
  createdAt: any;
  lastActive: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addCompletedTask: (taskId: string, coinsEarned: number) => Promise<void>;
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

// ✅ FIXED MATH - Dynamic level calculation functions
const calculateLevel = (totalExperience: number): number => {
  return Math.floor(totalExperience / 100) + 1;
};

const calculateExperienceInCurrentLevel = (totalExperience: number): number => {
  return totalExperience % 100;
};

const calculateExperienceToNextLevel = (totalExperience: number): number => {
  return 100 - (totalExperience % 100);
};

const getRankTitle = (level: number): string => {
  if (level >= 50) return "Legendary Master";
  if (level >= 30) return "Elite Champion";
  if (level >= 20) return "Grand Champion";
  if (level >= 10) return "Champion";
  if (level >= 5) return "Rising Star";
  return "Novice Champion";
};

const defaultUserProfile: UserProfile = {
  userId: "",
  friendlyUserId: "",
  username: "New Champion",
  avatarUrl: AVATAR_OPTIONS[0],
  coins: 0,
  // ✅ DYNAMIC LEVEL SYSTEM - Default values
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  totalExperience: 0,
  rankTitle: "Novice Champion",
  location: {
    city: "Adventure City",
    state: "Questland",
    country: "Imagination",
  },
  completedTasks: [],
  friendsList: [],
  createdAt: null,
  lastActive: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showModal } = useModal();
  const { playSound } = useSound();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Start profile fetch but don't wait for it to complete before setting loading to false
        fetchUserProfileOptimized(user.uid);
        // Update last active timestamp in background
        updateLastActiveBackground(user.uid);
      } else {
        setUserProfile(null);
      }
      
      // Set loading to false immediately after auth state is determined
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ✅ AUTOMATIC CHAMPION NAME UPDATE - Helper function
  const updateExplorerToChampion = (profile: UserProfile): UserProfile => {
    if (profile.username && profile.username.startsWith("Explorer")) {
      const updatedUsername = profile.username.replace(/^Explorer/, "Champion");
      return {
        ...profile,
        username: updatedUsername
      };
    }
    return profile;
  };

  // ✅ FIXED MATH - Update level data based on total experience
  const updateLevelData = (profile: UserProfile): UserProfile => {
    const totalExp = profile.totalExperience || profile.coins || 0; // Use coins as experience if totalExperience not set
    
    return {
      ...profile,
      totalExperience: totalExp,
      level: calculateLevel(totalExp),
      experience: calculateExperienceInCurrentLevel(totalExp), // ✅ CORRECT: This gives current level progress (0-99)
      experienceToNextLevel: calculateExperienceToNextLevel(totalExp), // ✅ CORRECT: This gives XP needed for next level
      rankTitle: getRankTitle(calculateLevel(totalExp)),
    };
  };

  // Optimized profile fetching with immediate fallback
  const fetchUserProfileOptimized = async (userId: string) => {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
      );
      
      const fetchPromise = getDoc(userRef);
      
      try {
        const userSnap = await Promise.race([fetchPromise, timeoutPromise]) as any;
        
        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          let completeProfile = {
            ...defaultUserProfile,
            ...profileData,
            userId: userId,
            location: {
              ...defaultUserProfile.location,
              ...profileData.location,
            },
          };

          // ✅ AUTOMATIC FIX: Update Explorer usernames to Champion
          const originalUsername = completeProfile.username;
          completeProfile = updateExplorerToChampion(completeProfile);
          
          // ✅ FIXED MATH: Update level data with correct calculations
          completeProfile = updateLevelData(completeProfile);
          
          // If username or level data was updated, save it to the database
          const needsUpdate = originalUsername !== completeProfile.username || 
                             !profileData.level || 
                             !profileData.totalExperience;
          
          if (needsUpdate) {
            console.log(`Updating profile data for user ${userId}`);
            try {
              await updateDoc(userRef, {
                username: completeProfile.username,
                level: completeProfile.level,
                experience: completeProfile.experience,
                experienceToNextLevel: completeProfile.experienceToNextLevel,
                totalExperience: completeProfile.totalExperience,
                rankTitle: completeProfile.rankTitle,
              });
            } catch (updateError) {
              console.warn("Could not update profile in database:", updateError);
            }
          }

          setUserProfile(completeProfile);
        } else {
          createNewUserProfileBackground(userId);
        }
      } catch (timeoutError) {
        console.warn("Profile fetch timed out, using temporary profile");
        createTemporaryProfile(userId);
        fetchUserProfileBackground(userId);
      }
    } catch (error) {
      console.error("Error in optimized profile fetch:", error);
      createTemporaryProfile(userId);
    }
  };

  // Create temporary profile for immediate UI display
  const createTemporaryProfile = (userId: string) => {
    const tempProfile = {
      ...defaultUserProfile,
      userId: userId,
      friendlyUserId: generateFriendlyUserId(),
      username: `Champion${Math.floor(Math.random() * 10000)}`,
      avatarUrl: AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)],
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    };
    setUserProfile(tempProfile);
  };

  // Background profile creation
  const createNewUserProfileBackground = async (userId: string) => {
    try {
      const friendlyUserId = generateFriendlyUserId();
      const newProfile = {
        ...defaultUserProfile,
        userId: userId,
        friendlyUserId: friendlyUserId,
        username: `Champion${Math.floor(Math.random() * 10000)}`,
        avatarUrl: AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)],
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      };
      
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      await setDoc(userRef, newProfile);
      setUserProfile(newProfile);
    } catch (error) {
      console.error("Background profile creation failed:", error);
    }
  };

  // Background profile fetching (retry mechanism)
  const fetchUserProfileBackground = async (userId: string, retryCount = 0) => {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profileData = userSnap.data() as UserProfile;
        let completeProfile = {
          ...defaultUserProfile,
          ...profileData,
          userId: userId,
          location: {
            ...defaultUserProfile.location,
            ...profileData.location,
          },
        };

        // ✅ AUTOMATIC FIX: Update Explorer usernames to Champion
        const originalUsername = completeProfile.username;
        completeProfile = updateExplorerToChampion(completeProfile);
        
        // ✅ FIXED MATH: Update level data with correct calculations
        completeProfile = updateLevelData(completeProfile);
        
        // If username or level data was updated, save it to the database
        const needsUpdate = originalUsername !== completeProfile.username || 
                           !profileData.level || 
                           !profileData.totalExperience;
        
        if (needsUpdate) {
          console.log(`Background update for user ${userId}`);
          try {
            await updateDoc(userRef, {
              username: completeProfile.username,
              level: completeProfile.level,
              experience: completeProfile.experience,
              experienceToNextLevel: completeProfile.experienceToNextLevel,
              totalExperience: completeProfile.totalExperience,
              rankTitle: completeProfile.rankTitle,
            });
          } catch (updateError) {
            console.warn("Could not update profile in background:", updateError);
          }
        }

        setUserProfile(completeProfile);
      } else if (retryCount < 2) {
        setTimeout(() => {
          fetchUserProfileBackground(userId, retryCount + 1);
        }, 1000 * (retryCount + 1));
      }
    } catch (error) {
      console.error("Background profile fetch error:", error);
      if (retryCount < 2) {
        setTimeout(() => {
          fetchUserProfileBackground(userId, retryCount + 1);
        }, 1000 * (retryCount + 1));
      }
    }
  };

  // Update user's last active timestamp in background
  const updateLastActiveBackground = async (userId: string) => {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      await updateDoc(userRef, {
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      console.warn("Could not update lastActive:", error);
    }
  };

  const signInAnonymouslyHandler = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
      playSound("success");
    } catch (error: any) {
      console.error("Anonymous sign-in error:", error);

      let userMessage = "Unable to continue anonymously. Please try again.";

      switch (error.code) {
        case "auth/operation-not-allowed":
          userMessage =
            "Anonymous sign-in is currently disabled. Please try signing in with email or Google.";
          break;
        case "auth/network-request-failed":
          userMessage =
            "Network connection error. Please check your internet and try again.";
          break;
        case "auth/too-many-requests":
          userMessage =
            "Too many attempts. Please wait a moment before trying again.";
          break;
        default:
          userMessage = "Unable to continue anonymously. Please try again.";
      }

      showModal({
        title: "Anonymous Sign In Failed",
        message: userMessage,
        type: "error",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      playSound("success");
    } catch (error: any) {
      console.error("Email login error:", error);

      let userMessage = "Unable to sign in. Please try again.";

      switch (error.code) {
        case "auth/invalid-credential":
          userMessage =
            "The email or password you entered is incorrect. Please check and try again.";
          break;
        case "auth/user-not-found":
          userMessage =
            "No account found with this email address. Would you like to create a new account?";
          break;
        case "auth/wrong-password":
          userMessage =
            "The password you entered is incorrect. Please try again.";
          break;
        case "auth/invalid-email":
          userMessage = "Please enter a valid email address.";
          break;
        case "auth/user-disabled":
          userMessage =
            "This account has been temporarily disabled. Please contact support.";
          break;
        case "auth/too-many-requests":
          userMessage =
            "Too many failed attempts. Please wait a moment before trying again.";
          break;
        case "auth/network-request-failed":
          userMessage =
            "Network connection error. Please check your internet and try again.";
          break;
        default:
          userMessage = "Unable to sign in. Please try again.";
      }

      showModal({
        title: "Sign In Failed",
        message: userMessage,
        type: "error",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      playSound("success");
    } catch (error: any) {
      console.error("Email signup error:", error);

      let userMessage = "Unable to create account. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          userMessage =
            "An account with this email already exists. Try signing in instead.";
          break;
        case "auth/invalid-email":
          userMessage = "Please enter a valid email address.";
          break;
        case "auth/weak-password":
          userMessage =
            "Password is too weak. Please use at least 6 characters with a mix of letters and numbers.";
          break;
        case "auth/operation-not-allowed":
          userMessage =
            "Email sign-up is currently disabled. Please try a different method.";
          break;
        case "auth/network-request-failed":
          userMessage =
            "Network connection error. Please check your internet and try again.";
          break;
        default:
          userMessage = "Unable to create account. Please try again.";
      }

      showModal({
        title: "Sign Up Failed",
        message: userMessage,
        type: "error",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        playSound("success");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);

      let userMessage = "Unable to sign in with Google. Please try again.";

      switch (error.code) {
        case "auth/popup-closed-by-user":
          return;
        case "auth/popup-blocked":
          userMessage =
            "Pop-up was blocked by your browser. Please allow pop-ups and try again.";
          break;
        case "auth/cancelled-popup-request":
          return;
        case "auth/network-request-failed":
          userMessage =
            "Network connection error. Please check your internet and try again.";
          break;
        case "auth/too-many-requests":
          userMessage =
            "Too many attempts. Please wait a moment before trying again.";
          break;
        case "auth/account-exists-with-different-credential":
          userMessage =
            "An account already exists with the same email but different sign-in method. Try signing in with email instead.";
          break;
        default:
          userMessage = "Unable to sign in with Google. Please try again.";
      }

      showModal({
        title: "Google Sign In Failed",
        message: userMessage,
        type: "error",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      playSound("click");
    } catch (error) {
      console.error("Sign out error:", error);
      showModal({
        title: "Sign Out Failed",
        message: "Could not close your session. Try again!",
        type: "error",
      });
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);
      await updateDoc(userRef, data);
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
      playSound("success");
    } catch (error) {
      console.error("Profile update error:", error);
      showModal({
        title: "Update Failed",
        message: "Could not update your profile.",
        type: "error",
      });
    }
  };

  // ✅ FIXED MATH - Update experience and level when completing tasks
  const addCompletedTask = async (taskId: string, coinsEarned: number) => {
    if (!currentUser || !userProfile) return;
    try {
      if (userProfile.completedTasks.includes(taskId)) return;

      const updatedTasks = [...userProfile.completedTasks, taskId];
      const updatedCoins = userProfile.coins + coinsEarned;
      
      // ✅ FIXED MATH - Calculate new level data correctly
      const newTotalExperience = updatedCoins; // Using coins as experience points
      const newLevel = calculateLevel(newTotalExperience);
      const newExperience = calculateExperienceInCurrentLevel(newTotalExperience); // ✅ CORRECT: 0-99 progress in current level
      const newExperienceToNext = calculateExperienceToNextLevel(newTotalExperience); // ✅ CORRECT: XP needed for next level
      const newRankTitle = getRankTitle(newLevel);

      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);

      // ✅ SAVE ALL LEVEL DATA TO DATABASE
      await updateDoc(userRef, {
        completedTasks: updatedTasks,
        coins: updatedCoins,
        totalExperience: newTotalExperience,
        level: newLevel,
        experience: newExperience,
        experienceToNextLevel: newExperienceToNext,
        rankTitle: newRankTitle,
      });

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              completedTasks: updatedTasks,
              coins: updatedCoins,
              totalExperience: newTotalExperience,
              level: newLevel,
              experience: newExperience,
              experienceToNextLevel: newExperienceToNext,
              rankTitle: newRankTitle,
            }
          : null
      );

      playSound("coin");
    } catch (error) {
      console.error("Task completion error:", error);
      showModal({
        title: "Task Error",
        message: "Could not mark task as completed.",
        type: "error",
      });
    }
  };

  const addFriend = async (friendId: string) => {
    if (!currentUser || !userProfile) return;
    try {
      if (userProfile.friendsList.includes(friendId)) return;

      const updatedFriends = [...userProfile.friendsList, friendId];
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);

      await updateDoc(userRef, {
        friendsList: updatedFriends,
      });

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              friendsList: updatedFriends,
            }
          : null
      );

      playSound("success");
    } catch (error) {
      console.error("Add friend error:", error);
      showModal({
        title: "Friend Error",
        message: "Could not add friend.",
        type: "error",
      });
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUser || !userProfile) return;
    try {
      const updatedFriends = userProfile.friendsList.filter(
        (id) => id !== friendId
      );
      const userRef = doc(db, `${getBasePath()}/users/${currentUser.uid}`);

      await updateDoc(userRef, {
        friendsList: updatedFriends,
      });

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              friendsList: updatedFriends,
            }
          : null
      );

      playSound("click");
    } catch (error) {
      console.error("Remove friend error:", error);
      showModal({
        title: "Friend Removal Failed",
        message: "Could not remove friend.",
        type: "error",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log("Sending password reset email to:", email);
      await sendPasswordResetEmail(auth, email);

      console.log("Password reset email sent successfully");
      playSound("success");
      showModal({
        title: "Password Reset Request Submitted",
        message:
          "If an account exists with this email address, you will receive a password reset link shortly. Please check your inbox and spam folder.",
        type: "success",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);

      let userMessage = "Unable to reset password. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          userMessage =
            "No account found with this email address. Please check your email or create a new account.";
          break;
        case "auth/invalid-email":
          userMessage = "Please enter a valid email address.";
          break;
        case "auth/network-request-failed":
          userMessage =
            "Network connection error. Please check your internet and try again.";
          break;
        case "auth/too-many-requests":
          userMessage =
            "Too many requests. Please wait a moment before trying again.";
          break;
        default:
          userMessage = "Unable to reset password. Please try again.";
      }

      showModal({
        title: "Password Reset Failed",
        message: userMessage,
        type: "error",
      });

      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signInAnonymously: signInAnonymouslyHandler,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    updateProfile,
    addCompletedTask,
    addFriend,
    removeFriend,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};