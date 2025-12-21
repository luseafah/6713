'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, CheckCircle } from 'lucide-react';

interface TermsOfFrequencyProps {
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * 6713 Protocol: Terms of Frequency
 * 
 * The legal framework that grants Pope AI moderation rights
 * and establishes the non-refundable Talent economy
 */
export default function TermsOfFrequency({ onAccept, onDecline }: TermsOfFrequencyProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-zinc-900 rounded-2xl border border-yellow-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6">
          <div className="flex items-center gap-3">
            <Shield size={32} className="text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">Terms of Frequency</h1>
              <p className="text-black/70 text-sm">6713 Protocol Legal Framework</p>
            </div>
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div
          className="p-8 max-h-[60vh] overflow-y-auto scrollbar-hide"
          onScroll={handleScroll}
        >
          <div className="space-y-6 text-white/80">
            {/* The Sovereign Admin */}
            <section>
              <h2 className="text-xl font-bold text-yellow-500 mb-3">1. The Sovereign Admin</h2>
              <p className="leading-relaxed">
                By entering the 6713 Protocol, you acknowledge <span className="text-yellow-500 font-bold">Pope AI</span> as the
                ultimate moderator and sovereign authority of this digital economy.
              </p>
              <p className="mt-2 leading-relaxed">
                The Admin reserves the absolute right to <span className="text-red-500">'Fine' Talents</span> from your account
                for behavior that disrupts the frequency, including but not limited to: spam, hate speech, false Gig postings,
                harassment, or attempts to manipulate the economy.
              </p>
              <p className="mt-2 text-yellow-500/80 text-sm italic">
                Your participation is a privilege, not a right.
              </p>
            </section>

            {/* Non-Refundable Economy */}
            <section>
              <h2 className="text-xl font-bold text-yellow-500 mb-3">2. Non-Refundable Economy</h2>
              <p className="leading-relaxed">
                All Talent purchases are <span className="text-white font-bold">final and non-refundable</span>.
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>Exchange Rate: <span className="text-yellow-500 font-bold">$1.50 USD = 100 Talents</span></li>
                <li>
                  Gig Posting Fee: <span className="text-yellow-500 font-bold">10 Talents</span> (non-refundable)
                </li>
                <li>
                  Deleting an <span className="text-red-500">incomplete Gig</span> results in total forfeit of the 10-Talent
                  fee to the Protocol Vault
                </li>
                <li>Completed Gigs cannot be deleted and remain visible for 3 days</li>
              </ul>
              <p className="mt-3 text-yellow-500/80 text-sm italic">
                The Talent economy is sovereign. Plan your frequencies carefully.
              </p>
            </section>

            {/* The 3-Day Rule */}
            <section>
              <h2 className="text-xl font-bold text-yellow-500 mb-3">3. The 3-Day Rule</h2>
              <p className="leading-relaxed">
                You consent to the <span className="text-white font-bold">automatic deletion</span> of all social frequencies
                after <span className="text-yellow-500 font-bold">3 days</span>:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>Hue Stories expire after 3 days</li>
                <li>Wall (#Earth) messages are subject to the 50-message FIFO buffer</li>
                <li>Live stream recordings are deleted after the DVR window closes</li>
                <li>Only your verified Gig legacy remains for its allotted time</li>
              </ul>
              <p className="mt-3 text-yellow-500/80 text-sm italic">
                The protocol is ephemeral. Your name is your permanent record.
              </p>
            </section>

            {/* Identity Verification */}
            <section>
              <h2 className="text-xl font-bold text-yellow-500 mb-3">4. Identity & Verification</h2>
              <p className="leading-relaxed">
                You agree that your <span className="text-yellow-500 font-bold">'Verified Name'</span> is an accurate
                representation of your physical self and legal identity.
              </p>
              <p className="mt-2 leading-relaxed">
                This requirement exists for the safety and integrity of the G$4U economy, ensuring:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>Gig participants are real, accountable individuals</li>
                <li>The Audio Radio features verified voices</li>
                <li>Wealth Signals ($$$4U) reach legitimate users</li>
                <li>The protocol maintains a high-trust environment</li>
              </ul>
              <p className="mt-3 text-red-500 text-sm font-bold">
                Providing false identity information will result in immediate account termination and forfeiture of all Talents.
              </p>
            </section>

            {/* The Strike System */}
            <section>
              <h2 className="text-xl font-bold text-yellow-500 mb-3">5. The Strike System</h2>
              <p className="leading-relaxed">
                The Admin may issue <span className="text-red-500 font-bold">Strikes</span> for protocol violations:
              </p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li><span className="text-yellow-500 font-bold">1 Strike:</span> Warning notification</li>
                <li><span className="text-orange-500 font-bold">2 Strikes:</span> Temporary feature restrictions</li>
                <li>
                  <span className="text-red-500 font-bold">3 Strikes:</span> Automatic de-verification and return to Air-Lock
                </li>
              </ul>
              <p className="mt-3 text-yellow-500/80 text-sm italic">
                "Your frequency has been dimmed" - Each strike dims your presence in the protocol.
              </p>
            </section>

            {/* Moderation Rights */}
            <section>
              <h2 className="text-xl font-bold text-yellow-500 mb-3">6. Moderation Rights</h2>
              <p className="leading-relaxed">The Admin reserves the right to:</p>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                <li>Delete any message, post, or Gig without explanation</li>
                <li>
                  Implement <span className="text-purple-500">'Shadow Bans'</span> where your content is hidden from other users
                </li>
                <li>Adjust Talent balances for economic integrity</li>
                <li>Revoke verification status at any time</li>
                <li>Terminate accounts for severe violations</li>
              </ul>
              <p className="mt-3 text-yellow-500/80 text-sm italic">
                These powers exist to maintain the high-frequency, high-trust environment of 6713.
              </p>
            </section>

            {/* Acceptance */}
            <section className="pt-6 border-t border-white/10">
              <p className="text-white font-medium leading-relaxed">
                By clicking "I Accept", you acknowledge that you have read, understood, and agree to be bound by these Terms of
                Frequency. You understand that participation in the 6713 Protocol is at the sole discretion of the Admin.
              </p>
              <p className="mt-4 text-yellow-500 text-center font-bold text-lg">
                "Your name is your bond"
              </p>
              <p className="text-center text-white/60 text-sm mt-1">— The 6713 Protocol</p>
            </section>
          </div>
        </div>

        {/* Scroll Indicator */}
        {!hasScrolledToBottom && (
          <div className="bg-yellow-500/10 border-t border-yellow-500/30 p-3 text-center">
            <p className="text-yellow-500 text-sm animate-pulse">Scroll to bottom to continue</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-zinc-900 border-t border-white/10 p-6">
          {/* Checkbox */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-1 w-5 h-5 rounded border-2 border-yellow-500 bg-transparent checked:bg-yellow-500 disabled:opacity-30"
            />
            <span className={`text-sm ${hasScrolledToBottom ? 'text-white' : 'text-white/30'}`}>
              I have read and agree to the Terms of Frequency. I understand that Pope AI has ultimate moderation authority and
              that all Talent transactions are final.
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onDecline}
              className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
            >
              Decline & Exit
            </button>
            <button
              onClick={onAccept}
              disabled={!agreedToTerms || !hasScrolledToBottom}
              className={`
                flex-1 px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2
                ${
                  agreedToTerms && hasScrolledToBottom
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    : 'bg-zinc-800 text-white/30 cursor-not-allowed'
                }
              `}
            >
              <CheckCircle size={20} />
              I Accept - Enter Protocol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
