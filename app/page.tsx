'use client';

import { useState } from 'react';
import NavigationBar from '@/components/NavigationBar';
import InteractionStack from '@/components/InteractionStack';
import SettingsModal from '@/components/SettingsModal';
import DMModal from '@/components/DMModal';
import Post from '@/components/Post';

// Mock data - In production, this would come from Supabase
// Set to 'admin' to see admin controls in Pope AI chat
const mockProfile = {
  id: '1',
  username: 'user123',
  is_verified: true,
  role: 'admin' as const, // Change to 'user' for regular user view
  coma_status: false,
  talent_balance: 100,
  deactivated_at: null,
  cpr_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockPosts = [
  {
    id: '1',
    username: 'alice',
    isVerified: true,
    content: 'Just experienced the most incredible sunset. Nature never ceases to amaze! 🌅',
    likeCount: 1234,
    commentCount: 89,
    isLiked: false,
    isSaved: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    username: 'bob',
    isVerified: false,
    content: 'Working on something exciting. Can\'t wait to share it with you all!',
    mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    likeCount: 567,
    commentCount: 34,
    isLiked: true,
    isSaved: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export default function Home() {
  const [profile, setProfile] = useState(mockProfile);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [posts, setPosts] = useState(mockPosts);
  const [selectedRecipient, setSelectedRecipient] = useState({
    id: 'pope-ai',
    username: 'Pope AI',
    comaStatus: false,
    isVerified: true,
  });

  const handleComaToggle = (status: boolean) => {
    setProfile({ ...profile, coma_status: status });
    // In production: Update Supabase
    console.log('COMA status updated:', status);
  };

  const handleUploadClick = () => {
    console.log('Upload clicked - would open file picker');
    // In production: Implement file upload
  };

  const handleSendMessage = (content: string, isWhisper: boolean) => {
    console.log('Sending message:', { content, isWhisper });
    // In production: Save to Supabase messages table
  };

  const handleFourthWallBreak = () => {
    console.log('4th Wall Break requested');
    // In production: Create fourth_wall_break record and deduct 100 talents
  };

  const handleVerifyUser = () => {
    console.log('Verifying user');
    // In production: Update user's is_verified to true
  };

  const handleMakeAdmin = () => {
    console.log('Making user admin');
    // In production: Update user's role to 'admin'
  };

  const handlePostAction = (postId: string, action: string) => {
    console.log(`Post ${postId} action:`, action);
    // In production: Update Supabase
    
    setPosts(posts.map(post => {
      if (post.id === postId) {
        switch (action) {
          case 'like':
            return {
              ...post,
              isLiked: !post.isLiked,
              likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
            };
          case 'save':
            return {
              ...post,
              isSaved: !post.isSaved,
            };
          default:
            return post;
        }
      }
      return post;
    }));
  };

  const handleShare = async (postId: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '6713 Post',
          text: 'Check out this post on 6713!',
          url: `${window.location.origin}/post/${postId}`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      console.log('Native share not supported');
    }
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Navigation Bar */}
      <NavigationBar
        isVerified={profile.is_verified}
        onUploadClick={handleUploadClick}
      />

      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 max-w-2xl mx-auto">
        <div className="space-y-6">
          {posts.map((post) => (
            <Post
              key={post.id}
              {...post}
              onLike={() => handlePostAction(post.id, 'like')}
              onComment={() => console.log('Comment on post', post.id)}
              onShare={() => handleShare(post.id)}
              onSave={() => handlePostAction(post.id, 'save')}
            />
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center text-white/40 mt-20">
            <p className="text-lg">Welcome to 6713</p>
            <p className="text-sm mt-2">No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>

      {/* Interaction Stack */}
      <InteractionStack
        onSettingsClick={() => setIsSettingsOpen(true)}
        onDMClick={() => setIsDMOpen(true)}
        onAvatarClick={() => console.log('Avatar clicked')}
        onLikeClick={() => console.log('Like clicked')}
        onCommentClick={() => console.log('Comment clicked')}
        onShareClick={() => handleShare('current')}
        onSaveClick={() => console.log('Save clicked')}
        likeCount={13}
        commentCount={67}
        qtBlimpTime="2:45"
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        comaStatus={profile.coma_status}
        onComaToggle={handleComaToggle}
        username={profile.username}
        isVerified={profile.is_verified}
        role={profile.role}
        talentBalance={profile.talent_balance}
      />

      {/* DM Modal */}
      <DMModal
        isOpen={isDMOpen}
        onClose={() => setIsDMOpen(false)}
        currentUserId={profile.id}
        currentUserRole={profile.role}
        recipientId={selectedRecipient.id}
        recipientUsername={selectedRecipient.username}
        recipientComaStatus={selectedRecipient.comaStatus}
        recipientIsVerified={selectedRecipient.isVerified}
        senderComaStatus={profile.coma_status}
        onSendMessage={handleSendMessage}
        onFourthWallBreak={handleFourthWallBreak}
        onVerifyUser={handleVerifyUser}
        onMakeAdmin={handleMakeAdmin}
        messages={[]}
      />
    </main>
  );
}
