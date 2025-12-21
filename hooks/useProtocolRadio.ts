import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface RadioFrequency {
  id: string;
  media_url: string;
  verified_name: string;
  username: string;
  user_id: string;
  created_at: string;
}

/**
 * Protocol Radio Hook
 * Auto-cycles through 30-second voice notes from the community
 * "The Pulse" - Passive discovery through verified frequencies
 */
export function useProtocolRadio() {
  const [currentFrequency, setCurrentFrequency] = useState<RadioFrequency | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedIds = useRef<Set<string>>(new Set());

  /**
   * Fetch next random voice note
   * Excludes recently played frequencies to avoid repetition
   */
  const playNextFrequency = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      // Fetch random voice note that hasn't expired
      const { data, error } = await supabase
        .from('wall_messages')
        .select(`
          id,
          media_url,
          user_id,
          username,
          created_at,
          profiles!wall_messages_user_id_fkey (
            verified_name
          )
        `)
        .eq('message_type', 'voice')
        .not('media_url', 'is', null)
        .gt('expires_at', new Date().toISOString())
        .order('random()')
        .limit(10); // Get 10 and filter client-side

      if (error) throw error;

      if (data && data.length > 0) {
        // Filter out recently played
        const unplayedFrequencies = data.filter(
          freq => !playedIds.current.has(freq.id)
        );

        const nextFrequency = unplayedFrequencies.length > 0 
          ? unplayedFrequencies[0] 
          : data[0]; // If all played, reset and use first

        // Track played IDs (keep last 50)
        playedIds.current.add(nextFrequency.id);
        if (playedIds.current.size > 50) {
          const firstId = Array.from(playedIds.current)[0];
          playedIds.current.delete(firstId);
        }

        setCurrentFrequency({
          id: nextFrequency.id,
          media_url: nextFrequency.media_url,
          verified_name: nextFrequency.profiles?.verified_name || nextFrequency.username,
          username: nextFrequency.username,
          user_id: nextFrequency.user_id,
          created_at: nextFrequency.created_at,
        });
      }
    } catch (error) {
      console.error('Failed to fetch next frequency:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Play audio and handle auto-advance
   */
  useEffect(() => {
    if (!currentFrequency || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = currentFrequency.media_url;
    audio.muted = isMuted;

    // Play audio
    if (!isMuted) {
      audio.play().catch(err => {
        console.log('Autoplay blocked:', err);
      });
      setIsPlaying(true);
    }

    // Auto-advance when audio ends
    const handleEnded = () => {
      setIsPlaying(false);
      playNextFrequency();
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentFrequency, isMuted]);

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  /**
   * Manual skip to next frequency
   */
  const skipFrequency = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    playNextFrequency();
  };

  /**
   * Initialize audio element
   */
  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    currentFrequency,
    isPlaying,
    isMuted,
    loading,
    playNextFrequency,
    toggleMute,
    skipFrequency,
  };
}
