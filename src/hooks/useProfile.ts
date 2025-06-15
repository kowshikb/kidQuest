import { useState, useEffect, useCallback } from 'react';
import { profileApi, ProfileData, ProfileUpdateData, AchievementData } from '../api/profileApi';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useSound } from '../contexts/SoundContext';

interface UseProfileReturn {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
  recordAchievement: (achievement: AchievementData) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  
  // Computed values
  profileCompletion: number;
  nextLevelProgress: number;
  canLevelUp: boolean;
}

export const useProfile = (): UseProfileReturn => {
  const { currentUser } = useAuth();
  const { showModal } = useModal();
  const { playSound } = useSound();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await profileApi.getProfile(currentUser.uid);

      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      showModal({
        title: "Profile Loading Error",
        message: "We couldn't load your profile. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, showModal]);

  // Update profile
  const updateProfile = useCallback(async (data: ProfileUpdateData): Promise<boolean> => {
    if (!currentUser) {
      showModal({
        title: "Authentication Required",
        message: "Please log in to update your profile.",
        type: "warning"
      });
      return false;
    }

    try {
      playSound('click');

      const response = await profileApi.updateProfile(currentUser.uid, data);

      if (response.success && response.data) {
        setProfile(response.data);
        playSound('success');
        
        showModal({
          title: "Profile Updated!",
          message: "Your profile has been updated successfully.",
          type: "success"
        });
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      showModal({
        title: "Update Failed",
        message: errorMessage,
        type: "error"
      });
      
      return false;
    }
  }, [currentUser, showModal, playSound]);

  // Record achievement
  const recordAchievement = useCallback(async (achievement: AchievementData): Promise<boolean> => {
    if (!currentUser) {
      console.warn('Cannot record achievement: user not authenticated');
      return false;
    }

    try {
      playSound('complete');

      const response = await profileApi.recordAchievement(currentUser.uid, achievement);

      if (response.success && response.data) {
        // Update local profile with new achievement
        setProfile(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            achievements: [...prev.achievements, response.data!]
          };
        });

        playSound('success');
        
        showModal({
          title: "Achievement Unlocked! 🏆",
          message: `Congratulations! You've earned the "${achievement.name}" achievement!`,
          type: "success"
        });
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to record achievement');
      }
    } catch (err) {
      console.error('Error recording achievement:', err);
      return false;
    }
  }, [currentUser, showModal, playSound]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Calculate profile completion percentage
  const profileCompletion = profile ? calculateProfileCompletion(profile) : 0;

  // Calculate next level progress
  const nextLevelProgress = profile ? (profile.experience / 100) * 100 : 0;

  // Check if user can level up
  const canLevelUp = profile ? profile.experience >= 100 : false;

  return {
    profile,
    loading,
    error,
    updateProfile,
    recordAchievement,
    refreshProfile,
    profileCompletion,
    nextLevelProgress,
    canLevelUp
  };
};

// Helper function to calculate profile completion
function calculateProfileCompletion(profile: ProfileData): number {
  let completionScore = 0;
  const maxScore = 100;

  // Basic info (40 points)
  if (profile.username && profile.username !== 'Champion') completionScore += 10;
  if (profile.avatarUrl) completionScore += 10;
  if (profile.location.city) completionScore += 10;
  if (profile.location.country) completionScore += 10;

  // Activity (40 points)
  if (profile.stats.questsCompleted > 0) completionScore += 20;
  if (profile.stats.friendsCount > 0) completionScore += 20;

  // Preferences (20 points)
  if (profile.preferences) completionScore += 20;

  return (completionScore / maxScore) * 100;
}

export default useProfile;