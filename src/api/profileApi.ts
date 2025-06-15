import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, getBasePath } from '../firebase/config';
import { ApiResponse, Achievement, Badge, UserStats, InventoryItem, UserPreferences } from './gameStateApi';

export interface ProfileData {
  userId: string;
  username: string;
  avatarUrl: string;
  level: number;
  experience: number;
  totalExperience: number;
  coins: number;
  rankTitle: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  achievements: Achievement[];
  badges: Badge[];
  stats: UserStats;
  inventory: InventoryItem[];
  preferences: UserPreferences;
  createdAt: Timestamp;
  lastActive: Timestamp;
}

export interface ProfileUpdateData {
  username?: string;
  avatarUrl?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  preferences?: Partial<UserPreferences>;
}

export interface AchievementData {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  iconUrl?: string;
  progress?: number;
  maxProgress?: number;
  metadata?: any;
}

class ProfileApiService {
  /**
   * GET /api/profile
   * Retrieve complete user profile data
   */
  async getProfile(userId: string): Promise<ApiResponse<ProfileData>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'INVALID_USER_ID',
          message: 'User ID is required',
          timestamp: new Date().toISOString()
        };
      }

      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        };
      }

      const userData = userDoc.data();
      
      // Calculate derived stats
      const derivedStats = await this.calculateDerivedStats(userId, userData);
      
      const profileData: ProfileData = {
        userId,
        username: userData.username || 'Champion',
        avatarUrl: userData.avatarUrl || '',
        level: userData.level || 1,
        experience: userData.experience || 0,
        totalExperience: userData.totalExperience || 0,
        coins: userData.coins || 0,
        rankTitle: userData.rankTitle || 'Novice Champion',
        location: userData.location || {
          city: 'Adventure City',
          state: 'Questland',
          country: 'Imagination'
        },
        achievements: userData.achievements || [],
        badges: userData.badges || [],
        stats: { ...derivedStats, ...userData.stats },
        inventory: userData.inventory || [],
        preferences: userData.preferences || this.getDefaultPreferences(),
        createdAt: userData.createdAt || Timestamp.now(),
        lastActive: userData.lastActive || Timestamp.now()
      };

      return {
        success: true,
        data: profileData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching profile:', error);
      return {
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch user profile',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * PUT /api/profile/update
   * Update user profile information
   */
  async updateProfile(userId: string, updateData: ProfileUpdateData): Promise<ApiResponse<ProfileData>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'INVALID_USER_ID',
          message: 'User ID is required',
          timestamp: new Date().toISOString()
        };
      }

      // Validate update data
      const validation = this.validateProfileUpdate(updateData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'VALIDATION_FAILED',
          message: validation.message,
          timestamp: new Date().toISOString()
        };
      }

      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      
      // Check if user exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        };
      }

      // Prepare update data
      const updatePayload: any = {
        ...updateData,
        lastActive: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Handle nested location updates
      if (updateData.location) {
        const currentLocation = userDoc.data().location || {};
        updatePayload.location = {
          ...currentLocation,
          ...updateData.location
        };
      }

      // Handle nested preferences updates
      if (updateData.preferences) {
        const currentPreferences = userDoc.data().preferences || this.getDefaultPreferences();
        updatePayload.preferences = {
          ...currentPreferences,
          ...updateData.preferences,
          privacy: {
            ...currentPreferences.privacy,
            ...updateData.preferences.privacy
          }
        };
      }

      await updateDoc(userRef, updatePayload);

      // Return updated profile
      const updatedProfile = await this.getProfile(userId);
      
      return {
        success: true,
        data: updatedProfile.data,
        message: 'Profile updated successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Failed to update user profile',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * POST /api/profile/achievement
   * Record new achievement for user
   */
  async recordAchievement(userId: string, achievementData: AchievementData): Promise<ApiResponse<Achievement>> {
    try {
      if (!userId || !achievementData.id) {
        return {
          success: false,
          error: 'INVALID_PARAMETERS',
          message: 'User ID and achievement ID are required',
          timestamp: new Date().toISOString()
        };
      }

      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        };
      }

      const userData = userDoc.data();
      const currentAchievements = userData.achievements || [];

      // Check if achievement already exists
      const existingAchievement = currentAchievements.find((a: Achievement) => a.id === achievementData.id);
      if (existingAchievement) {
        return {
          success: false,
          error: 'ACHIEVEMENT_EXISTS',
          message: 'Achievement already unlocked',
          timestamp: new Date().toISOString()
        };
      }

      // Create achievement object
      const achievement: Achievement = {
        id: achievementData.id,
        name: achievementData.name,
        description: achievementData.description,
        iconUrl: achievementData.iconUrl || '',
        unlockedAt: Timestamp.now(),
        category: achievementData.category,
        rarity: achievementData.rarity,
        progress: achievementData.progress,
        maxProgress: achievementData.maxProgress
      };

      // Calculate achievement rewards
      const rewards = this.calculateAchievementRewards(achievement);

      // Update user profile
      const batch = writeBatch(db);
      
      batch.update(userRef, {
        achievements: [...currentAchievements, achievement],
        coins: (userData.coins || 0) + rewards.coins,
        totalExperience: (userData.totalExperience || 0) + rewards.experience,
        lastActive: Timestamp.now()
      });

      // Add achievement notification
      const notificationRef = doc(collection(db, `${getBasePath()}/notifications`));
      batch.set(notificationRef, {
        userId,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You've earned the "${achievement.name}" achievement!`,
        iconUrl: achievement.iconUrl,
        isRead: false,
        createdAt: Timestamp.now(),
        data: { achievementId: achievement.id, rewards }
      });

      await batch.commit();

      return {
        success: true,
        data: achievement,
        message: `Achievement "${achievement.name}" unlocked!`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error recording achievement:', error);
      return {
        success: false,
        error: 'RECORD_FAILED',
        message: 'Failed to record achievement',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * GET /api/profile/achievements
   * Get all available achievements and user progress
   */
  async getAchievements(userId: string): Promise<ApiResponse<{ unlocked: Achievement[], available: any[] }>> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        };
      }

      const userData = userDoc.data();
      const unlockedAchievements = userData.achievements || [];
      const availableAchievements = await this.getAvailableAchievements(userId, userData);

      return {
        success: true,
        data: {
          unlocked: unlockedAchievements,
          available: availableAchievements
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching achievements:', error);
      return {
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch achievements',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * POST /api/profile/badge
   * Award badge to user
   */
  async awardBadge(userId: string, badgeData: Omit<Badge, 'earnedAt'>): Promise<ApiResponse<Badge>> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        };
      }

      const userData = userDoc.data();
      const currentBadges = userData.badges || [];

      // Check if badge already exists
      const existingBadge = currentBadges.find((b: Badge) => b.id === badgeData.id);
      if (existingBadge) {
        return {
          success: false,
          error: 'BADGE_EXISTS',
          message: 'Badge already earned',
          timestamp: new Date().toISOString()
        };
      }

      const badge: Badge = {
        ...badgeData,
        earnedAt: Timestamp.now()
      };

      await updateDoc(userRef, {
        badges: [...currentBadges, badge],
        lastActive: Timestamp.now()
      });

      return {
        success: true,
        data: badge,
        message: `Badge "${badge.name}" earned!`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error awarding badge:', error);
      return {
        success: false,
        error: 'AWARD_FAILED',
        message: 'Failed to award badge',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Private helper methods

  private async calculateDerivedStats(userId: string, userData: any): Promise<UserStats> {
    const friendsCount = userData.friendsList?.length || 0;
    const questsCompleted = userData.completedTasks?.length || 0;
    const coinsEarned = userData.coins || 0;

    // Calculate favorite category based on completed tasks
    const favoriteCategory = await this.calculateFavoriteCategory(userData.completedTasks || []);

    return {
      totalPlayTime: userData.stats?.totalPlayTime || 0,
      questsCompleted,
      coinsEarned,
      friendsCount,
      challengesWon: userData.stats?.challengesWon || 0,
      streakDays: userData.streakDays || 0,
      favoriteCategory,
      averageSessionTime: userData.stats?.averageSessionTime || 0
    };
  }

  private async calculateFavoriteCategory(completedTasks: string[]): Promise<string> {
    if (completedTasks.length === 0) return '';

    try {
      // Get all themes to categorize completed tasks
      const themesRef = collection(db, `${getBasePath()}/themes`);
      const themesSnapshot = await getDocs(themesRef);
      
      const categoryCount: Record<string, number> = {};

      themesSnapshot.docs.forEach(doc => {
        const themeData = doc.data();
        const themeTasks = themeData.tasks || [];
        
        themeTasks.forEach((task: any) => {
          if (completedTasks.includes(task.id)) {
            const category = themeData.category || 'General';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
          }
        });
      });

      // Find most frequent category
      let maxCount = 0;
      let favoriteCategory = '';
      
      Object.entries(categoryCount).forEach(([category, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteCategory = category;
        }
      });

      return favoriteCategory;
    } catch (error) {
      console.error('Error calculating favorite category:', error);
      return '';
    }
  }

  private validateProfileUpdate(updateData: ProfileUpdateData): { isValid: boolean; message?: string } {
    // Validate username
    if (updateData.username !== undefined) {
      if (!updateData.username.trim()) {
        return { isValid: false, message: 'Username cannot be empty' };
      }
      if (updateData.username.length > 50) {
        return { isValid: false, message: 'Username must be 50 characters or less' };
      }
      if (!/^[a-zA-Z0-9_\s]+$/.test(updateData.username)) {
        return { isValid: false, message: 'Username can only contain letters, numbers, spaces, and underscores' };
      }
    }

    // Validate avatar URL
    if (updateData.avatarUrl !== undefined) {
      if (updateData.avatarUrl && !this.isValidUrl(updateData.avatarUrl)) {
        return { isValid: false, message: 'Invalid avatar URL' };
      }
    }

    return { isValid: true };
  }

  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      soundEnabled: true,
      notificationsEnabled: true,
      theme: 'auto',
      language: 'en',
      difficulty: 'easy',
      privacy: {
        showOnLeaderboard: true,
        allowFriendRequests: true,
        showActivity: true
      }
    };
  }

  private calculateAchievementRewards(achievement: Achievement): { coins: number; experience: number } {
    const baseRewards = {
      common: { coins: 25, experience: 10 },
      rare: { coins: 50, experience: 25 },
      epic: { coins: 100, experience: 50 },
      legendary: { coins: 250, experience: 100 }
    };

    return baseRewards[achievement.rarity] || baseRewards.common;
  }

  private async getAvailableAchievements(userId: string, userData: any): Promise<any[]> {
    // Define available achievements based on user progress
    const achievements = [
      {
        id: 'first_quest',
        name: 'First Steps',
        description: 'Complete your first quest',
        category: 'milestone',
        rarity: 'common',
        condition: () => (userData.completedTasks?.length || 0) >= 1,
        progress: Math.min(userData.completedTasks?.length || 0, 1),
        maxProgress: 1
      },
      {
        id: 'quest_master_10',
        name: 'Quest Master',
        description: 'Complete 10 quests',
        category: 'milestone',
        rarity: 'rare',
        condition: () => (userData.completedTasks?.length || 0) >= 10,
        progress: Math.min(userData.completedTasks?.length || 0, 10),
        maxProgress: 10
      },
      {
        id: 'coin_collector_100',
        name: 'Coin Collector',
        description: 'Earn 100 coins',
        category: 'wealth',
        rarity: 'common',
        condition: () => (userData.coins || 0) >= 100,
        progress: Math.min(userData.coins || 0, 100),
        maxProgress: 100
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Add 5 friends',
        category: 'social',
        rarity: 'rare',
        condition: () => (userData.friendsList?.length || 0) >= 5,
        progress: Math.min(userData.friendsList?.length || 0, 5),
        maxProgress: 5
      }
    ];

    const unlockedIds = (userData.achievements || []).map((a: Achievement) => a.id);
    
    return achievements
      .filter(achievement => !unlockedIds.includes(achievement.id))
      .map(achievement => ({
        ...achievement,
        isUnlockable: achievement.condition(),
        progressPercentage: (achievement.progress / achievement.maxProgress) * 100
      }));
  }
}

// Export singleton instance
export const profileApi = new ProfileApiService();