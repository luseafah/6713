'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Crop, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

/**
 * Alternative Red X Upload Button with built-in crop functionality
 * No external dependencies required (no react-image-crop)
 */

interface Elite6Video {
  id: string;
  video_url: string;
  thumbnail_url: string;
  quality_score: number;
  slot_number: number;
  creator_username: string;
}

interface RedXUploadButtonProps {
  isVerified: boolean;
  soundId?: string;
  onUploadComplete?: () => void;
}

export default function RedXUploadButtonNoDeps({ isVerified, soundId, onUploadComplete }: RedXUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'photo' | 'video' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showElite6Swap, setShowElite6Swap] = useState(false);
  const [elite6Videos, setElite6Videos] = useState<Elite6Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const MAX_VIDEO_DURATION = 15000;

  const handleButtonPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isVerified) return;

    e.preventDefault();
    const startTime = Date.now();

    const handleRelease = () => {
      const pressDuration = Date.now() - startTime;

      if (pressDuration < 200) {
        setMode('photo');
      } else {
        setMode('video');
      }

      setIsOpen(true);
      startCamera();

      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
    };

    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);
  }, [isVerified]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1080, height: 1920 },
        audio: mode === 'video'
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedMedia(file);
          setMediaPreview(URL.createObjectURL(file));
          stopCamera();
          setShowEditor(true);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
      setCapturedMedia(file);
      setMediaPreview(URL.createObjectURL(file));
      stopCamera();
      checkElite6Status();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / MAX_VIDEO_DURATION) * 100, 100);
      setRecordingProgress(progress);

      if (elapsed >= MAX_VIDEO_DURATION) {
        stopVideoRecording();
      } else {
        recordingTimerRef.current = setTimeout(updateProgress, 50);
      }
    };
    updateProgress();
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingProgress(0);
      
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const checkElite6Status = async () => {
    if (!soundId) return;

    try {
      const { data, error } = await supabase
        .from('elite_6_videos')
        .select('*')
        .eq('sound_id', soundId);

      if (error) throw error;

      if (data && data.length >= 6) {
        const videosWithUsernames = await Promise.all(
          data.map(async (video) => {
            const { data: userData } = await supabase
              .from('users')
              .select('username')
              .eq('id', video.creator_id)
              .single();

            return {
              ...video,
              creator_username: userData?.username || 'Unknown'
            };
          })
        );

        setElite6Videos(videosWithUsernames);
        setShowElite6Swap(true);
      } else {
        setShowEditor(true);
      }
    } catch (err) {
      console.error('Elite 6 check error:', err);
    }
  };

  const handleElite6Swap = async (videoToReplace: Elite6Video) => {
    if (!capturedMedia || !soundId) return;

    setLoading(true);
    try {
      const fileName = `${Date.now()}-${capturedMedia.name}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, capturedMedia);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      const { error: replaceError } = await supabase.rpc('replace_elite_6_video', {
        p_sound_id: soundId,
        p_old_video_id: videoToReplace.id,
        p_new_video_url: urlData.publicUrl,
        p_new_quality_score: 50
      });

      if (replaceError) throw replaceError;

      setShowElite6Swap(false);
      closeModal();
      onUploadComplete?.();
    } catch (err: any) {
      console.error('Elite 6 swap error:', err);
      setError(err.message || 'Failed to swap video');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!capturedMedia) return;

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}-${Date.now()}-${capturedMedia.name}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, capturedMedia);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      const messageType = mode === 'photo' ? 'picture' : 'voice';
      const { error: insertError } = await supabase
        .from('wall_messages')
        .insert({
          user_id: user.id,
          message_type: messageType,
          media_url: urlData.publicUrl,
          content: mode === 'photo' ? 'Anchor Post' : 'Video Post',
          post_type: mode === 'photo' ? 'wall' : 'story'
        });

      if (insertError) throw insertError;

      closeModal();
      onUploadComplete?.();
    } catch (err: any) {
      console.error('Post error:', err);
      setError(err.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setMode(null);
    setIsRecording(false);
    setRecordingProgress(0);
    setCapturedMedia(null);
    setMediaPreview(null);
    setShowEditor(false);
    setShowElite6Swap(false);
    stopCamera();
    
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
  };

  if (!isVerified) return null;

  return (
    <>
      <motion.button
        onMouseDown={handleButtonPress}
        onTouchStart={handleButtonPress}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative p-4 bg-gradient-to-r from-red-600 to-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all"
        aria-label="Upload Content"
      >
        <X size={32} strokeWidth={3} className="text-white" />
        
        {isRecording && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="calc(50% - 4px)"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${recordingProgress * 2.51327} 251.327`}
              className="transition-all duration-100"
            />
          </svg>
        )}

        {showElite6Swap && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black"
          >
            <motion.div
              initial={{ scaleY: 0, originY: 0.5 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full w-full flex flex-col"
            >
              {!capturedMedia && (
                <div className="relative flex-1 bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
                    <button
                      onClick={closeModal}
                      className="p-4 bg-white/10 backdrop-blur-md rounded-full"
                    >
                      <X size={24} className="text-white" />
                    </button>

                    {mode === 'photo' && (
                      <button
                        onClick={capturePhoto}
                        className="p-6 bg-white rounded-full shadow-lg"
                      >
                        <div className="w-12 h-12 rounded-full border-4 border-black" />
                      </button>
                    )}

                    {mode === 'video' && !isRecording && (
                      <button
                        onClick={startVideoRecording}
                        className="p-6 bg-red-600 rounded-full shadow-lg"
                      >
                        <div className="w-12 h-12" />
                      </button>
                    )}

                    {mode === 'video' && isRecording && (
                      <button
                        onClick={stopVideoRecording}
                        className="p-6 bg-red-600 rounded-full shadow-lg"
                      >
                        <div className="w-12 h-12 bg-white rounded-sm" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {showEditor && mediaPreview && (
                <div className="flex-1 flex flex-col bg-black">
                  <div className="flex-1 flex items-center justify-center p-4">
                    {mode === 'photo' ? (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <video
                        src={mediaPreview}
                        controls
                        className="max-w-full max-h-full"
                      />
                    )}
                  </div>

                  <div className="p-4 flex justify-center gap-4">
                    <button
                      onClick={handlePost}
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 rounded-full text-white font-bold disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? 'Posting...' : 'Post'}
                      <Check size={20} />
                    </button>
                  </div>
                </div>
              )}

              {showElite6Swap && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col p-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-2">Elite 6 Full</h2>
                  <p className="text-white/60 mb-6">Tap a video to replace it</p>

                  <div className="grid grid-cols-2 gap-4 flex-1 overflow-auto">
                    {elite6Videos.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => handleElite6Swap(video)}
                        disabled={loading}
                        className="relative aspect-[9/16] rounded-xl overflow-hidden border-2 border-white/20 hover:border-red-500 transition-colors"
                      >
                        <video
                          src={video.video_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <p className="text-white text-sm font-medium">@{video.creator_username}</p>
                          <p className="text-white/60 text-xs">Slot {video.slot_number}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowElite6Swap(false)}
                    className="mt-4 px-6 py-3 bg-white/10 rounded-full text-white"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}

              {error && (
                <div className="absolute top-4 left-4 right-4 p-4 bg-red-500/90 backdrop-blur-md rounded-xl text-white">
                  {error}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
