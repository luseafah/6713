'use client';

import { useState } from 'react';

interface NavBarProps {
  isVerified?: boolean;
}

export default function NavBar({ isVerified = false }: NavBarProps) {
  const [activeTab, setActiveTab] = useState('Hue');
  const tabs = ['Hue', 'Wall', 'Live', '$$$4U'];

  const handleUpload = () => {
    // Trigger file input for photos/videos
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        console.log('Selected files:', Array.from(files).map(f => f.name));
        // Handle file upload here
      }
    };
    input.click();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Tabs */}
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Upload Button - Only visible if verified */}
          {isVerified && (
            <button
              onClick={handleUpload}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
              aria-label="Upload photo or video"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
