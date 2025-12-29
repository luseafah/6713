import PasswordChangeModal from '../../components/PasswordChangeModal';
import { useState } from 'react';

export default function AccountSettingsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-white/5 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Account Settings</h2>
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-white text-black font-bold uppercase text-sm py-3 rounded-lg hover:bg-white/90 transition-colors mb-4"
        >
          Change Password
        </button>
        {showModal && <PasswordChangeModal onClose={() => setShowModal(false)} />}
      </div>
    </div>
  );
}
