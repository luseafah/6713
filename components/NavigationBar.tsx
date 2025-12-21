'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

type Tab = 'Hue' | 'Wall' | 'Live' | '$$$4U';

interface NavigationBarProps {
  isVerified: boolean;
  onUploadClick: () => void;
}

export default function NavigationBar({ isVerified, onUploadClick }: NavigationBarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Hue');
  
  const tabs: Tab[] = ['Hue', 'Wall', 'Live', '$$$4U'];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white">6713</h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Upload Button - Only visible for verified users */}
          {isVerified && (
            <button
              onClick={onUploadClick}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              aria-label="Upload content"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
