import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface BadgeCounts {
  total: number;
  signals: number;
  gigs: number;
  wall: number;
  live_hue: number;
  account: number;
}

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  data: any;
  deep_link?: string;
  is_read: boolean;
  created_at: string;
}

/**
 * 6713 Protocol - Notification Hook
 * Badge counts, real-time updates, and deep linking
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    total: 0,
    signals: 0,
    gigs: 0,
    wall: 0,
    live_hue: 0,
    account: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch notifications
   */
  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
    }
  };

  /**
   * Fetch badge counts
   */
  const fetchBadgeCounts = async () => {
    const { data } = await supabase.rpc('get_badge_counts');
    if (data) {
      setBadgeCounts(data);
      setUnreadCount(data.total);
    }
  };

  /**
   * Mark notification as read
   */
  const markAsRead = async (notificationId: string) => {
    await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });

    // Update local state
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );

    // Refresh badge counts
    fetchBadgeCounts();
  };

  /**
   * Mark all as read
   */
  const markAllAsRead = async () => {
    await supabase.rpc('mark_all_notifications_read');
    
    // Update local state
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );

    // Refresh badge counts
    fetchBadgeCounts();
  };

  /**
   * Navigate to deep link
   */
  const navigateToDeepLink = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate to deep link
    if (notification.deep_link) {
      window.location.href = notification.deep_link;
    }
  };

  /**
   * Play notification sound
   */
  const playNotificationSound = () => {
    // The unique "6713 Ping" sound
    const audio = new Audio('/sounds/6713-ping.mp3');
    audio.volume = 0.5;
    audio.play().catch((err) => console.log('Audio play blocked:', err));
  };

  /**
   * Subscribe to real-time notifications
   */
  useEffect(() => {
    fetchNotifications();
    fetchBadgeCounts();
    setLoading(false);

    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Add to notifications list
          setNotifications((prev) => [newNotification, ...prev]);
          
          // Update badge counts
          fetchBadgeCounts();
          
          // Play notification sound
          playNotificationSound();
          
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.body,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: newNotification.id,
              data: { deep_link: newNotification.deep_link },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Request notification permission
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  return {
    notifications,
    badgeCounts,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    navigateToDeepLink,
    requestNotificationPermission,
    refresh: () => {
      fetchNotifications();
      fetchBadgeCounts();
    },
  };
}
