import { useState } from 'react';


export default function PasswordReset() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      let resetIdentifier = identifier;
      if (resetIdentifier && !resetIdentifier.startsWith('@') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(resetIdentifier)) {
        resetIdentifier = '@' + resetIdentifier.replace(/^@+/, '');
      }
      const res = await fetch('/api/auth/password-reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resetIdentifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
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
          Email or @Username
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => {
            let val = e.target.value;
            if (val && !val.startsWith('@') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
              val = '@' + val.replace(/^@+/, '');
            }
            setIdentifier(val);
          }}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          placeholder="Enter email or @username"
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
