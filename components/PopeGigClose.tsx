'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Upload, Mic, Check } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

/**
 * Pope AI Gig-Close Modal
 * 
 * Triggered when a Gig is marked "Completed"
 * Requirements:
 * 1. Each participant submits a 3-second voice note (one word)
 * 2. One person uploads a Group Photo (max 50MB)
 * 
 * Once complete, Gig becomes un-deletable and expires in 3 days
 */

interface PopeGigCloseProps {
  gigId: string;
  gigTitle: string;
  participants: Array<{
    user_id: string;
    username: string;
    verified_name?: string;
  }>;
  onClose: () => void;
  onComplete: () => void;
}

interface CompletionStatus {
  total_participants: number;
  voice_submissions: number;
  has_group_photo: boolean;
  requirements_met: boolean;
  missing_voices: number;
}

export function PopeGigClose({
  gigId,
  gigTitle,
  participants,
  onClose,
  onComplete,
}: PopeGigCloseProps) {
  const [status, setStatus] = useState<CompletionStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userHasSubmittedVoice, setUserHasSubmittedVoice] = useState(false);

  const {
    isRecording,
    audioBlob,
    duration,
    maxDuration,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder({ maxDuration: 3 }); // 3-second max

  // Get current user
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    }
    getCurrentUser();
  }, []);

  // Fetch completion status
  const fetchStatus = async () => {
    const { data, error } = await supabase.rpc('check_gig_completion_requirements', {
      gig_uuid: gigId,
    });

    if (data && !error) {
      setStatus(data);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [gigId]);

  // Submit voice note
  const submitVoice = async () => {
    if (!audioBlob || !currentUserId) return;

    setUploading(true);

    try {
      // Upload to storage
      const fileName = `gig-${gigId}-${currentUserId}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voices')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voices')
        .getPublicUrl(fileName);

      // Submit to database
      const { data, error } = await supabase.rpc('submit_gig_voice', {
        gig_uuid: gigId,
        voice_url: publicUrl,
      });

      if (error) throw error;

      if (data?.success) {
        setUserHasSubmittedVoice(true);
        resetRecording();
        fetchStatus();
      }
    } catch (error) {
      console.error('Failed to submit voice:', error);
      alert('Failed to submit voice note. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Upload group photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('Photo must be under 50MB');
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const fileName = `gig-${gigId}-group-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gig-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gig-photos')
        .getPublicUrl(fileName);

      // Insert into database
      const { error: insertError } = await supabase
        .from('gig_group_photos')
        .insert({
          gig_id: gigId,
          uploaded_by: currentUserId,
          photo_url: publicUrl,
        });

      if (insertError) throw insertError;

      fetchStatus();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Close modal when requirements met
  useEffect(() => {
    if (status?.requirements_met) {
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-white/10 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Pope AI Gig-Close</h2>
            <p className="text-white/40 text-sm">Verify "{gigTitle}"</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Protocol Notice */}
          <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-4">
            <h3 className="text-[#FFD700] font-bold mb-2">G$4U PROTOCOL NOTICE</h3>
            <p className="text-white/80 text-sm">
              Every participant must submit a 3-second voice note (one word).
              One person must upload a Group Photo (max 50MB).
              This Gig becomes un-deletable and expires in 3 days as verified record.
            </p>
          </div>

          {/* Status */}
          {status && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Voice Notes</span>
                <span className="text-white font-medium">
                  {status.voice_submissions}/{status.total_participants}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Group Photo</span>
                <span className={status.has_group_photo ? 'text-green-500' : 'text-white/40'}>
                  {status.has_group_photo ? '✓ Uploaded' : 'Pending'}
                </span>
              </div>
            </div>
          )}

          {/* Voice Recording */}
          {!userHasSubmittedVoice && (
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h4 className="text-white font-medium">Submit Your Voice</h4>
              <p className="text-white/60 text-sm">Record one word (3 seconds max)</p>

              {!audioBlob ? (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={uploading}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  {isRecording ? `Recording... ${duration}s` : 'Start Recording'}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={submitVoice}
                    disabled={uploading}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Submit Voice'}
                  </button>
                  <button
                    onClick={resetRecording}
                    className="w-full py-2 text-white/60 hover:text-white text-sm transition-colors"
                  >
                    Re-record
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Photo Upload */}
          {!status?.has_group_photo && (
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h4 className="text-white font-medium">Group Photo</h4>
              <p className="text-white/60 text-sm">One person must upload (max 50MB)</p>

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="w-full py-3 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </div>
              </label>
            </div>
          )}

          {/* Completion */}
          {status?.requirements_met && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <Check className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-green-500 font-medium">Gig Verified!</p>
                <p className="text-white/60 text-sm">This record expires in 3 days</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
