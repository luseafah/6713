import PasswordReset from '../../components/PasswordReset';

export default function PasswordResetPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-white/5 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Reset Your Password</h2>
        <PasswordReset />
      </div>
    </div>
  );
}
