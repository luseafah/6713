'use client';

import { useState } from 'react';
import { X, Image, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';import { validateMediaFile, MEDIA_CONSTRAINTS, formatFileSize } from '@/lib/mediaConstraints';
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [postType, setPostType] = useState<'wall' | 'story'>('wall');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setError('Validating...');
    
    // Determine media type
    const isVideo = selectedFile.type.startsWith('video/');
    const isImage = selectedFile.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      setError('Please select a valid image or video file');
      return;
    }
    
    // Validate media constraints
    const mediaType = isVideo ? 'video' : 'image';
    const validation = await validateMediaFile(selectedFile, mediaType);
    
    if (!validation.valid) {
      setError(validation.error || 'File validation failed');
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate story requirements
      if (postType === 'story' && !file) {
        setError('Stories require an image or video');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch username
      const { data: userData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      let mediaUrl = null;
      let messageType: 'text' | 'picture' | 'voice' = 'text';

      // Upload file if present
      if (file) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        mediaUrl = urlData.publicUrl;
        messageType = file.type.startsWith('video/') ? 'voice' : 'picture'; // Using 'voice' for video per schema
      }

      // Calculate expiration for stories (24 hours from now)
      const expiresAt = postType === 'story' 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Insert into wall_messages
      const { error: insertError } = await supabase
        .from('wall_messages')
        .insert({
          user_id: user.id,
          username: userData?.username || 'Anonymous',
          content: content || (mediaUrl ? 'Shared media' : ''),
          message_type: messageType,
          media_url: mediaUrl,
          post_type: postType,
          expires_at: expiresAt
        });

      if (insertError) throw insertError;

      // Success - close modal and reset
      setContent('');
      setFile(null);
      setPostType('wall');
      onClose();
      
      // Refresh the page to show new post
      window.location.reload();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-black border border-white/20 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upload to Wall</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Type Toggle */}
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
              Post Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPostType('wall')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  postType === 'wall'
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Wall (Permanent)
              </button>
              <button
                type="button"
                onClick={() => setPostType('story')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  postType === 'story'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Story (24h)
              </button>
            </div>
            {postType === 'story' && (
              <p className="text-xs text-purple-400 mt-2">
                Stories require media and disappear after 24 hours
              </p>
            )}
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
              Message
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
              placeholder="What's on your mind?"
              rows={4}
            />
          </div>

          {/* File Input */}
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
              Media {postType === 'story' ? '(required)' : '(optional)'}
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={loading}
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <Image size={20} />
                <Video size={20} />
                <span>{file ? `${file.name} (${formatFileSize(file.size)})` : 'Choose image or video'}</span>
              </label>
            </div>
            <div className="mt-2 space-y-1">
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove file
                </button>
              )}
              <div className="text-xs text-white/40">
                <p>• Videos: Max {MEDIA_CONSTRAINTS.VIDEO_MAX_DURATION}s • Files: Max {MEDIA_CONSTRAINTS.MAX_FILE_SIZE_MB}MB</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!content.trim() && !file)}
            className="w-full bg-white text-black font-bold uppercase text-sm py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Uploading...' : 'Post to Wall'}
          </button>
        </form>
      </div>
    </div>
  );
}
