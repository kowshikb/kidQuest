import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Zap,
  Award,
  UserPlus,
  X,
  Check,
  Clock,
  MessageSquare,
  Users,
  Home,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  notificationsApi,
  Notification,
  NotificationStats,
} from "../api/notificationsApi";
import { useAuth } from "../contexts/AuthContext";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCount: number;
  onNotificationCountChange: (count: number) => void;
}

const getNotificationIcon = (type: Notification["type"]) => {
  const iconMap = {
    friend_request_received: <UserPlus className="w-5 h-5 text-blue-500" />,
    friend_request_accepted: <Check className="w-5 h-5 text-green-500" />,
    friend_request_rejected: <X className="w-5 h-5 text-red-500" />,
    room_invitation_received: (
      <MessageSquare className="w-5 h-5 text-purple-500" />
    ),
    room_invitation_accepted: <Users className="w-5 h-5 text-green-500" />,
    room_invitation_rejected: <X className="w-5 h-5 text-orange-500" />,
    achievement: <Award className="w-5 h-5 text-yellow-500" />,
    quest_milestone: <Sparkles className="w-5 h-5 text-purple-500" />,
    level_up: <Zap className="w-5 h-5 text-purple-500" />,
    system: <Bell className="w-5 h-5 text-gray-500" />,
  };

  return iconMap[type] || <Bell className="w-5 h-5 text-gray-500" />;
};

const getNotificationColor = (type: Notification["type"]) => {
  const colorMap = {
    friend_request_received: "border-l-blue-500 bg-blue-50",
    friend_request_accepted: "border-l-green-500 bg-green-50",
    friend_request_rejected: "border-l-red-500 bg-red-50",
    room_invitation_received: "border-l-purple-500 bg-purple-50",
    room_invitation_accepted: "border-l-green-500 bg-green-50",
    room_invitation_rejected: "border-l-orange-500 bg-orange-50",
    achievement: "border-l-yellow-500 bg-yellow-50",
    quest_milestone: "border-l-purple-500 bg-purple-50",
    level_up: "border-l-purple-500 bg-purple-50",
    system: "border-l-gray-500 bg-gray-50",
  };

  return colorMap[type] || "border-l-gray-500 bg-gray-50";
};

const formatRelativeTime = (timestamp: any) => {
  const now = new Date();
  const notificationTime = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);
  const diffInMs = now.getTime() - notificationTime.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return notificationTime.toLocaleDateString();
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notificationCount,
  onNotificationCountChange,
}) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Auto-clear notifications after panel opens (with 5-second delay)
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      // Clear the existing timeout if any
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }

      // Set a 5-second delay before auto-clearing
      clearTimeoutRef.current = setTimeout(async () => {
        if (currentUser && stats.unread > 0) {
          console.log("🔔 Auto-clearing notifications after 5 seconds...");
          await handleMarkAllAsRead();
        }
      }, 5000);
    }

    // Cleanup timeout when panel closes
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }
    };
  }, [isOpen, notifications.length, stats.unread, currentUser]);

  // Real-time subscription to notifications
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    console.log("🔔 Setting up notification subscription for", currentUser.uid);

    try {
      const unsubscribe = notificationsApi.subscribeToNotifications(
        currentUser.uid,
        (newNotifications, newStats) => {
          if (!newNotifications || !newStats) {
            console.error("🔔 Invalid notification data received");
            setError("Failed to load notifications");
            setLoading(false);
            return;
          }

          console.log("🔔 Received notification update:", {
            count: newNotifications.length,
            unread: newStats.unread,
          });

          setNotifications(newNotifications);
          setStats(newStats);
          onNotificationCountChange(newStats.unread);
          setLoading(false);
          setError(null);
        },
        { unreadOnly: false }
      );

      unsubscribeRef.current = unsubscribe;

      return () => {
        console.log("🔔 Cleaning up notification subscription");
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } catch (error) {
      console.error("🔔 Failed to setup notification subscription:", error);
      setError("Failed to setup notifications");
      setLoading(false);
    }
  }, [currentUser, onNotificationCountChange]);

  // Initial fetch when panel opens
  useEffect(() => {
    if (isOpen && currentUser && notifications.length === 0) {
      setLoading(true);
      // The subscription will handle the actual loading
    }
  }, [isOpen, currentUser]);

  const handleMarkAllAsRead = async () => {
    if (!currentUser || clearingAll) return;

    setClearingAll(true);
    try {
      const response = await notificationsApi.markAllAsRead(currentUser.uid);
      if (response.success) {
        console.log("✅ All notifications marked as read");
        // The real-time subscription will update the UI
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      setError("Failed to mark notifications as read");
    } finally {
      setClearingAll(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUser) return;

    try {
      await notificationsApi.markAsRead(notificationId);
      // The real-time subscription will update the UI
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!currentUser) return;

    try {
      await notificationsApi.deleteNotification(notificationId);
      // The real-time subscription will update the UI
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Clear expired notifications when panel opens
  useEffect(() => {
    if (isOpen && currentUser) {
      notificationsApi.clearExpiredNotifications(currentUser.uid);
    }
  }, [isOpen, currentUser]);

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-full mt-3 right-0 w-96 bg-white rounded-2xl shadow-2xl border border-purple-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xl">Notifications</h3>
                  <p className="text-purple-100 text-sm">
                    {stats.unread > 0
                      ? `${stats.unread} unread`
                      : "You're all caught up!"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {stats.unread > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={clearingAll}
                      className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {clearingAll ? (
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Clearing...</span>
                        </div>
                      ) : (
                        "Mark all read"
                      )}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 flex items-center justify-center">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                    <span className="text-gray-600">
                      Loading notifications...
                    </span>
                  </div>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <div className="text-red-500 text-4xl mb-2">⚠️</div>
                  <p className="text-red-600 font-medium">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">🔔</div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">
                    No notifications yet
                  </h4>
                  <p className="text-gray-500">
                    We'll notify you about friend requests, room invitations,
                    and achievements!
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Unread notifications */}
                  {unreadNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors border-l-4 ${getNotificationColor(
                        notification.type
                      )}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 text-sm">
                                {notification.title}
                              </h5>
                              <p className="text-gray-700 text-sm mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
                                {notification.icon && (
                                  <span className="text-sm">
                                    {notification.icon}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              <button
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4 text-gray-400 hover:text-green-500" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteNotification(notification.id)
                                }
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Read notifications (if any) */}
                  {readNotifications.length > 0 && (
                    <>
                      {unreadNotifications.length > 0 && (
                        <div className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-medium border-b">
                          Previously read
                        </div>
                      )}
                      {readNotifications
                        .slice(0, 5)
                        .map((notification, index) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                              delay:
                                (unreadNotifications.length + index) * 0.05,
                            }}
                            className="p-4 border-b border-gray-100 opacity-60 hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1 opacity-60">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-gray-700 text-sm">
                                  {notification.title}
                                </h5>
                                <p className="text-gray-600 text-sm mt-1">
                                  {notification.message}
                                </p>
                                <span className="text-xs text-gray-400 flex items-center mt-2">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  handleDeleteNotification(notification.id)
                                }
                                className="p-1 hover:bg-gray-200 rounded transition-colors opacity-60 hover:opacity-100"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Auto-clear after 5 seconds • Showing {notifications.length}{" "}
                    recent notifications
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
