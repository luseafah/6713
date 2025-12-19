'use client';

import { useState } from 'react';
import NavBar from '@/components/NavBar';

export default function Home() {
  // Mock profile data - in a real app, this would come from auth/API
  const [profile] = useState({
    is_verified: true, // Toggle this to test the upload button visibility
  });

  return (
    <main className="min-h-screen bg-black">
      <NavBar isVerified={profile.is_verified} />
      
      {/* Content area with padding to account for fixed navbar */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mt-20">
            <h1 className="text-4xl font-bold text-white mb-4">Welcome to 6713</h1>
            <p className="text-white/60 text-lg">
              A sovereign application with a clean slate
            </p>
            
            {/* Demo content */}
            <div className="mt-12 grid gap-4">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-2">Navigation</h2>
                <p className="text-white/60">
                  Use the tabs above to navigate: Hue, Wall, Live, $$$4U
                </p>
              </div>
              
              {profile.is_verified && (
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-2">Upload Content</h2>
                  <p className="text-white/60">
                    Click the + button in the navigation bar to upload photos or videos from your device
                  </p>
                </div>
              )}
              
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-2">Profile Status</h2>
                <p className="text-white/60">
                  Verified: <span className={profile.is_verified ? 'text-green-400' : 'text-red-400'}>
                    {profile.is_verified ? 'Yes ✓' : 'No ✗'}
                  </span>
                </p>
                <p className="text-white/40 text-sm mt-2">
                  The upload button is only visible to verified users
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
