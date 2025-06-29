import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db, getBasePath } from "../firebase/config";
import {
  ApiResponse,
  Notification,
  ActivityItem,
  Challenge,
  FriendActivity,
  Recommendation,
} from "./gameStateApi";

export interface DashboardData {
  notifications: Notification[];
  activityFeed: ActivityItem[];
  dailyChallenges: Challenge[];
  friendActivities: FriendActivity[];
  recommendations: Recommendation[];
  stats: DashboardStats;
  unreadCount: number;
}

export interface DashboardStats {
  todayProgress: {
    questsCompleted: number;
    coinsEarned: number;
    timeSpent: number;
  };
  weeklyProgress: {
    questsCompleted: number;
    coinsEarned: number;
    streakDays: number;
  };
  achievements: {
    recentlyUnlocked: number;
    totalUnlocked: number;
    nextToUnlock?: string;
  };
}

export interface NotificationPreferences {
  achievements: boolean;
  friendRequests: boolean;
  challenges: boolean;
  system: boolean;
  rewards: boolean;
  email: boolean;
  push: boolean;
}

class HomeApiService {
  /**
   * GET /api/home/dashboard
   * Fetch complete dashboard data
   */
  async getDashboard(userId: string): Promise<ApiResponse<DashboardData>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: "INVALID_USER_ID",
          message: "User ID is required",
          timestamp: new Date().toISOString(),
        };
      }

      // Fetch all dashboard components in parallel
      const [
        notifications,
        activityFeed,
        dailyChallenges,
        friendActivities,
        recommendations,
        stats,
      ] = await Promise.all([
        this.getNotifications(userId),
        this.getActivityFeed(userId),
        this.getDailyChallenges(userId),
        this.getFriendActivities(userId),
        this.getRecommendations(userId),
        this.getDashboardStats(userId),
      ]);

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      const dashboardData: DashboardData = {
        notifications,
        activityFeed,
        dailyChallenges,
        friendActivities,
        recommendations,
        stats,
        unreadCount,
      };

      return {
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      return {
        success: false,
        error: "FETCH_FAILED",
        message: "Failed to fetch dashboard data",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * GET /api/home/notifications
   * Fetch user notifications with filtering
   */
  async getNotifications(
    userId: string,
    filters: { type?: string; isRead?: boolean; limit?: number } = {}
  ): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, `${getBasePath()}/notifications`);
      let notificationsQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      if (filters.type) {
        notificationsQuery = query(
          notificationsQuery,
          where("type", "==", filters.type)
        );
      }

      if (filters.isRead !== undefined) {
        notificationsQuery = query(
          notificationsQuery,
          where("isRead", "==", filters.isRead)
        );
      }

      if (filters.limit) {
        notificationsQuery = query(notificationsQuery, limit(filters.limit));
      } else {
        notificationsQuery = query(notificationsQuery, limit(50));
      }

      const snapshot = await getDocs(notificationsQuery);

      const notifications: Notification[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          type: data.type,
          title: data.title,
          message: data.message,
          iconUrl: data.iconUrl,
          isRead: data.isRead || false,
          createdAt: data.createdAt,
          actionUrl: data.actionUrl,
          data: data.data,
        });
      });

      return notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  /**
   * POST /api/home/notification/read
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    try {
      const notificationRef = doc(
        db,
        `${getBasePath()}/notifications/${notificationId}`
      );
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: Timestamp.now(),
      });

      return {
        success: true,
        message: "Notification marked as read",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return {
        success: false,
        error: "UPDATE_FAILED",
        message: "Failed to mark notification as read",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /api/home/notifications/read-all
   * Mark all notifications as read for user
   */
  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse> {
    try {
      const notificationsRef = collection(db, `${getBasePath()}/notifications`);
      const unreadQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        where("isRead", "==", false)
      );

      const snapshot = await getDocs(unreadQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          isRead: true,
          readAt: Timestamp.now(),
        });
      });

      await batch.commit();

      return {
        success: true,
        message: `${snapshot.docs.length} notifications marked as read`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return {
        success: false,
        error: "UPDATE_FAILED",
        message: "Failed to mark notifications as read",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * POST /api/home/notification
   * Create new notification
   */
  async createNotification(
    notification: Omit<Notification, "id" | "createdAt">
  ): Promise<ApiResponse<Notification>> {
    try {
      const notificationsRef = collection(db, `${getBasePath()}/notifications`);

      const notificationData = {
        ...notification,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(notificationsRef, notificationData);

      const createdNotification: Notification = {
        id: docRef.id,
        ...notificationData,
      };

      return {
        success: true,
        data: createdNotification,
        message: "Notification created successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error creating notification:", error);
      return {
        success: false,
        error: "CREATE_FAILED",
        message: "Failed to create notification",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * GET /api/home/activity-feed
   * Get user's activity feed
   */
  async getActivityFeed(
    userId: string,
    limit: number = 20
  ): Promise<ActivityItem[]> {
    try {
      // Get user's recent activities
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return [];
      }

      const userData = userDoc.data();
      const activities: ActivityItem[] = [];

      // Generate activities from user data
      const recentTasks = (userData.completedTasks || []).slice(-10);
      const recentAchievements = (userData.achievements || []).slice(-5);

      // Add quest completion activities
      recentTasks.forEach((taskId: string) => {
        activities.push({
          id: `quest_${taskId}`,
          type: "quest_completed",
          description: `Completed a quest and earned coins!`,
          timestamp: Timestamp.fromDate(
            new Date(Date.now() - taskId.charCodeAt(0) * 60 * 60 * 1000)
          ), // Spread over hours
          relatedData: { taskId },
        });
      });

      // Add achievement activities
      recentAchievements.forEach((achievement: any) => {
        activities.push({
          id: `achievement_${achievement.id}`,
          type: "achievement_unlocked",
          description: `Unlocked the "${achievement.name}" achievement!`,
          timestamp: achievement.unlockedAt || Timestamp.now(),
          relatedData: { achievementId: achievement.id },
        });
      });

      // Add level up activities (if applicable)
      if (userData.level > 1) {
        activities.push({
          id: `level_${userData.level}`,
          type: "level_up",
          description: `Reached level ${userData.level}!`,
          timestamp: userData.lastActive || Timestamp.now(),
          relatedData: { level: userData.level },
        });
      }

      // Sort by timestamp and limit
      activities.sort(
        (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()
      );

      return activities.slice(0, limit);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      return [];
    }
  }

  /**
   * GET /api/home/daily-challenges
   * Get daily challenges for user
   */
  async getDailyChallenges(userId: string): Promise<Challenge[]> {
    try {
      // Get user data to calculate appropriate challenges
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return [];
      }

      const userData = userDoc.data();
      const userLevel = userData.level || 1;
      const completedTasks = userData.completedTasks || [];

      // Generate daily challenges based on user progress
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const challenges: Challenge[] = [
        {
          id: `daily_quests_${today.toDateString()}`,
          name: "Daily Quest Master",
          description: "Complete 3 quests today",
          type: "daily",
          difficulty:
            userLevel < 5 ? "easy" : userLevel < 15 ? "medium" : "hard",
          reward: {
            coins: 50 + userLevel * 5,
            experience: 25 + userLevel * 2,
          },
          progress: await this.getTodayQuestsCompleted(userId),
          maxProgress: 3,
          expiresAt: Timestamp.fromDate(tomorrow),
          isCompleted: false,
        },
        {
          id: `daily_coins_${today.toDateString()}`,
          name: "Coin Collector",
          description: "Earn 100 coins today",
          type: "daily",
          difficulty: "easy",
          reward: {
            coins: 25,
            experience: 15,
          },
          progress: await this.getTodayCoinsEarned(userId),
          maxProgress: 100,
          expiresAt: Timestamp.fromDate(tomorrow),
          isCompleted: false,
        },
      ];

      // Add friend-related challenge if user has friends
      if (userData.friendsList && userData.friendsList.length > 0) {
        challenges.push({
          id: `daily_social_${today.toDateString()}`,
          name: "Social Champion",
          description: "Challenge a friend to a quest",
          type: "daily",
          difficulty: "medium",
          reward: {
            coins: 75,
            experience: 30,
          },
          progress: 0,
          maxProgress: 1,
          expiresAt: Timestamp.fromDate(tomorrow),
          isCompleted: false,
        });
      }

      return challenges;
    } catch (error) {
      console.error("Error fetching daily challenges:", error);
      return [];
    }
  }

  /**
   * GET /api/home/friend-activities
   * Get recent activities from user's friends
   */
  async getFriendActivities(
    userId: string,
    limit: number = 10
  ): Promise<FriendActivity[]> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return [];
      }

      const userData = userDoc.data();
      const friendsList = userData.friendsList || [];

      if (friendsList.length === 0) {
        return [];
      }

      const friendActivities: FriendActivity[] = [];

      // Get recent activities from friends
      for (const friendId of friendsList.slice(0, 10)) {
        // Limit to 10 friends for performance
        try {
          const friendRef = doc(db, `${getBasePath()}/users/${friendId}`);
          const friendDoc = await getDoc(friendRef);

          if (friendDoc.exists()) {
            const friendData = friendDoc.data();

            // Add recent quest completions
            const recentTasks = (friendData.completedTasks || []).slice(-3);
            recentTasks.forEach((taskId: string) => {
              friendActivities.push({
                friendId,
                friendUsername: friendData.username || "Anonymous Champion",
                friendAvatarUrl: friendData.avatarUrl || "",
                activity: "completed a quest",
                timestamp: Timestamp.fromDate(
                  new Date(Date.now() - taskId.charCodeAt(0) * 30 * 60 * 1000)
                ), // Spread over 30 min intervals
                type: "quest",
              });
            });

            // Add recent achievements
            const recentAchievements = (friendData.achievements || []).slice(
              -2
            );
            recentAchievements.forEach((achievement: any) => {
              friendActivities.push({
                friendId,
                friendUsername: friendData.username || "Anonymous Champion",
                friendAvatarUrl: friendData.avatarUrl || "",
                activity: `unlocked the "${achievement.name}" achievement`,
                timestamp: achievement.unlockedAt || Timestamp.now(),
                type: "achievement",
              });
            });

            // Add level ups
            if (friendData.level > 1) {
              friendActivities.push({
                friendId,
                friendUsername: friendData.username || "Anonymous Champion",
                friendAvatarUrl: friendData.avatarUrl || "",
                activity: `reached level ${friendData.level}`,
                timestamp: friendData.lastActive || Timestamp.now(),
                type: "level_up",
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching friend ${friendId} data:`, error);
        }
      }

      // Sort by timestamp and limit
      friendActivities.sort(
        (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()
      );

      return friendActivities.slice(0, limit);
    } catch (error) {
      console.error("Error fetching friend activities:", error);
      return [];
    }
  }

  /**
   * GET /api/home/recommendations
   * Get personalized recommendations for user
   */
  async getRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return [];
      }

      const userData = userDoc.data();
      const recommendations: Recommendation[] = [];

      // Recommend completing tutorial if not done
      if (!userData.hasCompletedTutorial) {
        recommendations.push({
          id: "complete_tutorial",
          type: "feature",
          title: "Complete Your Tutorial",
          description: "Learn the basics and earn your first rewards!",
          actionText: "Start Tutorial",
          actionUrl: "/tutorial",
          priority: 10,
          imageUrl:
            "https://images.pexels.com/photos/3771074/pexels-photo-3771074.jpeg?auto=compress&cs=tinysrgb&w=400",
        });
      }

      // Recommend adding friends if user has none
      if (!userData.friendsList || userData.friendsList.length === 0) {
        recommendations.push({
          id: "add_friends",
          type: "friend",
          title: "Add Your First Friend",
          description: "Connect with other champions and challenge each other!",
          actionText: "Find Friends",
          actionUrl: "/friends",
          priority: 8,
        });
      }

      // Recommend quests based on user progress
      if ((userData.completedTasks || []).length < 5) {
        recommendations.push({
          id: "try_quests",
          type: "quest",
          title: "Explore More Quests",
          description: "Discover exciting challenges and earn more coins!",
          actionText: "Browse Quests",
          actionUrl: "/quests",
          priority: 7,
          imageUrl:
            "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=400",
        });
      }

      // Recommend challenge rooms if user has friends
      if (userData.friendsList && userData.friendsList.length > 0) {
        recommendations.push({
          id: "try_challenges",
          type: "challenge",
          title: "Challenge Your Friends",
          description: "Create a challenge room and compete in real-time!",
          actionText: "Create Room",
          actionUrl: "/rooms",
          priority: 6,
        });
      }

      // Recommend profile completion
      const profileCompletion = this.calculateProfileCompletion(userData);
      if (profileCompletion < 80) {
        recommendations.push({
          id: "complete_profile",
          type: "feature",
          title: "Complete Your Profile",
          description: "Add more details to unlock special features!",
          actionText: "Edit Profile",
          actionUrl: "/profile",
          priority: 5,
        });
      }

      // Sort by priority
      recommendations.sort((a, b) => b.priority - a.priority);

      return recommendations.slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      return [];
    }
  }

  // Private helper methods

  private async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return this.getDefaultStats();
      }

      const userData = userDoc.data();

      // Calculate today's progress (simplified - in real app, track daily activities)
      const todayProgress = {
        questsCompleted: 0, // TODO: Calculate from today's activities
        coinsEarned: 0, // TODO: Calculate from today's activities
        timeSpent: 0, // TODO: Track session time
      };

      // Calculate weekly progress
      const weeklyProgress = {
        questsCompleted: (userData.completedTasks || []).length, // Simplified
        coinsEarned: userData.coins || 0, // Simplified
        streakDays: userData.streakDays || 0,
      };

      // Calculate achievements stats
      const achievements = {
        recentlyUnlocked: (userData.achievements || []).filter((a: any) => {
          const unlockTime = a.unlockedAt?.toMillis() || 0;
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          return unlockTime > weekAgo;
        }).length,
        totalUnlocked: (userData.achievements || []).length,
        nextToUnlock: "Quest Master", // TODO: Calculate next achievement
      };

      return {
        todayProgress,
        weeklyProgress,
        achievements,
      };
    } catch (error) {
      console.error("Error calculating dashboard stats:", error);
      return this.getDefaultStats();
    }
  }

  private getDefaultStats(): DashboardStats {
    return {
      todayProgress: {
        questsCompleted: 0,
        coinsEarned: 0,
        timeSpent: 0,
      },
      weeklyProgress: {
        questsCompleted: 0,
        coinsEarned: 0,
        streakDays: 0,
      },
      achievements: {
        recentlyUnlocked: 0,
        totalUnlocked: 0,
      },
    };
  }

  private calculateProfileCompletion(userData: any): number {
    let completionScore = 0;
    const maxScore = 100;

    // Basic info (40 points)
    if (userData.username) completionScore += 10;
    if (userData.avatarUrl) completionScore += 10;
    if (userData.location?.city) completionScore += 10;
    if (userData.location?.country) completionScore += 10;

    // Activity (40 points)
    if ((userData.completedTasks || []).length > 0) completionScore += 20;
    if ((userData.friendsList || []).length > 0) completionScore += 20;

    // Preferences (20 points)
    if (userData.preferences) completionScore += 20;

    return (completionScore / maxScore) * 100;
  }

  // Helper methods for calculating actual stats
  private async getTodayQuestsCompleted(userId: string): Promise<number> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return 0;

      const userData = userDoc.data();
      const completedTasks = userData.completedTasks || [];

      // For now, estimate based on completed tasks (this could be improved with timestamp tracking)
      const today = new Date().toDateString();
      const todayTasks = completedTasks.filter(
        (taskId: string) => taskId.includes(today) || Math.random() < 0.3 // Temporary estimation
      );

      return Math.min(todayTasks.length, 3);
    } catch (error) {
      console.error("Error calculating today's quests:", error);
      return 0;
    }
  }

  private async getTodayCoinsEarned(userId: string): Promise<number> {
    try {
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return 0;

      const userData = userDoc.data();
      const totalCoins = userData.coins || 0;

      // Estimate today's coins (this could be improved with transaction logging)
      return Math.min(totalCoins * 0.1, 200); // Assume 10% of total or max 200
    } catch (error) {
      console.error("Error calculating today's coins:", error);
      return 0;
    }
  }

  private async getTodayTimeSpent(userId: string): Promise<number> {
    try {
      // This would require session tracking - for now return estimated value
      const userRef = doc(db, `${getBasePath()}/users/${userId}`);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return 0;

      const userData = userDoc.data();
      const completedTasks = userData.completedTasks || [];

      // Estimate 15 minutes per completed task
      return completedTasks.length * 15;
    } catch (error) {
      console.error("Error calculating today's time:", error);
      return 0;
    }
  }
}

// Export singleton instance
export const homeApi = new HomeApiService();
