import { useState, useEffect, useCallback } from 'react';
import { homeApi, DashboardData } from '../api/homeApi';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';

interface UseHomeReturn {
  dashboard: DashboardData | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshDashboard: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<boolean>;
  markAllNotificationsAsRead: () => Promise<boolean>;
  
  // Computed values
  hasUnreadNotifications: boolean;
  todayProgress: number;
  weeklyProgress: number;
}

export const useHome = (): UseHomeReturn => {
  const { currentUser } = useAuth();
  const { showModal } = useModal();
  
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await homeApi.getDashboard(currentUser.uid);

      if (response.success && response.data) {
        setDashboard(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard');
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      showModal({
        title: "Dashboard Loading Error",
        message: "We couldn't load your dashboard. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, showModal]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await homeApi.markNotificationAsRead(notificationId);

      if (response.success) {
        // Update local state
        setDashboard(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            notifications: prev.notifications.map(notification =>
              notification.id === notificationId
                ? { ...notification, isRead: true }
                : notification
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1)
          };
        });
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const response = await homeApi.markAllNotificationsAsRead(currentUser.uid);

      if (response.success) {
        // Update local state
        setDashboard(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            notifications: prev.notifications.map(notification => ({
              ...notification,
              isRead: true
            })),
            unreadCount: 0
          };
        });
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to mark notifications as read');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [currentUser]);

  // Refresh dashboard
  const refreshDashboard = useCallback(async () => {
    await fetchDashboard();
  }, [fetchDashboard]);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Computed values
  const hasUnreadNotifications = dashboard ? dashboard.unreadCount > 0 : false;
  
  const todayProgress = dashboard ? 
    Math.min(100, (dashboard.stats.todayProgress.questsCompleted / 3) * 100) : 0;
  
  const weeklyProgress = dashboard ? 
    Math.min(100, (dashboard.stats.weeklyProgress.questsCompleted / 10) * 100) : 0;

  return {
    dashboard,
    loading,
    error,
    refreshDashboard,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    hasUnreadNotifications,
    todayProgress,
    weeklyProgress
  };
};

export default useHome;