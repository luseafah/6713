import GhostProfile from '@/components/GhostProfile';

// This would be dynamic based on route params
const GHOST_USER_ID = 'ghost-user-id';
const CURRENT_USER_ID = 'demo-user-id';
const SHRINE_MEDIA = 'https://example.com/shrine-video.mp4'; // Demo URL

export default function GhostPage() {
  return (
    <GhostProfile 
      ghostUserId={GHOST_USER_ID}
      shrineMedia={SHRINE_MEDIA}
      currentUserId={CURRENT_USER_ID}
    />
  );
}
