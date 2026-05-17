import { connectWallet } from './stellar';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';

interface Tab {
  id: number;
  name: string;
  members: string[];
  creator: string;
  created_at: number;
  status: 'Open' | 'Closed';
}

interface Expense {
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

export async function createTab(name: string, members: string[]): Promise<number> {
  console.log('createTab called with:', name, members, CONTRACT_ID);
  if (!CONTRACT_ID || CONTRACT_ID.startsWith('CAC')) {
    return Math.floor(Math.random() * 1000) + 1;
  }
  throw new Error('Contract not deployed yet');
}

export async function addExpense(
  tabId: number,
  description: string,
  amount: number,
  paidBy: string,
  splitBetween: string[]
): Promise<number> {
  console.log('addExpense called:', tabId, description, amount);
  if (!CONTRACT_ID || CONTRACT_ID.startsWith('CAC')) {
    return Math.floor(Math.random() * 100) + 1;
  }
  throw new Error('Contract not deployed yet');
}

export async function closeTab(tabId: number): Promise<void> {
  console.log('closeTab called:', tabId);
}

export async function getTab(tabId: number): Promise<Tab> {
  console.log('getTab called:', tabId);
  return {
    id: tabId,
    name: 'Sample Tab',
    members: ['GXXXXXXXXXXXX', 'GXXXXXXXXXXXX'],
    creator: 'GXXXXXXXXXXXX',
    created_at: Date.now(),
    status: 'Open',
  };
}

export async function getExpense(tabId: number, expenseId: number): Promise<Expense> {
  return {
    id: expenseId,
    tab_id: tabId,
    description: 'Sample Expense',
    amount: 10000000,
    paid_by: 'GXXXXXXXXXXXX',
    split_between: ['GXXXXXXXXXXXX'],
    created_at: Date.now(),
  };
}

export async function getTabCount(): Promise<number> {
  return 3;
}

export async function getExpenseCount(tabId: number): Promise<number> {
  return 2;
}

export async function getMembers(tabId: number): Promise<string[]> {
  return ['GXXXXXXXXXXXX', 'GXXXXXXXXXXXX'];
}

export function calculateSettlements(expenses: Expense[], members: string[]): Settlement[] {
  const balances: Record<string, number> = {};
  members.forEach(m => balances[m] = 0);

  expenses.forEach(expense => {
    const paidBy = expense.paid_by;
    const splitBetween = expense.split_between;
    const share = expense.amount / splitBetween.length;

    balances[paidBy] += expense.amount;
    splitBetween.forEach(member => {
      balances[member] -= share;
    });
  });

  const settlements: Settlement[] = [];
  const debtors: { address: string; amount: number }[] = [];
  const creditors: { address: string; amount: number }[] = [];

  Object.entries(balances).forEach(([address, balance]) => {
    if (balance < -0.01) {
      debtors.push({ address, amount: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ address, amount: balance });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.address,
        to: creditor.address,
        amount: Math.round(amount),
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) debtors.shift();
    if (creditor.amount < 0.01) creditors.shift();
  }

  return settlements;
}