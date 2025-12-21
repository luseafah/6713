'use client';

/**
 * Two-Name Protocol Component
 * Displays both Verified Name (real identity) and @username (handle)
 * 
 * Used in Search/Radio for authority
 * Used in Wall/Hue for identity
 */

interface VerifiedNameProps {
  verifiedName?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'stacked' | 'inline';
  showUsername?: boolean;
}

export function VerifiedName({
  verifiedName,
  username,
  size = 'md',
  layout = 'stacked',
  showUsername = true,
}: VerifiedNameProps) {
  const sizeClasses = {
    sm: {
      verified: 'text-sm',
      username: 'text-xs',
    },
    md: {
      verified: 'text-base',
      username: 'text-sm',
    },
    lg: {
      verified: 'text-xl',
      username: 'text-base',
    },
  };

  const displayName = verifiedName || username;

  if (layout === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-white font-medium ${sizeClasses[size].verified}`}>
          {displayName}
        </span>
        {showUsername && verifiedName && (
          <span className={`text-white/40 ${sizeClasses[size].username}`}>
            @{username}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className={`text-white font-medium ${sizeClasses[size].verified}`}>
        {displayName}
      </div>
      {showUsername && verifiedName && (
        <div className={`text-white/40 ${sizeClasses[size].username}`}>
          @{username}
        </div>
      )}
    </div>
  );
}
