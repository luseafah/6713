import Link from 'next/link';

export default function ForgotPasswordLink() {
  return (
    <div className="text-right mt-2">
      <Link href="/reset-password" className="text-xs text-blue-400 hover:underline">
        Forgot your password?
      </Link>
    </div>
  );
}
