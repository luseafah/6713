'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, CheckCircle, AlertCircle, Gift, DollarSign, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'verification' | 'talent' | 'message' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  timestamp: Date;
}

/**
 * Protocol Notifications
 * Toast-style notifications that slide in from top-right
 * Auto-dismiss after 5 seconds or manual dismiss
 */
export default function ProtocolNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      subscribeToNotifications(user.id);
    }
  };

  const subscribeToNotifications = (uid: string) => {
    // Listen for profile updates (verification status changes)
    const profileChannel = supabase
      .channel('profile-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${uid}`,
      }, (payload: any) => {
        const newData = payload.new;
        const oldData = payload.old;

        // Verification approved
        if (newData.verified_at && !oldData.verified_at) {
          addNotification({
            type: 'verification',
            title: 'You are Verified! 🎉',
            message: 'Welcome to 6713 Protocol. Full access granted.',
            actionUrl: '/wall',
          });
        }

        // Verification rejected
        if (newData.verification_status === 'rejected' && oldData.verification_status !== 'rejected') {
          addNotification({
            type: 'verification',
            title: 'Verification Update',
            message: 'Please resubmit your verification photo.',
            actionUrl: '/messages/pope',
          });
        }
      })
      .subscribe();

    // Listen for talent transactions (gifts)
    const talentChannel = supabase
      .channel('talent-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'talent_transactions',
        filter: `to_user_id=eq.${uid}`,
      }, (payload: any) => {
        const tx = payload.new;
        addNotification({
          type: 'talent',
          title: `${tx.amount}T Received! 💰`,
          message: 'Someone threw Talents your way',
          actionUrl: '/money',
        });
      })
      .subscribe();

    // Listen for new DM messages
    const dmChannel = supabase
      .channel('dm-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dm_messages',
      }, async (payload: any) => {
        const msg = payload.new;
        
        // Check if message is for current user
        const { data: thread } = await supabase
          .from('dm_threads')
          .select('user_id')
          .eq('id', msg.thread_id)
          .single();

        if (thread?.user_id === uid && msg.sender_id !== uid) {
          addNotification({
            type: 'message',
            title: 'New Message',
            message: msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : ''),
            actionUrl: '/messages',
          });
        }
      })
      .subscribe();

    return () => {
      profileChannel.unsubscribe();
      talentChannel.unsubscribe();
      dmChannel.unsubscribe();
    };
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotif: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(newNotif.id);
    }, 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    dismissNotification(notification.id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'talent':
        return <DollarSign className="w-5 h-5 text-yellow-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'verification':
        return 'from-green-500/20 to-emerald-500/10 border-green-500/50';
      case 'talent':
        return 'from-yellow-500/20 to-amber-500/10 border-yellow-500/50';
      case 'message':
        return 'from-purple-500/20 to-pink-500/10 border-purple-500/50';
      default:
        return 'from-blue-500/20 to-cyan-500/10 border-blue-500/50';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-[250] space-y-3 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 400, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={() => handleNotificationClick(notification)}
            className={`bg-gradient-to-br ${getGradient(notification.type)} backdrop-blur-xl border rounded-2xl p-4 cursor-pointer shadow-2xl hover:scale-105 transition-transform`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-white/80 text-xs leading-relaxed">
                  {notification.message}
                </p>
                <p className="text-white/40 text-xs mt-2">
                  {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Progress bar for auto-dismiss */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-1 bg-white/30 rounded-full mt-3"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
