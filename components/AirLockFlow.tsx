'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, CheckCircle, Loader2, Camera, User, Phone, Mail, AtSign } from 'lucide-react';
import TermsOfFrequency from './TermsOfFrequency';

type AirLockPhase = 'terms' | 'identity' | 'photo' | 'verification_pending' | 'talent_purchase' | 'complete';

interface IdentityFormData {
  email: string;
  verifiedName: string;
  displayName: string;
  username: string;
  phone: string;
}

/**
 * 6713 Protocol: The Air-Lock
 * 
 * Multi-phase authentication system:
 * 1. Terms of Frequency acceptance
 * 2. Identity data collection
 * 3. Profile photo upload
 * 4. Manual verification (Pope AI review)
 * 5. Talent purchase (optional)
 * 6. Protocol entry
 */
export default function AirLockFlow() {
  const [phase, setPhase] = useState<AirLockPhase>('terms');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identity form state
  const [identityData, setIdentityData] = useState<IdentityFormData>({
    email: '',
    verifiedName: '',
    displayName: '',
    username: '',
    phone: '',
  });

  // Photo upload state
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  // ===== PHASE 1: TERMS OF FREQUENCY =====
  const handleAcceptTerms = () => {
    setPhase('identity');
  };

  const handleDeclineTerms = () => {
    window.location.href = 'https://google.com'; // Exit protocol
  };

  // ===== PHASE 2: IDENTITY FORM =====
  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: identityData.email,
        password: Math.random().toString(36) + Date.now().toString(36), // Temporary password
        options: {
          data: {
            verified_name: identityData.verifiedName,
            display_name: identityData.displayName,
            username: identityData.username,
            phone: identityData.phone,
          },
        },
      });

      if (authError) throw authError;

      // Create profile record
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user?.id,
        username: identityData.username,
        verified_name: identityData.verifiedName,
        display_name: identityData.displayName,
        phone: identityData.phone,
        verification_status: 'pending',
      });

      if (profileError) throw profileError;

      // Add to verification queue
      await supabase.from('verification_queue').insert({
        user_id: authData.user?.id,
      });

      setPhase('photo');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // ===== PHASE 3: PHOTO UPLOAD =====
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('Photo must be under 50MB');
      return;
    }

    setProfilePhotoFile(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!profilePhotoFile) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to Supabase Storage
      const fileExt = profilePhotoFile.name.split('.').pop();
      const filePath = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, profilePhotoFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Update profile with photo URL
      await supabase.from('profiles').update({
        profile_photo_url: publicUrl,
        verification_status: 'photo_uploaded',
      }).eq('id', user.id);

      // Update verification queue
      await supabase.from('verification_queue').update({
        profile_photo_url: publicUrl,
      }).eq('user_id', user.id);

      setPhase('verification_pending');
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  // ===== PHASE 4: VERIFICATION PENDING =====
  const skipTalentPurchase = () => {
    setPhase('complete');
    // Reload app to trigger AuthGatekeeper
    window.location.reload();
  };

  // ===== RENDER PHASES =====
  if (phase === 'terms') {
    return <TermsOfFrequency onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm">
            {['Identity', 'Photo', 'Verification', 'Entry'].map((label, idx) => {
              const isActive = ['identity', 'photo', 'verification_pending', 'complete'][idx] === phase;
              const isComplete = ['identity', 'photo', 'verification_pending'].indexOf(phase) > idx;
              
              return (
                <div key={label} className="flex items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold
                      ${isComplete ? 'bg-green-500 text-black' : isActive ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-white/40'}
                    `}
                  >
                    {isComplete ? <CheckCircle size={20} /> : idx + 1}
                  </div>
                  <span className={`ml-2 ${isActive ? 'text-yellow-500' : 'text-white/40'}`}>{label}</span>
                  {idx < 3 && <div className="w-12 h-0.5 bg-white/10 mx-3" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase Content */}
        <div className="bg-zinc-900 rounded-2xl border border-yellow-500/30 p-8 shadow-2xl">
          {/* PHASE 2: IDENTITY FORM */}
          {phase === 'identity' && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-yellow-500 mb-2">The Air-Lock: Identity</h1>
                <p className="text-white/60">Your names are your protocol signature</p>
              </div>

              <form onSubmit={handleIdentitySubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-white mb-2">
                    <Mail size={18} className="text-yellow-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={identityData.email}
                    onChange={(e) => setIdentityData({ ...identityData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Verified Name */}
                <div>
                  <label className="flex items-center gap-2 text-white mb-2">
                    <User size={18} className="text-yellow-500" />
                    Verified Name (Legal/Real Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={identityData.verifiedName}
                    onChange={(e) => setIdentityData({ ...identityData, verifiedName: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="John Smith"
                  />
                  <p className="text-white/40 text-xs mt-1">Used for Radio discovery and Gig authority</p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="flex items-center gap-2 text-white mb-2">
                    <User size={18} className="text-yellow-500" />
                    Display Name (How you appear on Wall)
                  </label>
                  <input
                    type="text"
                    required
                    value={identityData.displayName}
                    onChange={(e) => setIdentityData({ ...identityData, displayName: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="Johnny"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="flex items-center gap-2 text-white mb-2">
                    <AtSign size={18} className="text-yellow-500" />
                    Unique @Username
                  </label>
                  <input
                    type="text"
                    required
                    value={identityData.username}
                    onChange={(e) => setIdentityData({ ...identityData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-yellow-500 focus:outline-none font-mono"
                    placeholder="jsmith"
                  />
                  <p className="text-white/40 text-xs mt-1">Your permanent identifier for "Ask @user" logic</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-white mb-2">
                    <Phone size={18} className="text-yellow-500" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={identityData.phone}
                    onChange={(e) => setIdentityData({ ...identityData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-white/40 text-xs mt-1">For 2FA and Gig protocol verification</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Creating Protocol Identity...
                    </>
                  ) : (
                    'Continue to Photo Upload'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* PHASE 3: PHOTO UPLOAD */}
          {phase === 'photo' && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-yellow-500 mb-2">Visual ID: Profile Photo</h1>
                <p className="text-white/60">Must be a clear headshot for Radio discovery</p>
              </div>

              <div className="space-y-6">
                {/* Photo Preview */}
                <div className="flex justify-center">
                  <div className="relative w-48 h-48 rounded-full border-4 border-yellow-500 overflow-hidden bg-zinc-800 flex items-center justify-center">
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={64} className="text-white/40" />
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <label className="block w-full px-6 py-4 bg-zinc-800 hover:bg-zinc-700 border-2 border-dashed border-yellow-500/50 rounded-lg text-white font-medium text-center cursor-pointer transition-colors">
                  <Upload size={20} className="inline-block mr-2" />
                  {profilePhotoFile ? 'Change Photo' : 'Select Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>

                {profilePhotoFile && (
                  <p className="text-center text-green-500 text-sm">
                    <CheckCircle size={16} className="inline-block mr-1" />
                    {profilePhotoFile.name}
                  </p>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-500 text-sm">
                  <strong>Photo Requirements:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Clear, front-facing headshot</li>
                    <li>Maximum file size: 50MB</li>
                    <li>No sunglasses or face coverings</li>
                    <li>Good lighting and focus</li>
                  </ul>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePhotoUpload}
                  disabled={!profilePhotoFile || loading}
                  className="w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Submit for Verification
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PHASE 4: VERIFICATION PENDING */}
          {phase === 'verification_pending' && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 size={48} className="text-yellow-500 animate-spin" />
              </div>
              
              <h1 className="text-3xl font-bold text-yellow-500 mb-4">Manual Frequency Check</h1>
              <p className="text-white/80 text-lg mb-6">
                Pope AI is verifying your image
              </p>
              <p className="text-white/60 max-w-md mx-auto">
                The 6713 Protocol requires a clear face for the Radio discovery tab and G$4U economy.
                You'll receive a notification once verified (usually within 24 hours).
              </p>

              <div className="mt-12 pt-8 border-t border-white/10">
                <p className="text-white/60 mb-4">While you wait, you can purchase your first Talents</p>
                <button
                  onClick={() => setPhase('talent_purchase')}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors mr-3"
                >
                  Get Talents ($1.50 = 100T)
                </button>
                <button
                  onClick={skipTalentPurchase}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
