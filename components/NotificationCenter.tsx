'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Bell, X, ExternalLink } from 'lucide-react';
import TimeAgo from './TimeAgo';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    badgeCounts,
    markAsRead,
    markAllAsRead,
    navigateToDeepLink,
  } = useNotifications();

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signal':
        return '🚨';
      case 'gig_join_request':
      case 'gig_accepted':
      case 'pope_gig_close':
        return '👥';
      case 'wall_mention':
        return '@';
      case 'talent_throw':
        return '💰';
      case 'live_pulse':
        return '🔴';
      case 'new_story':
        return '📸';
      case 'self_kill':
        return '💀';
      case 'verification_status':
        return '✅';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    if (type === 'signal') return 'border-[#FFD700]';
    if (type.startsWith('gig_')) return 'border-blue-500';
    if (type.startsWith('wall_')) return 'border-green-500';
    if (type === 'live_pulse' || type === 'new_story') return 'border-purple-500';
    return 'border-white/10';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#FFD700]" />
            <div>
              <h2 className="text-white font-bold text-lg">Notifications</h2>
              {badgeCounts.total > 0 && (
                <p className="text-white/60 text-sm">{badgeCounts.total} unread</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badgeCounts.total > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[#FFD700] text-sm font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Badge Summary */}
        {badgeCounts.total > 0 && (
          <div className="p-4 border-b border-white/10">
            <div className="flex gap-2 flex-wrap">
              {badgeCounts.signals > 0 && (
                <div className="px-3 py-1 bg-[#FFD700]/20 border border-[#FFD700]/30 rounded-full text-xs font-medium text-[#FFD700]">
                  {badgeCounts.signals} Signals
                </div>
              )}
              {badgeCounts.gigs > 0 && (
                <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-medium text-blue-400">
                  {badgeCounts.gigs} Gigs
                </div>
              )}
              {badgeCounts.wall > 0 && (
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-medium text-green-400">
                  {badgeCounts.wall} Wall
                </div>
              )}
              {badgeCounts.live_hue > 0 && (
                <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-medium text-purple-400">
                  {badgeCounts.live_hue} Live/Hue
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No notifications yet</p>
              <p className="text-white/20 text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => navigateToDeepLink(notification)}
                  className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-4 ${
                    notification.is_read ? 'opacity-60' : ''
                  } ${getNotificationColor(notification.notification_type)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.notification_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-white font-medium text-sm">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-[#FFD700] rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-white/60 text-sm mb-2">
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-2">
                        <TimeAgo 
                          date={notification.created_at} 
                          className="text-white/40 text-xs"
                        />
                        {notification.deep_link && (
                          <ExternalLink className="w-3 h-3 text-white/40" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
