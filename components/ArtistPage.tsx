'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Music, ExternalLink, Play, Pause, Heart, Pin, Eye, MessageCircle } from 'lucide-react';
import { useQTBlimp } from '@/hooks/useQTBlimp';

interface ArtistPageProps {
  artistId: string;
  isOwnProfile?: boolean;
  isStrangerView?: boolean;
}

interface SoundSnippet {
  id: string;
  title: string;
  audio_url: string;
  duration_seconds: number;
  external_link: string | null;
  play_count: number;
  sort_order: number;
}

interface FeaturedVideo {
  id: string;
  media_url: string;
  content: string;
  like_count: number;
}

export default function ArtistPage({
  artistId,
  isOwnProfile = false,
  isStrangerView = false,
}: ArtistPageProps) {
  const [artist, setArtist] = useState<any>(null);
  const [sounds, setSounds] = useState<SoundSnippet[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>([]);
  const [anchorPost, setAnchorPost] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'wiki' | 'gigs' | 'bank'>('wiki');
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const supabase = createClient();

  const { qtMinutes, startTracking, stopTracking } = useQTBlimp(artistId);

  useEffect(() => {
    if (!isStrangerView) {
      startTracking();
      return () => stopTracking();
    }
  }, [artistId, isStrangerView]);

  useEffect(() => {
    fetchArtistData();
  }, [artistId]);

  const fetchArtistData = async () => {
    // Fetch artist profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', artistId)
      .single();

    setArtist(profile);

    // Fetch sound snippets
    const { data: soundData } = await supabase
      .from('sound_snippets')
      .select('*')
      .eq('artist_id', artistId)
      .order('sort_order');

    setSounds(soundData || []);

    // Fetch featured videos
    if (profile?.featured_videos && profile.featured_videos.length > 0) {
      const { data: videos } = await supabase
        .from('messages')
        .select('id, media_url, content')
        .in('id', profile.featured_videos);

      setFeaturedVideos(videos || []);
    }

    // Fetch anchor post
    const { data: anchor } = await supabase
      .from('anchor_posts')
      .select('*, sound_snippets(*)')
      .eq('user_id', artistId)
      .single();

    setAnchorPost(anchor);
  };

  const toggleSoundPlay = (soundId: string) => {
    if (playingSound === soundId) {
      setPlayingSound(null);
    } else {
      setPlayingSound(soundId);
    }
  };

  if (!artist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ZONE 1: IDENTITY HEADER */}
      <div className="border-b border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          {/* Avatar & Names */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden">
              {artist.profile_photo_url ? (
                <img
                  src={artist.profile_photo_url}
                  alt={artist.verified_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Music className="w-8 h-8" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold">{artist.verified_name}</h1>
              <p className="text-zinc-400">@{artist.username}</p>
              {artist.is_artist && (
                <span className="inline-block mt-1 px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">
                  Artist
                </span>
              )}
            </div>
          </div>

          {/* QT Blimp */}
          {!isOwnProfile && !isStrangerView && (
            <div className="flex flex-col items-end">
              <div className="text-3xl font-bold text-yellow-400">{qtMinutes}m</div>
              <div className="text-xs text-zinc-500">Quality Time</div>
            </div>
          )}
        </div>

        {/* Bio */}
        {artist.artist_bio && (
          <p className="text-zinc-300 text-sm leading-relaxed">{artist.artist_bio}</p>
        )}

        {/* COMA Status */}
        {artist.user_state === 'coma' && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <p className="text-purple-300 text-sm">This artist is in COMA state (view-only)</p>
          </div>
        )}
      </div>

      {/* ZONE 2: FEATURED GRID (3 PINNED VIDEOS) */}
      {featuredVideos.length > 0 && (
        <div className="border-b border-zinc-800 p-6">
          <h2 className="text-sm font-bold text-zinc-400 uppercase mb-4 flex items-center gap-2">
            <Pin className="w-4 h-4" />
            Featured
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {featuredVideos.map((video) => (
              <button
                key={video.id}
                onClick={() => !isStrangerView && (window.location.href = `/post/${video.id}`)}
                className={`aspect-square bg-zinc-900 rounded-lg overflow-hidden ${
                  isStrangerView ? 'cursor-default' : 'hover:ring-2 hover:ring-yellow-400'
                } transition-all`}
              >
                <video
                  src={video.media_url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
              </button>
            ))}
            {/* Empty slots */}
            {Array.from({ length: 3 - featuredVideos.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square bg-zinc-900 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-800"
              >
                <Pin className="w-6 h-6 text-zinc-700" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ZONE 3: SOUND LIBRARY (3 WAVEFORMS) */}
      {sounds.length > 0 && (
        <div className="border-b border-zinc-800 p-6">
          <h2 className="text-sm font-bold text-zinc-400 uppercase mb-4 flex items-center gap-2">
            <Music className="w-4 h-4" />
            Sound Library
          </h2>
          <div className="space-y-3">
            {sounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() =>
                  !isStrangerView && (window.location.href = `/sound/${sound.id}`)
                }
                className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4 ${
                  isStrangerView ? 'cursor-default' : 'hover:border-yellow-400'
                } transition-colors`}
              >
                {/* Waveform Visual */}
                <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center">
                  <Music className="w-6 h-6 text-yellow-400" />
                </div>

                {/* Sound Info */}
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-white">{sound.title}</h3>
                  <p className="text-sm text-zinc-400">{sound.duration_seconds}s</p>
                  <p className="text-xs text-zinc-600">{sound.play_count} plays</p>
                </div>

                {/* External Link */}
                {sound.external_link && (
                  <ExternalLink className="w-5 h-5 text-zinc-500" />
                )}

                {/* Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isStrangerView) toggleSoundPlay(sound.id);
                  }}
                  className={`p-2 rounded-lg ${
                    isStrangerView ? 'bg-zinc-800' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  disabled={isStrangerView}
                >
                  {playingSound === sound.id ? (
                    <Pause className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Play className="w-5 h-5 text-yellow-400" />
                  )}
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ZONE 4: RECORDS (TABS) */}
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-zinc-800 mb-6">
          <button
            onClick={() => !isStrangerView && setActiveTab('wiki')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'wiki'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-zinc-500 hover:text-zinc-300'
            } ${isStrangerView && 'cursor-default'}`}
            disabled={isStrangerView}
          >
            Wiki
          </button>
          <button
            onClick={() => !isStrangerView && setActiveTab('gigs')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'gigs'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-zinc-500 hover:text-zinc-300'
            } ${isStrangerView && 'cursor-default'}`}
            disabled={isStrangerView}
          >
            Gigs
          </button>
          <button
            onClick={() => !isStrangerView && setActiveTab('bank')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'bank'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-zinc-500 hover:text-zinc-300'
            } ${isStrangerView && 'cursor-default'}`}
            disabled={isStrangerView}
          >
            Bank
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'wiki' && (
          <div className="space-y-4">
            {anchorPost && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="aspect-square">
                  <img
                    src={anchorPost.photo_url}
                    alt="Anchor Post"
                    className="w-full h-full object-cover"
                  />
                </div>
                {anchorPost.caption && (
                  <div className="p-4">
                    <p className="text-zinc-300">{anchorPost.caption}</p>
                  </div>
                )}
              </div>
            )}
            <p className="text-zinc-500 text-sm">Factual history and bio details...</p>
          </div>
        )}

        {activeTab === 'gigs' && (
          <div className="text-zinc-500 text-sm">Friendship resumes and collaborations...</div>
        )}

        {activeTab === 'bank' && (
          <div className="text-zinc-500 text-sm">Linked to $$$4U signals...</div>
        )}
      </div>

      {/* Stranger View Indicator */}
      {isStrangerView && (
        <div className="fixed bottom-4 right-4 bg-purple-500/20 border border-purple-500 rounded-lg px-4 py-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300">Stranger View (Preview Only)</span>
        </div>
      )}
    </div>
  );
}
