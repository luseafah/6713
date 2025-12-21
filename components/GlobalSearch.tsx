'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, X, User, Image, Video, Mic } from 'lucide-react';
import { debounce } from 'lodash';
import VerifiedName from './VerifiedName';
import { SearchResultSkeleton } from './Skeletons';

type SearchTab = 'all' | 'users' | 'gigs' | 'pics' | 'videos' | 'audio';

interface SearchResult {
  id: string;
  type: 'user' | 'gig' | 'pic' | 'video' | 'audio';
  title: string;
  subtitle: string;
  imageUrl?: string;
  verified_name?: string;
  username?: string;
  data: any;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (searchQuery: string, tab: SearchTab) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const searchResults: SearchResult[] = [];

      try {
        // Search Users (by @username or Verified Name)
        if (tab === 'all' || tab === 'users') {
          const { data: users } = await supabase
            .from('profiles')
            .select('id, username, verified_name, display_name, profile_photo_url')
            .or(
              `username.ilike.%${searchQuery}%,verified_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`
            )
            .eq('verification_status', 'verified')
            .limit(10);

          if (users) {
            searchResults.push(
              ...users.map((u) => ({
                id: u.id,
                type: 'user' as const,
                title: u.verified_name || u.display_name,
                subtitle: `@${u.username}`,
                imageUrl: u.profile_photo_url,
                verified_name: u.verified_name,
                username: u.username,
                data: u,
              }))
            );
          }
        }

        // Search Gigs
        if (tab === 'all' || tab === 'gigs') {
          const { data: gigs } = await supabase
            .from('gigs')
            .select(
              `
              id,
              title,
              description,
              budget,
              profiles!gigs_user_id_fkey(username, verified_name)
            `
            )
            .ilike('title', `%${searchQuery}%`)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(10);

          if (gigs) {
            searchResults.push(
              ...gigs.map((g: any) => ({
                id: g.id,
                type: 'gig' as const,
                title: g.title,
                subtitle: `Budget: ${g.budget}T · @${g.profiles?.username}`,
                data: g,
              }))
            );
          }
        }

        // Search Photos
        if (tab === 'all' || tab === 'pics') {
          const { data: pics } = await supabase
            .from('messages')
            .select(
              `
              id,
              content,
              media_url,
              profiles!messages_user_id_fkey(username, verified_name)
            `
            )
            .eq('message_type', 'image')
            .ilike('content', `%${searchQuery}%`)
            .not('media_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);

          if (pics) {
            searchResults.push(
              ...pics.map((p: any) => ({
                id: p.id,
                type: 'pic' as const,
                title: p.content || 'Photo',
                subtitle: `@${p.profiles?.username}`,
                imageUrl: p.media_url,
                data: p,
              }))
            );
          }
        }

        // Search Videos
        if (tab === 'all' || tab === 'videos') {
          const { data: videos } = await supabase
            .from('messages')
            .select(
              `
              id,
              content,
              media_url,
              profiles!messages_user_id_fkey(username, verified_name)
            `
            )
            .eq('message_type', 'video')
            .ilike('content', `%${searchQuery}%`)
            .not('media_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);

          if (videos) {
            searchResults.push(
              ...videos.map((v: any) => ({
                id: v.id,
                type: 'video' as const,
                title: v.content || 'Video',
                subtitle: `@${v.profiles?.username}`,
                imageUrl: v.media_url,
                data: v,
              }))
            );
          }
        }

        // Search Audio/Voice
        if (tab === 'all' || tab === 'audio') {
          const { data: audio } = await supabase
            .from('messages')
            .select(
              `
              id,
              content,
              media_url,
              profiles!messages_user_id_fkey(username, verified_name)
            `
            )
            .eq('message_type', 'voice')
            .not('media_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);

          if (audio) {
            searchResults.push(
              ...audio.map((a: any) => ({
                id: a.id,
                type: 'audio' as const,
                title: 'Voice Note',
                subtitle: `@${a.profiles?.username}`,
                data: a,
              }))
            );
          }
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (query.trim()) {
      performSearch(query, activeTab);
    } else {
      setResults([]);
    }
  }, [query, activeTab, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    // Navigate based on result type
    if (result.type === 'user') {
      window.location.href = `/profile/${result.data.username}`;
    } else if (result.type === 'gig') {
      window.location.href = `/gig/${result.id}`;
    } else {
      // For media, navigate to wall or search
      window.location.href = `/wall`;
    }
    setIsOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'pic':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const tabs: { id: SearchTab; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'users', label: 'Users', icon: User },
    { id: 'gigs', label: 'Gigs', icon: Search },
    { id: 'pics', label: 'Pics', icon: Image },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'audio', label: 'Audio', icon: Mic },
  ];

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
        title="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by @username or name..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-yellow-400 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SearchResultSkeleton key={i} />
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-3 hover:border-yellow-400 transition-colors text-left"
                  >
                    {/* Icon or Image */}
                    {result.imageUrl ? (
                      <img
                        src={result.imageUrl}
                        alt={result.title}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 flex-shrink-0">
                        {getTypeIcon(result.type)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {result.type === 'user' && result.verified_name && result.username ? (
                        <VerifiedName
                          verifiedName={result.verified_name}
                          username={result.username}
                          size="sm"
                          layout="stacked"
                        />
                      ) : (
                        <>
                          <p className="font-medium text-white truncate">{result.title}</p>
                          <p className="text-sm text-zinc-400 truncate">{result.subtitle}</p>
                        </>
                      )}
                    </div>

                    {/* Type Badge */}
                    <div className="flex-shrink-0 px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-400">
                      {result.type}
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No results found for &quot;{query}&quot;</p>
                <p className="text-sm text-zinc-600 mt-2">
                  Try searching by @username or verified name
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Start typing to search</p>
                <p className="text-sm text-zinc-600 mt-2">
                  Search for users, gigs, photos, videos, and audio
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
