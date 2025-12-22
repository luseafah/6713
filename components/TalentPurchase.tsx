'use client';

import { useState } from 'react';
import { DollarSign, Zap, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TalentPackage {
  id: string;
  name: string;
  talents: number;
  priceUsd: number;
  popular?: boolean;
}

const TALENT_PACKAGES: TalentPackage[] = [
  {
    id: 'starter',
    name: 'Starter Frequency',
    talents: 100,
    priceUsd: 1.50,
  },
  {
    id: 'standard',
    name: 'Standard Pack',
    talents: 500,
    priceUsd: 7.50,
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    talents: 1000,
    priceUsd: 15.00,
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite Frequency',
    talents: 5000,
    priceUsd: 75.00,
  },
];

interface TalentPurchaseProps {
  onComplete?: () => void;
}

/**
 * 6713 Protocol: Talent Purchase Interface
 * 
 * Admin-only manual Talent purchases
 * Contact administrator to purchase Talents
 */
export default function TalentPurchase({ onComplete }: TalentPurchaseProps) {
  const [selectedPackage, setSelectedPackage] = useState<TalentPackage>(TALENT_PACKAGES[2]); // Premium default

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap size={40} className="text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-yellow-500 mb-3">Get Talents</h1>
          <p className="text-white/60 text-lg">Power your presence in the 6713 Protocol</p>
        </div>

        {/* Package Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {TALENT_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all transform hover:scale-105
                ${
                  selectedPackage.id === pkg.id
                    ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]'
                    : 'bg-zinc-900 border-white/10 hover:border-white/30'
                }
              `}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                  POPULAR
                </div>
              )}

              {/* Package Info */}
              <div className="text-center">
                <div className="text-yellow-500 text-4xl font-bold mb-2">
                  {pkg.talents.toLocaleString()}
                </div>
                <div className="text-yellow-500/80 text-sm font-medium mb-4">Talents</div>

                <div className="text-white text-2xl font-bold mb-2">${pkg.priceUsd.toFixed(2)}</div>
                <div className="text-white/40 text-xs">{pkg.name}</div>
              </div>

              {/* Selection Indicator */}
              {selectedPackage.id === pkg.id && (
                <div className="absolute top-3 right-3">
                  <CheckCircle size={20} className="text-yellow-500" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Purchase Summary */}
        <div className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Selected Package</h3>
              <p className="text-white/60">{selectedPackage.name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-500">
                {selectedPackage.talents.toLocaleString()}T
              </div>
              <div className="text-white/60 text-sm">for ${selectedPackage.priceUsd.toFixed(2)}</div>
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="bg-black border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={20} className="text-yellow-500" />
              <span className="text-yellow-500 font-bold text-lg">Manual Purchase System</span>
            </div>
            <div className="text-white/80 text-sm space-y-2">
              <p>Talent purchases are currently processed manually by administrators.</p>
              <p className="text-yellow-500/80">To purchase Talents, please contact an admin with your desired package.</p>
            </div>
            <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-white/10">
              <span className="text-white/60">Exchange Rate:</span>
              <span className="text-yellow-500 font-bold">$1.50 = 100 Talents</span>
            </div>
          </div>

          {/* Contact Admin Button */}
          <button
            onClick={onComplete}
            className="w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Shield size={24} />
            Contact Admin to Purchase
          </button>
        </div>

        {/* Protocol Notice */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-white/60 text-sm">
            All Talent purchases are processed manually by administrators.
            <span className="text-yellow-500 font-bold"> Purchases are final and non-refundable</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
