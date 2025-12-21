'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Upload } from 'lucide-react';
import UploadModal from './UploadModal';

interface NavigationProps {
  isVerified?: boolean;
}

export default function Navigation({ isVerified = false }: NavigationProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const links = [
    { name: 'Hue', path: '/hue' },
    { name: 'Wall', path: '/wall' },
    { name: 'Live', path: '/live' },
    { name: 'Search', path: '/search' },
    { name: '$$$4U', path: '/money' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Hamburger Menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white hover:text-white/80 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Center: Logo */}
          <Link href="/wall" className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-2xl font-black italic text-white">6713</h1>
          </Link>

          {/* Right: Upload Button (Only for verified users) */}
          {isVerified && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-white text-black p-2 rounded-full hover:bg-white/90 transition-colors"
              aria-label="Upload media"
            >
              <Upload size={20} />
            </button>
          )}
        </div>
      </nav>

      {/* Sidebar Menu */}
      <div
        className={`fixed top-16 left-0 bottom-0 w-64 bg-black/95 backdrop-blur-md border-r border-white/10 z-40 transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col p-6 gap-4">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`text-white text-xl font-medium transition-all py-2 px-4 rounded-lg ${
                pathname === link.path
                  ? 'bg-white/10 opacity-100'
                  : 'opacity-50 hover:opacity-75 hover:bg-white/5'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 top-16"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Upload Modal */}
      {isVerified && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </>
  );
}
