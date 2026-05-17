'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { connectWallet, getPublicKey_, sendPayment } from '@/lib/stellar';
import { getTab, getExpense, getExpenseCount, getMembers, addExpense, closeTab, calculateSettlements } from '@/lib/contract';

interface TabData {
  id: number;
  name: string;
  members: string[];
  creator: string;
  created_at: number;
  status: 'Open' | 'Closed';
}

interface ExpenseData {
  id: number;
  tab_id: number;
  description: string;
  amount: number;
  paid_by: string;
  split_between: string[];
  created_at: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export default function TabDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const tabId = parseInt(resolvedParams.id);
  
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [tab, setTab] = useState<TabData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [tabId]);

  async function loadData() {
    try {
      const key = await getPublicKey_();
      setPublicKey(key);
      
      const tabData = await getTab(tabId);
      setTab(tabData);
      
      const memberList = await getMembers(tabId);
      const count = await getExpenseCount(tabId);
      
      const expList: ExpenseData[] = [];
      for (let i = 1; i <= count; i++) {
        try {
          const exp = await getExpense(tabId, i);
          expList.push(exp);
        } catch (e) {
          continue;
        }
      }
      setExpenses(expList);
      
      const sets = calculateSettlements(expList, memberList);
      setSettlements(sets);
      
      if (key) {
        setSelectedMembers(memberList.filter(m => m !== key));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!newDesc.trim() || !newAmount || selectedMembers.length === 0) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const walletKey = publicKey || await connectWallet();
      setPublicKey(walletKey);
      
      const amountStroops = Math.round(parseFloat(newAmount) * 10000000);
      
      await addExpense(
        tabId,
        newDesc.trim(),
        amountStroops,
        walletKey,
        selectedMembers
      );
      
      setNewDesc('');
      setNewAmount('');
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseTab() {
    if (!confirm('Are you sure you want to close this tab? No more expenses can be added.')) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const walletKey = publicKey || await connectWallet();
      setPublicKey(walletKey);
      
      await closeTab(tabId);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Failed to close tab');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay(settlement: Settlement) {
    if (!publicKey) {
      const key = await connectWallet();
      setPublicKey(key);
    }
    
    const amountXLM = (settlement.amount / 10000000).toFixed(7);
    
    if (!confirm(`Pay ${amountXLM} XLM to ${settlement.to.slice(0, 6)}...${settlement.to.slice(-4)}?`)) {
      return;
    }
    
    try {
      setSubmitting(true);
      await sendPayment(settlement.to, amountXLM);
      alert('Payment successful!');
    } catch (e: any) {
      setError(e.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMember(address: string) {
    setSelectedMembers(prev => 
      prev.includes(address) 
        ? prev.filter(m => m !== address)
        : [...prev, address]
    );
  }

  function formatAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  function formatAmount(stroops: number): string {
    return (stroops / 10000000).toFixed(2);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!tab) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Tab not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white mr-4">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">{tab.name}</h1>
          <span
            className={`ml-4 px-3 py-1 rounded-full text-sm ${
              tab.status === 'Open'
                ? 'bg-green-900/50 text-green-400 border border-green-700'
                : 'bg-red-900/50 text-red-400 border border-red-700'
            }`}
          >
            {tab.status}
          </span>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Members</h2>
          <div className="flex flex-wrap gap-2">
            {tab.members.map((member) => (
              <span
                key={member}
                className={`px-3 py-1 rounded bg-gray-800 border ${
                  member === publicKey ? 'border-blue-500' : 'border-gray-700'
                }`}
              >
                {formatAddress(member)}
                {member === tab.creator && <span className="ml-1 text-xs text-yellow-400">(creator)</span>}
              </span>
            ))}
          </div>
        </div>

        {tab.status === 'Open' && tab.members.includes(publicKey || '') && (
          <div className="mb-8 bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Add Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g., Dinner"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount (XLM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Split between</label>
                <div className="flex flex-wrap gap-2">
                  {tab.members.map((member) => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => toggleMember(member)}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedMembers.includes(member)
                          ? 'bg-blue-600'
                          : 'bg-gray-700'
                      }`}
                    >
                      {formatAddress(member)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium"
              >
                {submitting ? 'Adding...' : 'Add Expense'}
              </button>
            </form>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Expenses</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-400">No expenses yet</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div key={exp.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{exp.description}</p>
                    <p className="text-sm text-gray-400">
                      Paid by {formatAddress(exp.paid_by)} • Split between {exp.split_between.map(formatAddress).join(', ')}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{formatAmount(exp.amount)} XLM</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Settlements</h2>
          {settlements.length === 0 ? (
            <p className="text-gray-400">All settled up!</p>
          ) : (
            <div className="space-y-2">
              {settlements.map((settlement, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <span className="text-yellow-400">{formatAddress(settlement.from)}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-400">{formatAddress(settlement.to)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatAmount(settlement.amount)} XLM</span>
                    {publicKey === settlement.from && (
                      <button
                        onClick={() => handlePay(settlement)}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
                      >
                        Pay
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {tab.status === 'Open' && publicKey === tab.creator && (
          <button
            onClick={handleCloseTab}
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 py-3 rounded-lg font-medium"
          >
            {submitting ? 'Closing...' : 'Close Tab'}
          </button>
        )}
      </div>
    </div>
  );
}