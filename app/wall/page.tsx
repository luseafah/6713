'use client';

import { useState } from 'react';
import WallChat from '@/components/WallChat';
import DeactivationCheck from '@/components/DeactivationCheck';
import AppWrapper from '@/components/AppWrapper';
import MoneyChatPill from '@/components/MoneyChatPill';

export default function WallPage() {
  const [showMoneyChatPill, setShowMoneyChatPill] = useState(true);

  const handleNavigate = (section: string) => {
    window.location.href = `/${section}`;
  };

  return (
    <AppWrapper onNavigate={handleNavigate} currentTab="wall">
      <DeactivationCheck>
        {/* $$$ Chat Pill - Floating at top of Wall */}
        {showMoneyChatPill && <MoneyChatPill />}
        
        <WallChat />
      </DeactivationCheck>
    </AppWrapper>
  );
}
