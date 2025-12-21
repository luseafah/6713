'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FixedHeader } from '@/components/FixedHeader';
import { Bell, DollarSign, Users, MessageSquare, Radio, Moon, Clock } from 'lucide-react';

interface NotificationPreferences {
  signals: {
    enabled: boolean;
    verified_only: boolean;
  };
  gigs: {
    join_request: boolean;
    gig_accepted: boolean;
    pope_gig_close: boolean;
  };
  wall: {
    mentions: boolean;
    talent_throw: boolean;
  };
  live_hue: {
    live_pulse: boolean;
    new_story: boolean;
  };
  account: {
    self_kill: boolean;
    verification_status: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  signals: { enabled: true, verified_only: true },
  gigs: { join_request: true, gig_accepted: true, pope_gig_close: true },
  wall: { mentions: true, talent_throw: true },
  live_hue: { live_pulse: true, new_story: true },
  account: { self_kill: true, verification_status: true },
  quiet_hours: { enabled: false, start_time: '00:00', end_time: '06:00' },
};

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Load preferences
  useEffect(() => {
    async function loadPreferences() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences, is_verified')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setIsVerified(profile.is_verified);
        if (profile.notification_preferences) {
          setPreferences(profile.notification_preferences as NotificationPreferences);
        }
      }

      setLoading(false);
    }

    loadPreferences();
  }, []);

  // Save preferences
  const savePreferences = async (newPreferences: NotificationPreferences) => {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: newPreferences })
      .eq('user_id', user.id);

    if (!error) {
      setPreferences(newPreferences);
    }

    setSaving(false);
  };

  // Toggle handlers
  const toggleSignals = async () => {
    const newPrefs = {
      ...preferences,
      signals: { ...preferences.signals, enabled: !preferences.signals.enabled },
    };
    await savePreferences(newPrefs);
  };

  const toggleGigSetting = async (key: keyof NotificationPreferences['gigs']) => {
    const newPrefs = {
      ...preferences,
      gigs: { ...preferences.gigs, [key]: !preferences.gigs[key] },
    };
    await savePreferences(newPrefs);
  };

  const toggleWallSetting = async (key: keyof NotificationPreferences['wall']) => {
    const newPrefs = {
      ...preferences,
      wall: { ...preferences.wall, [key]: !preferences.wall[key] },
    };
    await savePreferences(newPrefs);
  };

  const toggleLiveHueSetting = async (key: keyof NotificationPreferences['live_hue']) => {
    const newPrefs = {
      ...preferences,
      live_hue: { ...preferences.live_hue, [key]: !preferences.live_hue[key] },
    };
    await savePreferences(newPrefs);
  };

  const toggleAccountSetting = async (key: keyof NotificationPreferences['account']) => {
    const newPrefs = {
      ...preferences,
      account: { ...preferences.account, [key]: !preferences.account[key] },
    };
    await savePreferences(newPrefs);
  };

  const toggleQuietHours = async () => {
    const newPrefs = {
      ...preferences,
      quiet_hours: {
        ...preferences.quiet_hours,
        enabled: !preferences.quiet_hours.enabled,
      },
    };
    await savePreferences(newPrefs);
  };

  const updateQuietHours = async (startTime: string, endTime: string) => {
    const newPrefs = {
      ...preferences,
      quiet_hours: {
        ...preferences.quiet_hours,
        start_time: startTime,
        end_time: endTime,
      },
    };
    await savePreferences(newPrefs);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/40">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <FixedHeader title="Notification Frequencies" />

      <div className="p-4 space-y-6">
        {/* Header Info */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-[#FFD700] mt-0.5" />
            <div>
              <h3 className="text-white font-medium mb-1">Protocol Frequency Control</h3>
              <p className="text-white/60 text-sm">
                Tune into specific signals while silencing others. Your notifications, your rules.
              </p>
            </div>
          </div>
        </div>

        {/* $$$4U Signals (Verified Only) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#FFD700]" />
            <h3 className="text-white font-bold">$$$4U Signals</h3>
            {!isVerified && (
              <span className="text-xs px-2 py-0.5 bg-white/10 text-white/60 rounded-full">
                Verified Only
              </span>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Wealth Alerts</p>
                <p className="text-white/60 text-sm">
                  New Forex & Crypto signals from Pope AI
                </p>
              </div>
              <button
                onClick={toggleSignals}
                disabled={!isVerified || saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.signals.enabled && isVerified
                    ? 'bg-[#FFD700]'
                    : 'bg-white/20'
                } ${!isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.signals.enabled && isVerified ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            {!isVerified && (
              <p className="text-[#FFD700] text-xs mt-2">
                🔒 Verification required to receive Signal alerts
              </p>
            )}
          </div>
        </div>

        {/* G$4U & Gigs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold">G$4U & Gigs</h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/10">
            {/* Join Request */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">New Join Request</p>
                <p className="text-white/60 text-sm">Someone wants to join your Gig</p>
              </div>
              <button
                onClick={() => toggleGigSetting('join_request')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.gigs.join_request ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.gigs.join_request ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Gig Accepted */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Gig Accepted</p>
                <p className="text-white/60 text-sm">Creator accepted your request</p>
              </div>
              <button
                onClick={() => toggleGigSetting('gig_accepted')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.gigs.gig_accepted ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.gigs.gig_accepted ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Pope AI Gig-Close */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Pope AI Gig-Close</p>
                <p className="text-white/60 text-sm">3s voice note & photo requirement</p>
              </div>
              <button
                onClick={() => toggleGigSetting('pope_gig_close')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.gigs.pope_gig_close ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.gigs.pope_gig_close ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* The Wall (#Earth) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold">The Wall (#Earth)</h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/10">
            {/* Mentions */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Mentions/@Handles</p>
                <p className="text-white/60 text-sm">Someone mentioned your @username</p>
              </div>
              <button
                onClick={() => toggleWallSetting('mentions')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.wall.mentions ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.wall.mentions ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Talent Throw */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Talent Throw</p>
                <p className="text-white/60 text-sm">Someone threw Talents at your message</p>
              </div>
              <button
                onClick={() => toggleWallSetting('talent_throw')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.wall.talent_throw ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.wall.talent_throw ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Live & Hue */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold">Live & Hue</h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/10">
            {/* Live Pulse */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Live Pulse</p>
                <p className="text-white/60 text-sm">Followed user starts streaming</p>
              </div>
              <button
                onClick={() => toggleLiveHueSetting('live_pulse')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.live_hue.live_pulse ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.live_hue.live_pulse ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* New Story */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">New Hue Story</p>
                <p className="text-white/60 text-sm">New 3-day post from followed users</p>
              </div>
              <button
                onClick={() => toggleLiveHueSetting('new_story')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.live_hue.new_story ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.live_hue.new_story ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account Activity */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold">Account Activity</h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg divide-y divide-white/10">
            {/* Self-Kill Alerts */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Self-Kill Alerts</p>
                <p className="text-white/60 text-sm">Connection deleted their account</p>
              </div>
              <button
                onClick={() => toggleAccountSetting('self_kill')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.account.self_kill ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.account.self_kill ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Verification Status */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Verification Status</p>
                <p className="text-white/60 text-sm">Updates from Pope AI</p>
              </div>
              <button
                onClick={() => toggleAccountSetting('verification_status')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.account.verification_status ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.account.verification_status ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold">Quiet Hours</h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Mute All Frequencies</p>
                <p className="text-white/60 text-sm">Silence notifications during sleep</p>
              </div>
              <button
                onClick={toggleQuietHours}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences.quiet_hours.enabled ? 'bg-[#FFD700]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences.quiet_hours.enabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {preferences.quiet_hours.enabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span className="text-white/60 text-sm">Time Range</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Start</label>
                    <input
                      type="time"
                      value={preferences.quiet_hours.start_time}
                      onChange={(e) =>
                        updateQuietHours(e.target.value, preferences.quiet_hours.end_time)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">End</label>
                    <input
                      type="time"
                      value={preferences.quiet_hours.end_time}
                      onChange={(e) =>
                        updateQuietHours(preferences.quiet_hours.start_time, e.target.value)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-4">
          <p className="text-white/80 text-sm">
            🔔 <span className="font-medium">The 6713 Ping</span>: All notifications use a unique protocol sound to distinguish from standard apps.
          </p>
        </div>

        {saving && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[#FFD700] text-black px-4 py-2 rounded-full font-medium text-sm shadow-lg">
            Saving preferences...
          </div>
        )}
      </div>
    </div>
  );
}
