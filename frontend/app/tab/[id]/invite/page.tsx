'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function InvitePage() {
  const params = useParams();
  const tabId = params?.id as string;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Coming Soon</h1>
        <p className="text-gray-400 mb-6">Group invite system is under development.</p>
        <Link href={`/tab/${tabId}`} className="text-blue-400 hover:text-blue-300">
          ← Back to Tab
        </Link>
      </div>
    </div>
  );
}