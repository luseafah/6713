/**
 * Skeleton Loaders - Dark-themed shimmer components
 * Used while content (photos, videos, posts) is loading
 */

export function MessageSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 animate-pulse">
      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-zinc-800 rounded w-32" />
          <div className="h-3 bg-zinc-800 rounded w-24" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-full" />
        <div className="h-4 bg-zinc-800 rounded w-5/6" />
        <div className="h-4 bg-zinc-800 rounded w-4/6" />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-2">
        <div className="h-8 bg-zinc-800 rounded w-16" />
        <div className="h-8 bg-zinc-800 rounded w-16" />
        <div className="h-8 bg-zinc-800 rounded w-16" />
      </div>
    </div>
  );
}

export function MediaCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-pulse">
      {/* Media placeholder */}
      <div className="w-full aspect-square bg-zinc-800 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent shimmer" />
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800" />
          <div className="h-4 bg-zinc-800 rounded w-24" />
        </div>
        <div className="h-3 bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-800 rounded w-3/4" />
      </div>
    </div>
  );
}

export function GigCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-zinc-800 rounded w-3/4" />
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
        </div>
        <div className="w-16 h-8 bg-zinc-800 rounded" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-800 rounded w-5/6" />
      </div>

      {/* Meta */}
      <div className="flex gap-2">
        <div className="h-6 bg-zinc-800 rounded w-20" />
        <div className="h-6 bg-zinc-800 rounded w-24" />
        <div className="h-6 bg-zinc-800 rounded w-16" />
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile photo */}
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full bg-zinc-800" />
      </div>

      {/* Names */}
      <div className="space-y-2 text-center">
        <div className="h-6 bg-zinc-800 rounded w-48 mx-auto" />
        <div className="h-4 bg-zinc-800 rounded w-32 mx-auto" />
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6">
        <div className="space-y-1">
          <div className="h-6 bg-zinc-800 rounded w-12 mx-auto" />
          <div className="h-3 bg-zinc-800 rounded w-16" />
        </div>
        <div className="space-y-1">
          <div className="h-6 bg-zinc-800 rounded w-12 mx-auto" />
          <div className="h-3 bg-zinc-800 rounded w-16" />
        </div>
        <div className="space-y-1">
          <div className="h-6 bg-zinc-800 rounded w-12 mx-auto" />
          <div className="h-3 bg-zinc-800 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function StoryCircleSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-zinc-800" />
      <div className="h-3 bg-zinc-800 rounded w-12" />
    </div>
  );
}

export function LiveVideoCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-pulse">
      {/* Video placeholder */}
      <div className="w-full aspect-video bg-zinc-800 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent shimmer" />
        {/* Live badge placeholder */}
        <div className="absolute top-3 left-3 w-16 h-6 bg-zinc-700 rounded" />
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-800" />
          <div className="h-3 bg-zinc-800 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-24" />
        <div className="h-4 bg-zinc-800 rounded w-full" />
        <div className="h-4 bg-zinc-800 rounded w-4/5" />
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-40" />
        <div className="h-3 bg-zinc-800 rounded w-24" />
      </div>
      <div className="w-20 h-8 bg-zinc-800 rounded" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-zinc-800 rounded w-24" />
        <div className="w-5 h-5 bg-zinc-800 rounded" />
      </div>
      <div className="h-8 bg-zinc-800 rounded w-32" />
      <div className="h-3 bg-zinc-800 rounded w-full" />
    </div>
  );
}

/**
 * Generic skeleton component for flexible layouts
 */
export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  className = '',
}: {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-zinc-800 animate-pulse ${width} ${height} ${rounded} ${className}`}
    />
  );
}

/**
 * Feed skeleton - combines multiple message skeletons
 */
export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Grid skeleton - for media grids
 */
export function MediaGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}
