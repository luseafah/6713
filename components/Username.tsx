'use client';

interface UsernameProps {
  username: string;
  userId?: string;
  hasActiveGig?: boolean;
  className?: string;
  onGigClick?: (userId: string) => void;
}

/**
 * Username component with Yellow "+" indicator for users with active Gigs
 * Used across Wall, Hue, and Profile views for consistent Gig Priority signaling
 * Clicking the '+' navigates to the user's G$4U (Gigs For You) page
 */
export default function Username({ 
  username, 
  userId,
  hasActiveGig = false, 
  className = '',
  onGigClick
}: UsernameProps) {
  
  const handleGigClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers
    
    if (userId && onGigClick) {
      onGigClick(userId);
    } else if (userId) {
      // Default navigation to user's Gigs
      window.location.href = `/money?user=${userId}&tab=gigs`;
    }
  };
  
  return (
    <span className={className}>
      {username}
      {hasActiveGig && (
        <button
          onClick={handleGigClick}
          className="gig-active-indicator hover:scale-110 transition-transform inline-block cursor-pointer"
          title="G$4U - View active Gigs"
          aria-label="View user's active Gigs"
        >
          +
        </button>
      )}
    </span>
  );
}
