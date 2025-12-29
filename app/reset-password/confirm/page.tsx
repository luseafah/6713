import PasswordResetConfirm from '../../components/PasswordResetConfirm';

export default function PasswordResetConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-white/5 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Confirm Password Reset</h2>
        <PasswordResetConfirm />
      </div>
    </div>
  );
}
