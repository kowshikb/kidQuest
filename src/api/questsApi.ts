import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, getBasePath } from '../firebase/config';

export interface QuestTask {
  id: string;
  title: string;
  description: string;
  coinReward: number;
  type: 'quiz' | 'activity' | 'creative' | 'matching' | 'drawing' | 'reading' | 'group';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: number; // in minutes
  data?: any;
  prerequisites?: string[]; // task IDs that must be completed first
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuestTheme {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  imageUrl: string;
  isActive: boolean;
  order: number;
  tasks: QuestTask[];
  totalTasks: number;
  totalRewards: number;
  estimatedDuration: number; // total time in minutes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserQuestProgress {
  userId: string;
  completedTasks: string[];
  inProgressTasks: string[];
  totalCoinsEarned: number;
  totalTasksCompleted: number;
  lastActivityAt: Timestamp;
  streakDays: number;
  achievements: string[];
}

export interface QuestApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface GetQuestsParams {
  userId: string;
  category?: string;
  difficulty?: string;
  includeInactive?: boolean;
}

export interface UpdateTaskParams {
  userId: string;
  taskId: string;
  themeId: string;
  coinsEarned: number;
  completionData?: any;
}

class QuestsApiService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  /**
   * GET /api/quests?userId={userId} - Retrieve all available quests and user progress
   */
  async getQuests(params: GetQuestsParams): Promise<QuestApiResponse> {
    try {
      const { userId, category, difficulty, includeInactive = false } = params;

      if (!userId) {
        return {
          success: false,
          error: 'INVALID_USER_ID',
          message: 'User ID is required'
        };
      }

      // Fetch user progress first
      const userProgress = await this.getUserProgress(userId);
      
      // Build query for themes
      const themesRef = collection(db, `${getBasePath()}/themes`);
      let themesQuery = query(themesRef);

      // Apply filters
      const queryConstraints = [];
      
      if (!includeInactive) {
        queryConstraints.push(where('isActive', '==', true));
      }
      
      if (category) {
        queryConstraints.push(where('category', '==', category));
      }
      
      if (difficulty) {
        queryConstraints.push(where('difficulty', '==', difficulty));
      }

      // Add ordering
      queryConstraints.push(orderBy('order', 'asc'));

      if (queryConstraints.length > 0) {
        themesQuery = query(themesRef, ...queryConstraints);
      }

      const querySnapshot = await getDocs(themesQuery);
      
      const themes: QuestTheme[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Process tasks and add completion status
        const tasks: QuestTask[] = (data.tasks || []).map((task: any) => ({
          ...task,
          id: task.id || `task_${Math.random().toString(36).substr(2, 9)}`,
          isCompleted: userProgress.completedTasks.includes(task.id),
          isInProgress: userProgress.inProgressTasks.includes(task.id),
          canStart: this.canStartTask(task, userProgress.completedTasks)
        }));

        const theme: QuestTheme = {
          id: doc.id,
          name: data.name || 'Untitled Quest',
          description: data.description || '',
          category: data.category || 'General',
          difficulty: data.difficulty || 'Easy',
          imageUrl: data.imageUrl || '',
          isActive: data.isActive !== false,
          order: data.order || 0,
          tasks,
          totalTasks: tasks.length,
          totalRewards: tasks.reduce((sum, task) => sum + (task.coinReward || 0), 0),
          estimatedDuration: tasks.reduce((sum, task) => sum + (task.estimatedTime || 5), 0),
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
          // Add progress information
          completedTasks: tasks.filter(task => userProgress.completedTasks.includes(task.id)).length,
          progressPercentage: tasks.length > 0 ? 
            (tasks.filter(task => userProgress.completedTasks.includes(task.id)).length / tasks.length) * 100 : 0
        };

        themes.push(theme);
      });

      return {
        success: true,
        data: {
          themes,
          userProgress,
          metadata: {
            totalThemes: themes.length,
            totalTasks: themes.reduce((sum, theme) => sum + theme.totalTasks, 0),
            totalPossibleRewards: themes.reduce((sum, theme) => sum + theme.totalRewards, 0),
            userCompletionRate: this.calculateCompletionRate(themes, userProgress),
            lastUpdated: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      console.error('Error fetching quests:', error);
      return {
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch quest data. Please try again.'
      };
    }
  }

  /**
   * PATCH /api/quests/task/{taskId} - Update task completion status
   */
  async updateTaskCompletion(params: UpdateTaskParams): Promise<QuestApiResponse> {
    try {
      const { userId, taskId, themeId, coinsEarned, completionData } = params;

      if (!userId || !taskId) {
        return {
          success: false,
          error: 'INVALID_PARAMETERS',
          message: 'User ID and Task ID are required'
        };
      }

      // Validate task exists and user can complete it
      const validation = await this.validateTaskCompletion(userId, taskId, themeId);
      if (!validation.success) {
        return validation;
      }

      // Get current user progress
      const userProgress = await this.getUserProgress(userId);
      
      // Check if task is already completed
      if (userProgress.completedTasks.includes(taskId)) {
        return {
          success: false,
          error: 'TASK_ALREADY_COMPLETED',
          message: 'This task has already been completed'
        };
      }

      // Update user profile
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User profile not found'
        };
      }

      const userData = userDoc.data();
      const updatedCompletedTasks = [...(userData.completedTasks || []), taskId];
      const updatedCoins = (userData.coins || 0) + coinsEarned;
      const updatedInProgress = (userData.inProgressTasks || []).filter((id: string) => id !== taskId);

      // Calculate new level data
      const newTotalExperience = updatedCoins;
      const newLevel = Math.floor(newTotalExperience / 100) + 1;
      const newExperience = newTotalExperience % 100;
      const newExperienceToNext = 100 - (newTotalExperience % 100);
      const newRankTitle = this.getRankTitle(newLevel);

      // Update user document
      await updateDoc(userRef, {
        completedTasks: updatedCompletedTasks,
        inProgressTasks: updatedInProgress,
        coins: updatedCoins,
        totalExperience: newTotalExperience,
        level: newLevel,
        experience: newExperience,
        experienceToNextLevel: newExperienceToNext,
        rankTitle: newRankTitle,
        lastActive: Timestamp.now(),
        // Update completion data if provided
        ...(completionData && { [`taskCompletionData.${taskId}`]: completionData })
      });

      // Update streak and achievements
      await this.updateUserStreak(userId);
      const newAchievements = await this.checkForNewAchievements(userId, updatedCompletedTasks, updatedCoins);

      return {
        success: true,
        data: {
          taskId,
          coinsEarned,
          newTotalCoins: updatedCoins,
          newLevel,
          newExperience,
          experienceToNextLevel: newExperienceToNext,
          rankTitle: newRankTitle,
          completedTasksCount: updatedCompletedTasks.length,
          newAchievements,
          completionTimestamp: new Date().toISOString()
        },
        message: `Task completed! You earned ${coinsEarned} coins.`
      };

    } catch (error) {
      console.error('Error updating task completion:', error);
      return {
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Failed to update task completion. Please try again.'
      };
    }
  }

  /**
   * Set up real-time listener for quest updates
   */
  subscribeToQuestUpdates(userId: string, callback: (data: any) => void): () => void {
    const unsubscribeKey = `quests_${userId}`;
    
    // Clean up existing subscription
    if (this.unsubscribeCallbacks.has(unsubscribeKey)) {
      this.unsubscribeCallbacks.get(unsubscribeKey)!();
    }

    const themesRef = collection(db, `${getBasePath()}/themes`);
    const themesQuery = query(
      themesRef,
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      themesQuery,
      async (snapshot) => {
        try {
          const userProgress = await this.getUserProgress(userId);
          
          const themes: QuestTheme[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            const tasks: QuestTask[] = (data.tasks || []).map((task: any) => ({
              ...task,
              isCompleted: userProgress.completedTasks.includes(task.id),
              isInProgress: userProgress.inProgressTasks.includes(task.id),
              canStart: this.canStartTask(task, userProgress.completedTasks)
            }));

            themes.push({
              id: doc.id,
              ...data,
              tasks,
              completedTasks: tasks.filter(task => userProgress.completedTasks.includes(task.id)).length,
              progressPercentage: tasks.length > 0 ? 
                (tasks.filter(task => userProgress.completedTasks.includes(task.id)).length / tasks.length) * 100 : 0
            } as QuestTheme);
          });

          callback({
            themes,
            userProgress,
            lastUpdated: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error in real-time quest updates:', error);
          callback({ error: 'Real-time update failed' });
        }
      },
      (error) => {
        console.error('Quest subscription error:', error);
        callback({ error: 'Subscription failed' });
      }
    );

    this.unsubscribeCallbacks.set(unsubscribeKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.unsubscribeCallbacks.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeCallbacks.clear();
  }

  // Private helper methods

  private async getUserProgress(userId: string): Promise<UserQuestProgress> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return {
          userId,
          completedTasks: [],
          inProgressTasks: [],
          totalCoinsEarned: 0,
          totalTasksCompleted: 0,
          lastActivityAt: Timestamp.now(),
          streakDays: 0,
          achievements: []
        };
      }

      const data = userDoc.data();
      return {
        userId,
        completedTasks: data.completedTasks || [],
        inProgressTasks: data.inProgressTasks || [],
        totalCoinsEarned: data.coins || 0,
        totalTasksCompleted: (data.completedTasks || []).length,
        lastActivityAt: data.lastActive || Timestamp.now(),
        streakDays: data.streakDays || 0,
        achievements: data.achievements || []
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

  private canStartTask(task: any, completedTasks: string[]): boolean {
    if (!task.prerequisites || task.prerequisites.length === 0) {
      return true;
    }
    
    return task.prerequisites.every((prereqId: string) => 
      completedTasks.includes(prereqId)
    );
  }

  private calculateCompletionRate(themes: QuestTheme[], userProgress: UserQuestProgress): number {
    const totalTasks = themes.reduce((sum, theme) => sum + theme.totalTasks, 0);
    if (totalTasks === 0) return 0;
    
    return (userProgress.totalTasksCompleted / totalTasks) * 100;
  }

  private async validateTaskCompletion(userId: string, taskId: string, themeId: string): Promise<QuestApiResponse> {
    try {
      // Check if theme exists
      const themeRef = doc(db, `${getBasePath()}/themes/${themeId}`);
      const themeDoc = await getDoc(themeRef);
      
      if (!themeDoc.exists()) {
        return {
          success: false,
          error: 'THEME_NOT_FOUND',
          message: 'Quest theme not found'
        };
      }

      const themeData = themeDoc.data();
      const task = (themeData.tasks || []).find((t: any) => t.id === taskId);
      
      if (!task) {
        return {
          success: false,
          error: 'TASK_NOT_FOUND',
          message: 'Task not found in the specified theme'
        };
      }

      if (!task.isActive) {
        return {
          success: false,
          error: 'TASK_INACTIVE',
          message: 'This task is currently not available'
        };
      }

      // Check prerequisites
      const userProgress = await this.getUserProgress(userId);
      if (!this.canStartTask(task, userProgress.completedTasks)) {
        return {
          success: false,
          error: 'PREREQUISITES_NOT_MET',
          message: 'You must complete prerequisite tasks first'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error validating task completion:', error);
      return {
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Failed to validate task completion'
      };
    }
  }

  private getRankTitle(level: number): string {
    if (level >= 50) return "Legendary Master";
    if (level >= 30) return "Elite Champion";
    if (level >= 20) return "Grand Champion";
    if (level >= 10) return "Champion";
    if (level >= 5) return "Rising Star";
    return "Novice Champion";
  }

  private async updateUserStreak(userId: string): Promise<void> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const lastActivity = userData.lastActivityAt?.toDate() || new Date();
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      let newStreak = userData.streakDays || 0;
      
      if (daysDiff === 1) {
        // Consecutive day
        newStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If daysDiff === 0, it's the same day, don't change streak

      await updateDoc(userRef, {
        streakDays: newStreak,
        lastActivityAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating user streak:', error);
    }
  }

  private async checkForNewAchievements(userId: string, completedTasks: string[], totalCoins: number): Promise<string[]> {
    const newAchievements: string[] = [];
    
    // Define achievement criteria
    const achievements = [
      { id: 'first_task', name: 'First Steps', condition: () => completedTasks.length >= 1 },
      { id: 'task_master_5', name: 'Task Master', condition: () => completedTasks.length >= 5 },
      { id: 'task_master_10', name: 'Quest Warrior', condition: () => completedTasks.length >= 10 },
      { id: 'task_master_25', name: 'Quest Champion', condition: () => completedTasks.length >= 25 },
      { id: 'coin_collector_100', name: 'Coin Collector', condition: () => totalCoins >= 100 },
      { id: 'coin_collector_500', name: 'Treasure Hunter', condition: () => totalCoins >= 500 },
      { id: 'coin_collector_1000', name: 'Wealth Master', condition: () => totalCoins >= 1000 },
    ];

    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return newAchievements;

      const userData = userDoc.data();
      const currentAchievements = userData.achievements || [];

      for (const achievement of achievements) {
        if (!currentAchievements.includes(achievement.id) && achievement.condition()) {
          newAchievements.push(achievement.id);
        }
      }

      if (newAchievements.length > 0) {
        await updateDoc(userRef, {
          achievements: [...currentAchievements, ...newAchievements]
        });
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }

    return newAchievements;
  }
}

// Export singleton instance
export const questsApi = new QuestsApiService();

// Export types for use in components
export type {
  QuestTask,
  QuestTheme,
  UserQuestProgress,
  QuestApiResponse,
  GetQuestsParams,
  UpdateTaskParams
};