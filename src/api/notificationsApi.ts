import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db, getBasePath } from "../firebase/config";
import { dynamicCache } from "../utils/CacheManager";

export interface Notification {
  id: string;
  userId: string;
  type:
    | "friend_request_received"
    | "friend_request_accepted"
    | "friend_request_rejected"
    | "room_invitation_received"
    | "room_invitation_accepted"
    | "room_invitation_rejected"
    | "achievement"
    | "quest_milestone"
    | "level_up"
    | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
  link?: string;
  icon?: string;
  actionData?: {
    requestId?: string;
    roomId?: string;
    fromUserId?: string;
    fromUsername?: string;
    [key: string]: any;
  };
  // Auto-expire notifications after reading
  autoExpire?: boolean;
  expiresAt?: Timestamp;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

class NotificationsApiService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  /**
   * Get all notifications for a user
   */
  async getNotifications(
    userId: string,
    options: {
      count?: number;
      unreadOnly?: boolean;
      type?: string;
    } = {}
  ): Promise<ApiResponse<Notification[]>> {
    try {
      if (!userId) {
        return { success: false, message: "User ID is required" };
      }

      const { count = 50, unreadOnly = false, type } = options;
      const cacheKey = `notifications_${userId}_${unreadOnly}_${type || "all"}`;

      // Skip cache for real-time updates
      const notificationsRef = collection(db, `${getBasePath()}/notifications`);

      let notificationsQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(count)
      );

      if (unreadOnly) {
        notificationsQuery = query(
          notificationsRef,
          where("userId", "==", userId),
          where("isRead", "==", false),
          orderBy("createdAt", "desc"),
          limit(count)
        );
      }

      if (type) {
        notificationsQuery = query(
          notificationsRef,
          where("userId", "==", userId),
          where("type", "==", type),
          orderBy("createdAt", "desc"),
          limit(count)
        );
      }

      const querySnapshot = await getDocs(notificationsQuery);
      const notifications = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Notification)
      );

      // Cache results briefly
      dynamicCache.set(cacheKey, notifications, 30); // 30 seconds

      return {
        success: true,
        data: notifications,
        count: notifications.length,
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return {
        success: true,
        data: [],
        message: "No notifications available",
      };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    userId: string
  ): Promise<ApiResponse<NotificationStats>> {
    try {
      if (!userId) {
        return { success: false, message: "User ID is required" };
      }

      const notificationsRef = collection(db, `${getBasePath()}/notifications`);
      const allQuery = query(notificationsRef, where("userId", "==", userId));
      const unreadQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        where("isRead", "==", false)
      );

      const [allSnapshot, unreadSnapshot] = await Promise.all([
        getDocs(allQuery),
        getDocs(unreadQuery),
      ]);

      const byType: Record<string, number> = {};
      unreadSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        byType[data.type] = (byType[data.type] || 0) + 1;
      });

      const stats: NotificationStats = {
        total: allSnapshot.docs.length,
        unread: unreadSnapshot.docs.length,
        byType,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      return { success: false, message: "Failed to fetch statistics" };
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(
    notification: Omit<Notification, "id" | "createdAt" | "isRead">
  ): Promise<ApiResponse<Notification>> {
    try {
      const notificationsRef = collection(db, `${getBasePath()}/notifications`);

      const notificationData = {
        ...notification,
        createdAt: Timestamp.now(),
        isRead: false,
      };

      // Set auto-expire for certain notification types
      if (notification.autoExpire) {
        const expireTime = new Date();
        expireTime.setHours(expireTime.getHours() + 24); // 24 hours
        notificationData.expiresAt = Timestamp.fromDate(expireTime);
      }

      const docRef = await addDoc(notificationsRef, notificationData);

      const createdNotification: Notification = {
        id: docRef.id,
        ...notificationData,
      };

      // Invalidate cache
      dynamicCache.invalidate(`notifications_${notification.userId}`);

      return {
        success: true,
        data: createdNotification,
        message: "Notification created successfully",
      };
    } catch (error) {
      console.error("Error creating notification:", error);
      return {
        success: false,
        message: "Failed to create notification",
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
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
      };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return {
        success: false,
        message: "Failed to mark notification as read",
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<ApiResponse<void>> {
    try {
      const notificationsRef = collection(db, `${getBasePath()}/notifications`);
      const unreadQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        where("isRead", "==", false)
      );

      const snapshot = await getDocs(unreadQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          isRead: true,
          readAt: Timestamp.now(),
        });
      });

      await batch.commit();

      // Invalidate cache
      dynamicCache.invalidate(`notifications_${userId}`);

      return {
        success: true,
        message: `${snapshot.docs.length} notifications marked as read`,
      };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return {
        success: false,
        message: "Failed to mark notifications as read",
      };
    }
  }

  /**
   * Auto-clear expired notifications
   */
  async clearExpiredNotifications(userId: string): Promise<ApiResponse<void>> {
    try {
      const notificationsRef = collection(db, `${getBasePath()}/notifications`);
      const expiredQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        where("isRead", "==", true),
        where("autoExpire", "==", true),
        where("expiresAt", "<=", Timestamp.now())
      );

      const snapshot = await getDocs(expiredQuery);
      const batch = writeBatch(db);

      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();

      // Invalidate cache
      dynamicCache.invalidate(`notifications_${userId}`);

      return {
        success: true,
        message: `${snapshot.docs.length} expired notifications cleared`,
      };
    } catch (error) {
      console.error("Error clearing expired notifications:", error);
      return {
        success: false,
        message: "Failed to clear expired notifications",
      };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const notificationRef = doc(
        db,
        `${getBasePath()}/notifications/${notificationId}`
      );
      await deleteDoc(notificationRef);

      return {
        success: true,
        message: "Notification deleted",
      };
    } catch (error) {
      console.error("Error deleting notification:", error);
      return {
        success: false,
        message: "Failed to delete notification",
      };
    }
  }

  /**
   * Real-time subscription to notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[], stats: NotificationStats) => void,
    options: { unreadOnly?: boolean } = {}
  ): () => void {
    if (!userId) {
      console.warn("Cannot subscribe to notifications: User ID is required");
      return () => {};
    }

    const unsubscribeKey = `notifications_${userId}_${
      options.unreadOnly || "all"
    }`;

    // Clean up existing subscription
    if (this.unsubscribeCallbacks.has(unsubscribeKey)) {
      this.unsubscribeCallbacks.get(unsubscribeKey)!();
      this.unsubscribeCallbacks.delete(unsubscribeKey);
    }

    const notificationsRef = collection(db, `${getBasePath()}/notifications`);

    let notificationsQuery = query(
      notificationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    if (options.unreadOnly) {
      notificationsQuery = query(
        notificationsRef,
        where("userId", "==", userId),
        where("isRead", "==", false),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(
      notificationsQuery,
      async (snapshot) => {
        const notifications = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Notification)
        );

        // Get stats
        const statsResponse = await this.getNotificationStats(userId);
        const stats = statsResponse.data || { total: 0, unread: 0, byType: {} };

        callback(notifications, stats);
      },
      (error) => {
        console.error("Notifications subscription error:", error);
        callback([], { total: 0, unread: 0, byType: {} });
      }
    );

    this.unsubscribeCallbacks.set(unsubscribeKey, unsubscribe);
    return unsubscribe;
  }

  /**
   * Helper: Create friend request notification
   */
  async createFriendRequestNotification(
    toUserId: string,
    fromUserId: string,
    fromUsername: string,
    requestId: string
  ): Promise<ApiResponse<Notification>> {
    return this.createNotification({
      userId: toUserId,
      type: "friend_request_received",
      title: "New Friend Request",
      message: `${fromUsername} wants to be your champion friend!`,
      icon: "👋",
      link: "/friends",
      actionData: {
        requestId,
        fromUserId,
        fromUsername,
      },
      autoExpire: true,
    });
  }

  /**
   * Helper: Create friend request response notification
   */
  async createFriendRequestResponseNotification(
    toUserId: string,
    fromUsername: string,
    accepted: boolean,
    requestId: string
  ): Promise<ApiResponse<Notification>> {
    return this.createNotification({
      userId: toUserId,
      type: accepted ? "friend_request_accepted" : "friend_request_rejected",
      title: accepted ? "Friend Request Accepted!" : "Friend Request Declined",
      message: accepted
        ? `${fromUsername} accepted your friend request! You're now champion friends.`
        : `${fromUsername} declined your friend request.`,
      icon: accepted ? "🎉" : "😔",
      link: "/friends",
      actionData: {
        requestId,
        fromUsername,
      },
      autoExpire: true,
    });
  }

  /**
   * Helper: Create room invitation notification
   */
  async createRoomInvitationNotification(
    toUserId: string,
    fromUserId: string,
    fromUsername: string,
    roomId: string,
    roomName: string,
    requestId: string
  ): Promise<ApiResponse<Notification>> {
    return this.createNotification({
      userId: toUserId,
      type: "room_invitation_received",
      title: "Room Invitation",
      message: `${fromUsername} invited you to join "${roomName}"!`,
      icon: "🏰",
      link: `/rooms/${roomId}`,
      actionData: {
        requestId,
        roomId,
        fromUserId,
        fromUsername,
        roomName,
      },
      autoExpire: true,
    });
  }

  /**
   * Helper: Create room invitation response notification
   */
  async createRoomInvitationResponseNotification(
    toUserId: string,
    fromUsername: string,
    roomName: string,
    accepted: boolean,
    roomId?: string,
    requestId?: string
  ): Promise<ApiResponse<Notification>> {
    return this.createNotification({
      userId: toUserId,
      type: accepted ? "room_invitation_accepted" : "room_invitation_rejected",
      title: accepted
        ? "Room Invitation Accepted!"
        : "Room Invitation Declined",
      message: accepted
        ? `${fromUsername} joined "${roomName}"! The challenge awaits.`
        : `${fromUsername} declined your room invitation.`,
      icon: accepted ? "🎯" : "😕",
      link: accepted && roomId ? `/rooms/${roomId}` : "/rooms",
      actionData: {
        requestId,
        roomId,
        fromUsername,
        roomName,
      },
      autoExpire: true,
    });
  }

  /**
   * Clean up subscriptions
   */
  cleanup(): void {
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks.clear();
  }
}

export const notificationsApi = new NotificationsApiService();
