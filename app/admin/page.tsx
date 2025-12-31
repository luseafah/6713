'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  DollarSign, TrendingUp, Users, Shield, AlertTriangle, 
  Eye, Ban, CheckCircle, XCircle, Crown, Activity, Crosshair
} from 'lucide-react';
import HuntMode from '@/components/HuntMode';
import AdminQuickActions from '@/components/AdminQuickActions';
import AdminMoneyChatPanel from '@/components/AdminMoneyChatPanel';

interface EconomicStats {
  totalTalentsInCirculation: number;
  totalRevenueUsd: number;
  verifiedUsers: number;
  shadowBannedUsers: number;
  fines24h: number;
  totalTalentsFined: number;
}

interface PendingVerification {
  id: string;
  user_id: string;
  profile_photo_url: string;
  submitted_at: string;
  username?: string;
  verified_name?: string;
}

interface RecentAction {
  id: string;
  action_type: string;
  target_user_id: string;
  amount?: number;
  reason?: string;
  created_at: string;
  target_username?: string;
}

/**
 * 6713 Protocol: Pope AI Command Center
 * 
 * Admin analytics dashboard with:
 * - Economic vital signs (revenue, talent flow)
 * - Moderation tools (ban hammer, verification queue)
 * - Fine log and action history
 * - Real-time stats
 * - Hunt Protocol activation
 */
export default function AdminCommandCenter() {
  const [stats, setStats] = useState<EconomicStats | null>(null);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [huntTarget, setHuntTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'money'>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Fetch current user and set isAdmin
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setIsAdmin(!!profile?.is_admin);
      }
    })();
  }, []);

  useEffect(() => {
    loadDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load economic stats
      const { data: economicData, error: economicError } = await supabase
        .from('admin_economic_stats')
        .select('*')
        .single();

      if (economicError) throw economicError;
      setStats(economicData as EconomicStats);

      // Load pending verifications
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_queue')
        .select(`
          *,
          profiles!inner(username, verified_name)
        `)
        .eq('id_verification_status', 'pending')
        .order('priority', { ascending: false })
        .order('submitted_at', { ascending: true })
        .limit(10);

      if (verificationError) throw verificationError;
      setPendingVerifications(verificationData || []);

      // Load recent admin actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('admin_actions')
        .select(`
          *,
          profiles!admin_actions_target_user_id_fkey(username)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (actionsError) throw actionsError;
      setRecentActions(actionsData || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('admin_approve_verification', {
        p_admin_user_id: user.id,
        p_target_user_id: userId,
        p_notes: 'Approved via Command Center',
      });

      if (error) throw error;

      alert('User verified successfully');
      loadDashboardData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRejectVerification = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ verification_status: 'rejected' })
        .eq('id', userId);

      await supabase
        .from('verification_queue')
        .update({ id_verification_status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('user_id', userId);

      alert('User verification rejected');
      loadDashboardData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500 text-xl animate-pulse">Loading Command Center...</div>
      </div>
    );
  }

  // Hunt Mode overlay
  if (huntTarget) {
    return <HuntMode targetUserId={huntTarget} onExit={() => setHuntTarget(null)} />;
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown size={40} className="text-yellow-500" />
          <h1 className="text-4xl font-bold text-yellow-500">Pope AI Command Center</h1>
        </div>
        <p className="text-white/60">The 6713 Protocol Administration Dashboard</p>
        
        {/* Tab Navigation */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-yellow-500 text-black'
                : 'bg-zinc-900 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('money')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'money'
                ? 'bg-green-600 text-white'
                : 'bg-zinc-900 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            💰 Money Chat
          </button>
        </div>
      </div>


      {/* Money Chat Panel (always for admin) */}
      {activeTab === 'money' && isAdmin && (
        <div className="mb-8">
          <AdminMoneyChatPanel adminView isPopeAI />
        </div>
      )}

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <>
          {/* Admin Controls Section */}
          {isAdmin && (
            <div className="bg-zinc-900 border border-green-500/30 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4 flex items-center gap-2">
                <Shield size={24} />
                Admin Controls
              </h2>
              <div className="mb-4 text-white/60 text-sm">
                Toggle admin features, verification, artist badge, glaze protocol, moderation, and hunt mode for your own account.
              </div>
              <AdminQuickActions targetUserId={null} adminView isPopeAI />
            </div>
          )}
          {/* Economic Vital Signs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm">Total Revenue</span>
            <DollarSign size={20} className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-500">
            ${stats?.totalRevenueUsd?.toFixed(2) || '0.00'}
          </div>
          <div className="text-white/40 text-xs mt-1">USD from Talent purchases</div>
        </div>

        <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm">Talents in Circulation</span>
            <TrendingUp size={20} className="text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-yellow-500">
            {stats?.totalTalentsInCirculation?.toLocaleString() || '0'}T
          </div>
          <div className="text-white/40 text-xs mt-1">Total user balances</div>
        </div>

        <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm">Verified Users</span>
            <Shield size={20} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-500">
            {stats?.verifiedUsers || 0}
          </div>
          <div className="text-white/40 text-xs mt-1">Active protocol participants</div>
        </div>
      </div>

      {/* Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm">Shadow Banned</span>
            <Ban size={20} className="text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-500">
            {stats?.shadowBannedUsers || 0}
          </div>
          <div className="text-white/40 text-xs mt-1">Muted frequencies</div>
        </div>

        <div className="bg-zinc-900 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm">Fines (24h)</span>
            <AlertTriangle size={20} className="text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-orange-500">
            {stats?.fines24h || 0}
          </div>
          <div className="text-white/40 text-xs mt-1">Protocol violations</div>
        </div>

        <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/60 text-sm">Total Fined</span>
            <DollarSign size={20} className="text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-purple-500">
            {stats?.totalTalentsFined?.toLocaleString() || '0'}T
          </div>
          <div className="text-white/40 text-xs mt-1">All-time deductions</div>
        </div>
      </div>

      {/* Verification Queue */}
      <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
          <Eye size={24} />
          Verification Queue ({pendingVerifications.length})
        </h2>

        {pendingVerifications.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No pending verifications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingVerifications.map((verification) => (
              <div key={verification.id} className="bg-black border border-white/10 rounded-lg p-4 relative group">
                {/* Hunt Button (Top Right) */}
                <button
                  onClick={() => setHuntTarget(verification.user_id)}
                  className="absolute top-2 right-2 p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Hunt Mode"
                >
                  <Crosshair size={16} className="text-red-500" />
                </button>

                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={verification.profile_photo_url || '/default-avatar.png'}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500"
                  />
                  <div className="flex-1">
                    <div className="text-white font-bold">{verification.verified_name || 'Unknown'}</div>
                    <div className="text-white/60 text-sm">@{verification.username || 'unknown'}</div>
                    <div className="text-white/40 text-xs mt-1">
                      {new Date(verification.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Use AdminQuickActions component */}
                <AdminQuickActions 
                  targetUserId={verification.user_id}
                  onAction={loadDashboardData}
                  variant="compact"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Admin Actions */}
      <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
          <Activity size={24} />
          Recent Admin Actions
        </h2>

        <div className="space-y-2">
          {recentActions.map((action) => {
            const actionIcons = {
              strike: <AlertTriangle size={16} className="text-orange-500" />,
              fine: <DollarSign size={16} className="text-red-500" />,
              gift: <DollarSign size={16} className="text-green-500" />,
              shadow_ban: <Ban size={16} className="text-purple-500" />,
              verify: <CheckCircle size={16} className="text-blue-500" />,
              delete_message: <XCircle size={16} className="text-red-500" />,
            };

            return (
              <div key={action.id} className="bg-black border border-white/10 rounded-lg p-3 flex items-center gap-3">
                {actionIcons[action.action_type as keyof typeof actionIcons] || <Activity size={16} />}
                <div className="flex-1">
                  <div className="text-white text-sm">
                    <span className="font-bold">{action.action_type.replace('_', ' ').toUpperCase()}</span> →{' '}
                    <span className="text-yellow-500">@{action.target_username || 'unknown'}</span>
                  </div>
                  {action.amount && (
                    <div className="text-white/60 text-xs">Amount: {action.amount}T</div>
                  )}
                  {action.reason && (
                    <div className="text-white/40 text-xs">{action.reason}</div>
                  )}
                </div>
                <div className="text-white/40 text-xs">
                  {new Date(action.created_at).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
