import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, getBasePath } from '../firebase/config';

export interface GameState {
  user: UserGameState;
  quests: QuestGameState;
  profile: ProfileGameState;
  leaderboard: LeaderboardGameState;
  home: HomeGameState;
  lastUpdated: string;
}

export interface UserGameState {
  userId: string;
  isNewUser: boolean;
  hasCompletedTutorial: boolean;
  currentLevel: number;
  totalExperience: number;
  coins: number;
  lastLoginAt: Timestamp;
  sessionId: string;
}

export interface QuestGameState {
  availableQuests: number;
  completedQuests: number;
  inProgressQuests: string[];
  dailyChallenges: any[];
  weeklyGoals: any[];
  nextRecommendedQuest: string | null;
}

export interface ProfileGameState {
  username: string;
  avatarUrl: string;
  level: number;
  experience: number;
  achievements: Achievement[];
  badges: Badge[];
  stats: UserStats;
  inventory: InventoryItem[];
  preferences: UserPreferences;
}

export interface LeaderboardGameState {
  userRank: number;
  totalPlayers: number;
  nearbyCompetitors: LeaderboardEntry[];
  weeklyRank: number;
  monthlyRank: number;
  categoryRanks: Record<string, number>;
}

export interface HomeGameState {
  notifications: Notification[];
  activityFeed: ActivityItem[];
  dailyChallenges: Challenge[];
  friendActivities: FriendActivity[];
  recommendations: Recommendation[];
  unreadCount: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt: Timestamp;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  maxProgress?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Timestamp;
  type: 'skill' | 'milestone' | 'special' | 'seasonal';
}

export interface UserStats {
  totalPlayTime: number;
  questsCompleted: number;
  coinsEarned: number;
  friendsCount: number;
  challengesWon: number;
  streakDays: number;
  favoriteCategory: string;
  averageSessionTime: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'avatar' | 'theme' | 'powerup' | 'decoration';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  acquiredAt: Timestamp;
  isEquipped?: boolean;
}

export interface UserPreferences {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  privacy: {
    showOnLeaderboard: boolean;
    allowFriendRequests: boolean;
    showActivity: boolean;
  };
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  rank: number;
  change: number;
  level: number;
  badges: string[];
}

export interface Notification {
  id: string;
  type: 'achievement' | 'friend_request' | 'challenge' | 'system' | 'reward';
  title: string;
  message: string;
  iconUrl?: string;
  isRead: boolean;
  createdAt: Timestamp;
  actionUrl?: string;
  data?: any;
}

export interface ActivityItem {
  id: string;
  type: 'quest_completed' | 'achievement_unlocked' | 'level_up' | 'friend_added';
  description: string;
  timestamp: Timestamp;
  relatedData?: any;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  difficulty: 'easy' | 'medium' | 'hard';
  reward: {
    coins: number;
    experience: number;
    items?: string[];
  };
  progress: number;
  maxProgress: number;
  expiresAt: Timestamp;
  isCompleted: boolean;
}

export interface FriendActivity {
  friendId: string;
  friendUsername: string;
  friendAvatarUrl: string;
  activity: string;
  timestamp: Timestamp;
  type: 'quest' | 'achievement' | 'level_up';
}

export interface Recommendation {
  id: string;
  type: 'quest' | 'friend' | 'challenge' | 'feature';
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
  priority: number;
  imageUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

class GameStateApiService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  /**
   * GET /api/game-state
   * Fetch initial game state for all sections
   */
  async getInitialGameState(userId: string): Promise<ApiResponse<GameState>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'INVALID_USER_ID',
          message: 'User ID is required',
          timestamp: new Date().toISOString()
        };
      }

      // Fetch user data
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      let userData = userDoc.data();
      let isNewUser = false;

      // Create default user if doesn't exist
      if (!userDoc.exists()) {
        isNewUser = true;
        userData = await this.createDefaultUser(userId);
      }

      // Fetch all game state components in parallel
      const [questState, profileState, leaderboardState, homeState] = await Promise.all([
        this.getQuestGameState(userId, userData),
        this.getProfileGameState(userId, userData),
        this.getLeaderboardGameState(userId, userData),
        this.getHomeGameState(userId, userData)
      ]);

      const gameState: GameState = {
        user: {
          userId,
          isNewUser,
          hasCompletedTutorial: userData.hasCompletedTutorial || false,
          currentLevel: userData.level || 1,
          totalExperience: userData.totalExperience || 0,
          coins: userData.coins || 0,
          lastLoginAt: userData.lastActive || Timestamp.now(),
          sessionId: this.generateSessionId()
        },
        quests: questState,
        profile: profileState,
        leaderboard: leaderboardState,
        home: homeState,
        lastUpdated: new Date().toISOString()
      };

      // Update last login
      await this.updateLastLogin(userId);

      return {
        success: true,
        data: gameState,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching initial game state:', error);
      return {
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch initial game state',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Real-time game state subscription
   */
  subscribeToGameState(userId: string, callback: (gameState: GameState) => void): () => void {
    const unsubscribeKey = `gamestate_${userId}`;
    
    // Clean up existing subscription
    if (this.unsubscribeCallbacks.has(unsubscribeKey)) {
      this.unsubscribeCallbacks.get(unsubscribeKey)!();
    }

    const userRef = doc(db, `${getBasePath()}/users/${userId}`);
    
    const unsubscribe = onSnapshot(
      userRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          try {
            const userData = snapshot.data();
            const gameState = await this.getInitialGameState(userId);
            
            if (gameState.success && gameState.data) {
              callback(gameState.data);
            }
          } catch (error) {
            console.error('Error in game state subscription:', error);
          }
        }
      },
      (error) => {
        console.error('Game state subscription error:', error);
      }
    );

    this.unsubscribeCallbacks.set(unsubscribeKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Sync game state changes
   */
  async syncGameState(userId: string, changes: Partial<GameState>): Promise<ApiResponse> {
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);

      // Prepare update data
      const updateData: any = {
        lastActive: Timestamp.now(),
        lastSyncAt: Timestamp.now()
      };

      // Apply user state changes
      if (changes.user) {
        Object.assign(updateData, {
          level: changes.user.currentLevel,
          totalExperience: changes.user.totalExperience,
          coins: changes.user.coins,
          hasCompletedTutorial: changes.user.hasCompletedTutorial
        });
      }

      // Apply profile changes
      if (changes.profile) {
        Object.assign(updateData, {
          username: changes.profile.username,
          avatarUrl: changes.profile.avatarUrl,
          achievements: changes.profile.achievements,
          badges: changes.profile.badges,
          stats: changes.profile.stats,
          inventory: changes.profile.inventory,
          preferences: changes.profile.preferences
        });
      }

      batch.update(userRef, updateData);
      await batch.commit();

      return {
        success: true,
        message: 'Game state synchronized successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error syncing game state:', error);
      return {
        success: false,
        error: 'SYNC_FAILED',
        message: 'Failed to synchronize game state',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Private helper methods

  private async createDefaultUser(userId: string): Promise<any> {
    const defaultUserData = {
      userId,
      friendlyUserId: this.generateFriendlyUserId(),
      username: `Champion${Math.floor(Math.random() * 10000)}`,
      avatarUrl: this.getRandomAvatar(),
      coins: 0,
      level: 1,
      experience: 0,
      totalExperience: 0,
      experienceToNextLevel: 100,
      rankTitle: 'Novice Champion',
      location: {
        city: 'Adventure City',
        state: 'Questland',
        country: 'Imagination'
      },
      completedTasks: [],
      friendsList: [],
      achievements: [],
      badges: [],
      stats: {
        totalPlayTime: 0,
        questsCompleted: 0,
        coinsEarned: 0,
        friendsCount: 0,
        challengesWon: 0,
        streakDays: 0,
        favoriteCategory: '',
        averageSessionTime: 0
      },
      inventory: [],
      preferences: {
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
      },
      hasCompletedTutorial: false,
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now()
    };

    const userRef = doc(db, `${getBasePath()}/users/${userId}`);
    await setDoc(userRef, defaultUserData);
    
    return defaultUserData;
  }

  private async getQuestGameState(userId: string, userData: any): Promise<QuestGameState> {
    try {
      // Fetch available quests
      const themesRef = collection(db, `${getBasePath()}/themes`);
      const themesQuery = query(themesRef, where('isActive', '==', true));
      const themesSnapshot = await getDocs(themesQuery);
      
      const totalQuests = themesSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.tasks?.length || 0);
      }, 0);

      const completedTasks = userData.completedTasks || [];
      const inProgressTasks = userData.inProgressTasks || [];

      return {
        availableQuests: totalQuests,
        completedQuests: completedTasks.length,
        inProgressQuests,
        dailyChallenges: await this.getDailyChallenges(userId),
        weeklyGoals: await this.getWeeklyGoals(userId),
        nextRecommendedQuest: await this.getNextRecommendedQuest(userId, completedTasks)
      };
    } catch (error) {
      console.error('Error fetching quest game state:', error);
      return {
        availableQuests: 0,
        completedQuests: 0,
        inProgressQuests: [],
        dailyChallenges: [],
        weeklyGoals: [],
        nextRecommendedQuest: null
      };
    }
  }

  private async getProfileGameState(userId: string, userData: any): Promise<ProfileGameState> {
    return {
      username: userData.username || 'Champion',
      avatarUrl: userData.avatarUrl || this.getRandomAvatar(),
      level: userData.level || 1,
      experience: userData.experience || 0,
      achievements: userData.achievements || [],
      badges: userData.badges || [],
      stats: userData.stats || {
        totalPlayTime: 0,
        questsCompleted: 0,
        coinsEarned: 0,
        friendsCount: 0,
        challengesWon: 0,
        streakDays: 0,
        favoriteCategory: '',
        averageSessionTime: 0
      },
      inventory: userData.inventory || [],
      preferences: userData.preferences || {
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
      }
    };
  }

  private async getLeaderboardGameState(userId: string, userData: any): Promise<LeaderboardGameState> {
    try {
      // Get user's rank
      const usersRef = collection(db, `${getBasePath()}/users`);
      const leaderboardQuery = query(usersRef, orderBy('coins', 'desc'));
      const leaderboardSnapshot = await getDocs(leaderboardQuery);
      
      let userRank = 0;
      let totalPlayers = leaderboardSnapshot.docs.length;
      const nearbyCompetitors: LeaderboardEntry[] = [];

      leaderboardSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        if (doc.id === userId) {
          userRank = index + 1;
        }
        
        // Get nearby competitors (±5 positions)
        if (Math.abs(index - userRank) <= 5) {
          nearbyCompetitors.push({
            userId: doc.id,
            username: data.username,
            avatarUrl: data.avatarUrl,
            score: data.coins,
            rank: index + 1,
            change: 0, // TODO: Calculate from previous rankings
            level: data.level,
            badges: data.badges?.map((b: any) => b.id) || []
          });
        }
      });

      return {
        userRank,
        totalPlayers,
        nearbyCompetitors,
        weeklyRank: userRank, // TODO: Implement weekly rankings
        monthlyRank: userRank, // TODO: Implement monthly rankings
        categoryRanks: {} // TODO: Implement category-specific rankings
      };
    } catch (error) {
      console.error('Error fetching leaderboard game state:', error);
      return {
        userRank: 0,
        totalPlayers: 0,
        nearbyCompetitors: [],
        weeklyRank: 0,
        monthlyRank: 0,
        categoryRanks: {}
      };
    }
  }

  private async getHomeGameState(userId: string, userData: any): Promise<HomeGameState> {
    try {
      const [notifications, activityFeed, dailyChallenges, friendActivities, recommendations] = await Promise.all([
        this.getNotifications(userId),
        this.getActivityFeed(userId),
        this.getDailyChallenges(userId),
        this.getFriendActivities(userId),
        this.getRecommendations(userId)
      ]);

      return {
        notifications,
        activityFeed,
        dailyChallenges,
        friendActivities,
        recommendations,
        unreadCount: notifications.filter(n => !n.isRead).length
      };
    } catch (error) {
      console.error('Error fetching home game state:', error);
      return {
        notifications: [],
        activityFeed: [],
        dailyChallenges: [],
        friendActivities: [],
        recommendations: [],
        unreadCount: 0
      };
    }
  }

  private async getDailyChallenges(userId: string): Promise<Challenge[]> {
    // TODO: Implement daily challenges logic
    return [
      {
        id: 'daily_1',
        name: 'Complete 3 Quests',
        description: 'Finish any 3 quests today',
        type: 'daily',
        difficulty: 'easy',
        reward: { coins: 50, experience: 25 },
        progress: 0,
        maxProgress: 3,
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        isCompleted: false
      }
    ];
  }

  private async getWeeklyGoals(userId: string): Promise<any[]> {
    // TODO: Implement weekly goals logic
    return [];
  }

  private async getNextRecommendedQuest(userId: string, completedTasks: string[]): Promise<string | null> {
    // TODO: Implement quest recommendation logic
    return null;
  }

  private async getNotifications(userId: string): Promise<Notification[]> {
    // TODO: Implement notifications fetching
    return [];
  }

  private async getActivityFeed(userId: string): Promise<ActivityItem[]> {
    // TODO: Implement activity feed logic
    return [];
  }

  private async getFriendActivities(userId: string): Promise<FriendActivity[]> {
    // TODO: Implement friend activities logic
    return [];
  }

  private async getRecommendations(userId: string): Promise<Recommendation[]> {
    // TODO: Implement recommendations logic
    return [];
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      await updateDoc(userRef, {
        lastActive: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFriendlyUserId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `KQ${timestamp.slice(0, 3)}${random}`;
  }

  private getRandomAvatar(): string {
    const avatars = [
      "https://images.pexels.com/photos/1416736/pexels-photo-1416736.jpeg?auto=compress&cs=tinysrgb&w=150",
      "https://images.pexels.com/photos/3608439/pexels-photo-3608439.jpeg?auto=compress&cs=tinysrgb&w=150",
      "https://images.pexels.com/photos/3662845/pexels-photo-3662845.jpeg?auto=compress&cs=tinysrgb&w=150",
      "https://images.pexels.com/photos/4588465/pexels-photo-4588465.jpeg?auto=compress&cs=tinysrgb&w=150",
      "https://images.pexels.com/photos/4010442/pexels-photo-4010442.jpeg?auto=compress&cs=tinysrgb&w=150",
      "https://images.pexels.com/photos/1643457/pexels-photo-1643457.jpeg?auto=compress&cs=tinysrgb&w=150"
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    this.unsubscribeCallbacks.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeCallbacks.clear();
  }
}

// Export singleton instance
export const gameStateApi = new GameStateApiService();