import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function PasswordReset() {
  const [identifier, setIdentifier] = useState(''); // email or username
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      let email = identifier;
      if (!identifier.includes('@')) {
        // Lookup email by username
        const { data, error: lookupError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .single();
        if (lookupError || !data?.email) throw new Error('No user found with that username');
        email = data.email;
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset} className="space-y-4">
      <div>
        <label className="block text-white/60 text-xs uppercase tracking-widest mb-2">
          Email or Username
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          placeholder="Enter email or username"
          required
        />
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {success && <div className="text-green-400 text-sm">{success}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-bold uppercase text-sm py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send Password Reset Email'}
      </button>
    </form>
  );
}
