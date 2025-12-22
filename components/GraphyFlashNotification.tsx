'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tagger {
  remembrance_id: string;
  remembrance_title: string;
  subject_name: string;
  creator: {
    id: string;
    username: string;
    nickname?: string;
    verified_name?: string;
    verified_at?: string;
    profile_picture?: string;
  };
}

interface GraphyFlashNotificationProps {
  userId: string;
  onClickTagger: (creatorId: string) => void;
}

export default function GraphyFlashNotification({
  userId,
  onClickTagger,
}: GraphyFlashNotificationProps) {
  const [taggers, setTaggers] = useState<Tagger[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch taggers
  useEffect(() => {
    async function fetchTaggers() {
      try {
        const response = await fetch(`/api/remembrance/tagged?user_id=${userId}`);
        const data = await response.json();
        if (data.taggers && data.taggers.length > 0) {
          setTaggers(data.taggers);
        }
      } catch (error) {
        console.error('Error fetching taggers:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchTaggers();
    }
  }, [userId]);

  // Rotate through taggers every 5 seconds
  useEffect(() => {
    if (taggers.length === 0) return;

    const interval = setInterval(() => {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 400); // Flash for 400ms
      setCurrentIndex((prev) => (prev + 1) % taggers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [taggers.length]);

  if (loading || taggers.length === 0) {
    return null;
  }

  const currentTagger = taggers[currentIndex];
  const displayName = currentTagger.creator.verified_name || 
                       currentTagger.creator.nickname || 
                       currentTagger.creator.username;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <button
          onClick={() => onClickTagger(currentTagger.creator.id)}
          className={`
            w-full px-6 py-4 rounded-xl
            bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10
            border-2 border-pink-400/30
            hover:border-pink-400/60 hover:from-pink-500/20 hover:via-purple-500/20 hover:to-pink-500/20
            transition-all duration-300
            cursor-pointer
            ${isFlashing ? 'animate-flash' : ''}
          `}
        >
          <div className="flex items-center justify-center gap-3">
            {/* Heart icon */}
            <motion.div
              animate={{ 
                scale: isFlashing ? [1, 1.3, 1] : 1,
              }}
              transition={{ duration: 0.4 }}
              className="text-2xl"
            >
              💖
            </motion.div>

            {/* Text content */}
            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-2">
                <span className="text-pink-300 font-medium">
                  @{currentTagger.creator.username}
                </span>
                <span className="text-gray-400 text-sm">
                  wrote a graphy about this wiki
                </span>
              </div>
              
              {/* Wiki title preview */}
              <div className="text-xs text-pink-400/60 mt-0.5 italic">
                "{currentTagger.remembrance_title}"
              </div>
            </div>

            {/* Counter badge if multiple taggers */}
            {taggers.length > 1 && (
              <div className="ml-auto flex items-center gap-1 text-xs text-pink-400/70">
                <span>{currentIndex + 1}</span>
                <span>/</span>
                <span>{taggers.length}</span>
              </div>
            )}
          </div>
        </button>

        {/* Add CSS for flash animation */}
        <style jsx>{`
          @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-flash {
            animation: flash 0.4s ease-in-out;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
