'use client';

import { useState, useRef, useEffect } from 'react';
import { MEDIA_CONSTRAINTS } from '@/lib/mediaConstraints';

interface UseVoiceRecorderResult {
  isRecording: boolean;
  duration: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
  maxDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  resetRecording: () => void;
  uploadVoiceMessage: (blob: Blob) => Promise<string>;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDuration = MEDIA_CONSTRAINTS.VOICE_MAX_DURATION;

  const startRecording = async () => {
    try {
      // Request microphone permission with proper error handling
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      // Start duration timer with auto-stop at 15s
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          
          return newDuration;
        });
      }, 1000);
      
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      
      // Provide user-friendly error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone access denied. Please allow microphone permissions in your browser settings to record voice messages.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        alert('Microphone is being used by another application. Please close other apps using the microphone and try again.');
      } else {
        alert('Failed to access microphone. Please check your browser permissions and try again.');
      }
    }
  };

  const stopRecording = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setDuration(0);
      setAudioUrl(null);
      setAudioBlob(null);
      chunksRef.current = [];
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    setDuration(0);
    setAudioUrl(null);
    setAudioBlob(null);
    chunksRef.current = [];
  };

  const uploadVoiceMessage = async (blob: Blob): Promise<string> => {
    const { supabase } = await import('@/lib/supabase');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `voice/${user.id}-${timestamp}-${random}.webm`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, blob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return {
    isRecording,
    duration,
    audioUrl,
    audioBlob,
    maxDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
    uploadVoiceMessage
  };
}
