'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login existing user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Redirect will happen automatically via auth state change
        window.location.href = '/wall';
      } else {
        // Create new account
        // Note: Database trigger automatically creates user + profile rows
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
              display_name: nickname || username || email.split('@')[0],
            }
          }
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // Redirect to Pope AI chat for verification
          alert('Account created! Redirecting to verification chat with Pope AI...');
          window.location.href = '/messages?verification=pending';
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Hero Branding */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-6xl font-black italic tracking-tighter text-white mb-2"
          >
            6713
          </motion.h1>
          <p className="text-white/40 text-sm uppercase tracking-[0.3em]">
            Sovereign Database
          </p>
        </div>

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8"
        >
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg font-bold uppercase text-sm transition-colors ${
                isLogin
                  ? 'bg-white text-black'
                  : 'bg-transparent text-white/40 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg font-bold uppercase text-sm transition-colors ${
                !isLogin
                  ? 'bg-white text-black'
                  : 'bg-transparent text-white/40 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    placeholder="Display name (shown to others)"
                    required={!isLogin}
                  />
                </div>
                
                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    placeholder="@username (unique handle)"
                    required={!isLogin}
                    pattern="[a-zA-Z0-9_]+"
                    title="Letters, numbers, and underscores only"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                placeholder="Enter email"
                required
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 rounded-lg p-3"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold uppercase text-sm py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Enter 6713' : 'Create Account'}
            </motion.button>
          </form>

          {!isLogin && (
            <p className="text-white/40 text-xs text-center mt-4">
              After signup, you'll chat with Pope AI for verification
            </p>
          )}
        </motion.div>

        {/* Reddit Community Link */}
        <motion.a
          href="https://www.reddit.com/r/1367"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          className="mt-8 flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors group"
        >
          <span className="text-sm uppercase tracking-widest font-bold">
            Follow r/1367 on Reddit
          </span>
          <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
        </motion.a>

        {/* Footer */}
        <p className="text-white/20 text-xs text-center mt-8 uppercase tracking-[0.2em]">
          Protocol Active
        </p>
      </motion.div>
    </div>
  );
}
