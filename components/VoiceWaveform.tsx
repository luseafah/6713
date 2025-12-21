'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface VoiceWaveformProps {
  audioUrl: string;
  duration?: string;
}

export default function VoiceWaveform({ audioUrl, duration }: VoiceWaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');

  useEffect(() => {
    if (!waveformRef.current) return;

    // Initialize WaveSurfer
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#ffffff40',
      progressColor: '#8b5cf6',
      cursorColor: '#a78bfa',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 40,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurfer.current.load(audioUrl);

    // Update time display
    wavesurfer.current.on('audioprocess', () => {
      if (wavesurfer.current) {
        const time = wavesurfer.current.getCurrentTime();
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        setCurrentTime(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    });

    wavesurfer.current.on('finish', () => {
      setIsPlaying(false);
      setCurrentTime('0:00');
    });

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!wavesurfer.current) return;
    
    if (isPlaying) {
      wavesurfer.current.pause();
    } else {
      wavesurfer.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3 min-w-[250px] max-w-[400px]">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        {isPlaying ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1">
        <div ref={waveformRef} className="w-full" />
      </div>

      {/* Duration */}
      <div className="text-xs text-white/60 font-mono flex-shrink-0 w-10 text-right">
        {currentTime}
      </div>
    </div>
  );
}
