'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { connectWallet, getPublicKey_ } from '@/lib/stellar';
import { createTab } from '@/lib/contract';

export default function CreateTab() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a tab name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const walletKey = publicKey || await connectWallet();
      setPublicKey(walletKey);

      const memberList = members
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      const tabId = await createTab(name.trim(), memberList);
      router.push(`/tab/${tabId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to create tab');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white mr-4">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Create New Tab</h1>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tab Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Goa Trip, Dinner with Friends"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Members (comma-separated addresses)
            </label>
            <textarea
              value={members}
              onChange={(e) => setMembers(e.target.value)}
              placeholder="GXXXXXXXXXXXX, GXXXXXXXXXXXX"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              Your wallet address will be added automatically
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Tab'}
          </button>
        </form>
      </div>
    </div>
  );
}