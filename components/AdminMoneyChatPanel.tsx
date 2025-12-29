'use client';

import { useEffect, useState } from 'react';
import { DollarSign, CheckCircle, XCircle, Edit3, Loader2, StrikethroughIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import TimeAgo from '@/components/TimeAgo';

interface PaymentProof {
  proof_id: string;
  user_id: string;
  username: string;
  email: string;
  amount_claimed: number;
  talents_requested: number;
  status: string;
  created_at: string;
  message_id: string;
  message_content?: string;
  proof_url?: string;
  current_balance: number;
}

interface MoneyChatUser {
  user_id: string;
  username: string;
  email: string;
  message_count: number;
  last_message_at: string;
  payment_proof_count: number;
  unread_count: number;
}

interface MoneyChatMessage {
  id: string;
  user_id: string;
  sender_type: 'user' | 'admin';
  message_type: 'text' | 'image' | 'voice';
  content?: string;
  media_url?: string;
  is_payment_proof: boolean;
  is_strikethrough: boolean;
  created_at: string;
}

export default function AdminMoneyChatPanel({ adminView = false, isPopeAI = false }: { adminView?: boolean, isPopeAI?: boolean }) {
  const [pendingProofs, setPendingProofs] = useState<PaymentProof[]>([]);
  const [activeChats, setActiveChats] = useState<MoneyChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userMessages, setUserMessages] = useState<MoneyChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingProofId, setProcessingProofId] = useState<string | null>(null);
  const [balanceInput, setBalanceInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [adminMessage, setAdminMessage] = useState<string>('');
  const [currentUserBalance, setCurrentUserBalance] = useState(0);

  useEffect(() => {
    if (!adminView || !isPopeAI) return; // Only show for Pope AI in admin mode
    loadData();
    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserMessages(selectedUserId);
      loadUserBalance(selectedUserId);
    }
  }, [selectedUserId]);

  const loadData = async () => {
    try {
      // Load pending payment proofs
      const { data: proofs } = await supabase
        .from('admin_payment_queue')
        .select('*');
      
      setPendingProofs(proofs || []);

      // Load active chats
      const { data: chats } = await supabase
        .from('admin_active_money_chats')
        .select('*');
      
      setActiveChats(chats || []);

    } catch (error) {
      console.error('Error loading admin money chat data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserMessages = async (userId: string) => {
    const { data } = await supabase
      .from('money_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    setUserMessages(data || []);
  };

  const loadUserBalance = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('talent_balance')
      .eq('id', userId)
      .single();
    
    if (data) {
      setCurrentUserBalance(data.talent_balance);
    }
  };

  const handleSetBalance = async () => {
    if (!selectedUserId || !balanceInput) return;

    setProcessingProofId('balance-edit');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newBalance = parseInt(balanceInput);
      if (isNaN(newBalance) || newBalance < 0) {
        throw new Error('Invalid balance amount');
      }

      const { data, error } = await supabase.rpc('admin_set_talent_balance', {
        p_admin_user_id: user.id,
        p_target_user_id: selectedUserId,
        p_new_balance: newBalance,
        p_reason: reasonInput || 'Manual balance adjustment'
      });

      if (error) throw error;

      if (data?.success) {
        alert(`Balance updated!\nOld: ${data.old_balance} → New: ${data.new_balance}`);
        setBalanceInput('');
        setReasonInput('');
        loadUserBalance(selectedUserId);
        loadData();
      }
    } catch (error: any) {
      console.error('Error setting balance:', error);
      alert(error.message || 'Failed to update balance');
    } finally {
      setProcessingProofId(null);
    }
  };

  const handleStrikethrough = async (messageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('admin_strikethrough_money_message', {
        p_admin_user_id: user.id,
        p_message_id: messageId
      });

      if (error) throw error;

      // Refresh messages
      if (selectedUserId) {
        loadUserMessages(selectedUserId);
      }
    } catch (error) {
      console.error('Error toggling strikethrough:', error);
    }
  };

  const handleSendAdminMessage = async () => {
    if (!selectedUserId || !adminMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('send_money_chat_message', {
        p_user_id: selectedUserId,
        p_sender_type: 'admin',
        p_message_type: 'text',
        p_content: adminMessage.trim(),
        p_admin_user_id: user.id
      });

      if (error) throw error;

      setAdminMessage('');
      loadUserMessages(selectedUserId);
    } catch (error) {
      console.error('Error sending admin message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="w-8 h-8 text-green-500" />
        <h2 className="text-2xl font-bold text-white">Money Chat Management</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payment Proofs */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-yellow-500" />
            Pending Payment Proofs ({pendingProofs.length})
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {pendingProofs.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">No pending proofs</p>
            ) : (
              pendingProofs.map((proof) => (
                <div
                  key={proof.proof_id}
                  className="bg-zinc-800 border border-white/10 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">@{proof.username}</p>
                      <p className="text-white/40 text-xs">{proof.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedUserId(proof.user_id)}
                      className="text-green-500 hover:text-green-400 text-sm font-medium"
                    >
                      View Chat →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-white/60">Claimed Amount</p>
                      <p className="text-white font-bold">${proof.amount_claimed}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Talents Requested</p>
                      <p className="text-white font-bold">{proof.talents_requested} 💎</p>
                    </div>
                  </div>

                  {proof.proof_url && (
                    <img
                      src={proof.proof_url}
                      alt="Payment proof"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}

                  <p className="text-white/40 text-xs">
                    <TimeAgo date={proof.created_at} />
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Chats */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">
            Active Chats ({activeChats.length})
          </h3>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {activeChats.map((chat) => (
              <button
                key={chat.user_id}
                onClick={() => setSelectedUserId(chat.user_id)}
                className={`w-full text-left bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl p-4 transition-colors ${
                  selectedUserId === chat.user_id ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium">@{chat.username}</p>
                  {chat.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {chat.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{chat.message_count} messages</span>
                  <span>{chat.payment_proof_count} proofs</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected User Chat */}
      {selectedUserId && (
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold text-lg">
              Chat with @{activeChats.find(c => c.user_id === selectedUserId)?.username}
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white/60 text-xs">Current Balance</p>
                <p className="text-white font-bold">{currentUserBalance} 💎</p>
              </div>
            </div>
          </div>

          {/* Balance Control */}
          <div className="bg-zinc-800 border border-white/10 rounded-xl p-4 mb-6">
            <p className="text-white font-medium mb-3 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Set Talent Balance
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="number"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                placeholder="New balance"
                className="bg-zinc-900 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Reason (optional)"
                className="bg-zinc-900 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleSetBalance}
                disabled={!balanceInput || processingProofId === 'balance-edit'}
                className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {processingProofId === 'balance-edit' ? 'Updating...' : 'Update Balance'}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
            {userMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-xl p-3 ${
                    msg.sender_type === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-800 text-white border border-white/10'
                  } ${msg.is_strikethrough ? 'opacity-40 line-through' : ''}`}
                >
                  {msg.content && <p className="text-sm">{msg.content}</p>}
                  
                  {msg.message_type === 'image' && msg.media_url && (
                    <img
                      src={msg.media_url}
                      alt="Message"
                      className="rounded-lg max-w-full h-auto mt-2"
                    />
                  )}

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <p className="text-xs opacity-60">
                      <TimeAgo date={msg.created_at} />
                    </p>
                    
                    {msg.sender_type === 'user' && (
                      <button
                        onClick={() => handleStrikethrough(msg.id)}
                        className="text-white/60 hover:text-white"
                        title="Toggle strikethrough"
                      >
                        <StrikethroughIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Reply */}
          <div className="flex gap-2">
            <input
              type="text"
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendAdminMessage()}
              placeholder="Reply as Admin..."
              className="flex-1 bg-zinc-800 text-white border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleSendAdminMessage}
              disabled={!adminMessage.trim()}
              className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
