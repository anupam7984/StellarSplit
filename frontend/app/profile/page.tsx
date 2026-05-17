import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Coming Soon</h1>
        <p className="text-gray-400 mb-6">Personal expense history is under development.</p>
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}