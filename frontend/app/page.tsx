'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { connectWallet, getPublicKey_ } from '@/lib/stellar';
import { getTab, getTabCount, getMembers, getExpenseCount } from '@/lib/contract';

interface TabInfo {
  id: number;
  name: string;
  memberCount: number;
  expenseCount: number;
  status: 'Open' | 'Closed';
}

export default function Home() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkWallet();
  }, []);

  async function checkWallet() {
    try {
      const key = await getPublicKey_();
      if (key) {
        setPublicKey(key);
        await loadTabs(key);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadTabs(walletKey: string) {
    try {
      const count = await getTabCount();
      const tabInfos: TabInfo[] = [];

      for (let i = 1; i <= count; i++) {
        try {
          const tab = await getTab(i);
          const members = await getMembers(i);
          const expenseCount = await getExpenseCount(i);

          if (members.includes(walletKey)) {
            tabInfos.push({
              id: tab.id,
              name: tab.name,
              memberCount: members.length,
              expenseCount,
              status: tab.status,
            });
          }
        } catch (e) {
          continue;
        }
      }

      setTabs(tabInfos);
    } catch (e: any) {
      setError(e.message || 'Failed to load tabs');
    }
  }

  async function handleConnect() {
    try {
      const key = await connectWallet();
      setPublicKey(key);
      await loadTabs(key);
    } catch (e: any) {
      setError(e.message || 'Failed to connect wallet');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">StellarSplit</h1>
          {publicKey && (
            <div className="text-sm text-gray-400">
              {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!publicKey ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">Connect your wallet to view your tabs</p>
            <button
              onClick={handleConnect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Your Tabs</h2>
              <Link
                href="/create"
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create New Tab
              </Link>
            </div>

            {tabs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No tabs yet. Create your first tab to start splitting bills!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tabs.map((tab) => (
                  <Link
                    key={tab.id}
                    href={`/tab/${tab.id}`}
                    className="block bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">{tab.name}</h3>
                        <p className="text-sm text-gray-400">
                          {tab.memberCount} members • {tab.expenseCount} expenses
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          tab.status === 'Open'
                            ? 'bg-green-900/50 text-green-400 border border-green-700'
                            : 'bg-red-900/50 text-red-400 border border-red-700'
                        }`}
                      >
                        {tab.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}