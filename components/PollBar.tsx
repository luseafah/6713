'use client';

import { useState, useEffect } from 'react';
import { usePollAnimation } from '@/lib/sensoryFeedback';

interface PollBarProps {
  option: string;
  percentage: number;
  totalVotes: number;
  isSelected: boolean;
  color?: string;
}

/**
 * Poll Bar with Growing Frequency Effect
 * 
 * Protocol: Bar doesn't jump, it slides smoothly based on percentage
 * Creates a "frequency growing" visual effect
 */
export default function PollBar({ option, percentage, totalVotes, isSelected, color = 'yellow' }: PollBarProps) {
  const { displayPercent, animateTo } = usePollAnimation(0);

  // Animate to target percentage when it changes
  useEffect(() => {
    animateTo(percentage);
  }, [percentage, animateTo]);

  const colorClasses = {
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  }[color];

  return (
    <button
      className={`
        relative w-full h-12 rounded-lg overflow-hidden
        bg-white/5 border border-white/10 hover:border-white/20
        transition-all duration-300
        ${isSelected ? 'ring-2 ring-white/40' : ''}
      `}
    >
      {/* Growing Frequency Bar */}
      <div
        className={`
          absolute inset-0 ${colorClasses} opacity-30
          transition-all duration-800 ease-out
        `}
        style={{ width: `${displayPercent}%` }}
      >
        {/* Shimmer Effect */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: 'shimmer 2s infinite',
          }}
        />
      </div>

      {/* Option Text */}
      <div className="relative z-10 flex items-center justify-between px-4 h-full">
        <span className="text-white font-medium">{option}</span>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm">{totalVotes} votes</span>
          <span className={`text-${color}-500 font-bold text-lg`}>
            {Math.round(displayPercent)}%
          </span>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </button>
  );
}

interface PollContainerProps {
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  totalVotes: number;
  userVote?: string;
  onVote: (optionId: string) => void;
}

/**
 * Complete Poll Component with Growing Frequency Animation
 */
export function PollContainer({ question, options, totalVotes, userVote, onVote }: PollContainerProps) {
  const colors = ['yellow', 'blue', 'green', 'purple', 'red'];

  return (
    <div className="w-full p-6 bg-black/40 rounded-2xl border border-white/10">
      {/* Question */}
      <h3 className="text-white text-lg font-bold mb-4">{question}</h3>

      {/* Poll Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          
          return (
            <div key={option.id} onClick={() => onVote(option.id)}>
              <PollBar
                option={option.text}
                percentage={percentage}
                totalVotes={option.votes}
                isSelected={userVote === option.id}
                color={colors[index % colors.length]}
              />
            </div>
          );
        })}
      </div>

      {/* Total Votes */}
      <div className="mt-4 text-center text-white/60 text-sm">
        {totalVotes} total votes
      </div>
    </div>
  );
}
