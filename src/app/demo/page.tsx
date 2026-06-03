'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Config, Transaction } from '@/lib/store/useStore';
import OverviewTab from '@/components/dashboard/OverviewTab';
import TransactionsTab from '@/components/dashboard/TransactionsTab';
import SettingsTab from '@/components/dashboard/SettingsTab';
import EverythingTab from '@/components/dashboard/EverythingTab';

type DashboardTab = 'overview' | 'transactions' | 'settings' | 'everything';
type MonthConfig = { income?: number; incomeNote?: string; fixedExpenses: { name: string; amount: number; note?: string }[] };

const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'settings', label: 'Settings' },
  { id: 'everything', label: 'Everything' },
];

const LONG_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function advanceKey(key: string) {
  const [yr, mo] = key.split('-').map(Number);
  return mo === 12 ? `${yr + 1}-01` : `${yr}-${String(mo + 1).padStart(2, '0')}`;
}

// Pure version of syncCarryOvers — updates transactions array in place without API calls.
function syncCarryOvers(
  fromMonthKey: string,
  txns: Transaction[],
  tabs: string[],
  cfg: Config,
  mc: Record<string, MonthConfig>,
  idRef: React.MutableRefObject<number>,
): Transaction[] {
  const sorted = [...tabs].sort();
  const CLAIM_RE = /\[←\d{4}-\d{2}\]/;
  let result = [...txns];
  let running = 0;

  for (const key of sorted) {
    if (key >= fromMonthKey) break;
    const income = mc[key]?.income ?? cfg.monthlyIncome;
    if (income <= 0) { running = 0; continue; }
    const fes = mc[key]?.fixedExpenses ?? [];
    const fixed = cfg.fixedExpenses.reduce((s, fe) => s + (fes.find(f => f.name === fe.name)?.amount ?? fe.amount), 0);
    const own = result.filter(t => t.date.startsWith(key) && t.category !== 'Carry Over' && !CLAIM_RE.test(t.note ?? '')).reduce((s, t) => s + t.amount, 0);
    running = Math.max(0, own + fixed + running - income);
  }

  for (const key of sorted) {
    if (key < fromMonthKey) continue;

    const income = mc[key]?.income ?? cfg.monthlyIncome;
    const nk = advanceKey(key);

    if (income <= 0) {
      running = 0;
      if (tabs.includes(nk)) result = result.filter(t => !(t.date.startsWith(nk) && t.category === 'Carry Over'));
      continue;
    }

    const fes = mc[key]?.fixedExpenses ?? [];
    const fixed = cfg.fixedExpenses.reduce((s, fe) => s + (fes.find(f => f.name === fe.name)?.amount ?? fe.amount), 0);
    const own = result.filter(t => t.date.startsWith(key) && t.category !== 'Carry Over' && !CLAIM_RE.test(t.note ?? '')).reduce((s, t) => s + t.amount, 0);
    const deficit = own + fixed + running - income;
    const carryOut = Math.max(0, Math.round(deficit * 100) / 100);
    running = carryOut;

    if (!tabs.includes(nk)) continue;

    const existing = result.filter(t => t.date.startsWith(nk) && t.category === 'Carry Over');
    const [mo] = key.split('-').map(Number);
    const note = `From ${LONG_MONTHS[mo - 1]} ${key.split('-')[0]}`;
    const [nkYr, nkMo] = nk.split('-');
    const date = `${nkYr}-${nkMo}-01`;

    if (carryOut > 0.005) {
      if (existing.length === 1 && Math.abs(existing[0].amount - carryOut) < 0.01 && existing[0].note === note) continue;
      result = result.filter(t => !existing.includes(t));
      result.push({ id: `carry_${idRef.current++}`, tab: '', row: 0, date, amount: carryOut, category: 'Carry Over', card: '', note });
    } else {
      result = result.filter(t => !existing.includes(t));
    }
  }

  return result;
}

const INITIAL_CONFIG: Config = {
  categories: [
    { id: '2', name: 'Groceries' },
    { id: '3', name: 'Dining' },
    { id: '4', name: 'Transport' },
    { id: '5', name: 'Entertainment' },
    { id: '6', name: 'Shopping' },
    { id: '7', name: 'Healthcare' },
  ],
  cards: [
    { id: '2', name: 'Chase Sapphire' },
    { id: '3', name: 'Amex Gold' },
    { id: '4', name: 'Debit' },
  ],
  fixedExpenses: [
    { id: '2', name: 'Rent', amount: 1500 },
    { id: '3', name: 'Insurance', amount: 200 },
    { id: '4', name: 'Subscriptions', amount: 50 },
    { id: '5', name: 'Gym', amount: 40 },
  ],
  monthlyIncome: 5000,
  fixedExpenseOverrides: {},
  fixedExpenseOverrideNotes: {},
  savingGoals: [
    { id: '2', name: 'Emergency Fund', amount: 10000, initialAmount: 3000 },
    { id: '3', name: 'Vacation', amount: 3000, initialAmount: 500 },
  ],
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'd1', tab: 'March 2026', row: 2, date: '2026-03-02', amount: 87.42, category: 'Groceries', card: 'Debit', note: 'Whole Foods' },
  { id: 'd2', tab: 'March 2026', row: 3, date: '2026-03-05', amount: 34.80, category: 'Dining', card: 'Amex Gold', note: 'Pasta Palace' },
  { id: 'd3', tab: 'March 2026', row: 4, date: '2026-03-09', amount: 12.50, category: 'Transport', card: 'Chase Sapphire', note: 'Metro pass' },
  { id: 'd4', tab: 'March 2026', row: 5, date: '2026-03-12', amount: 62.00, category: 'Shopping', card: 'Chase Sapphire', note: 'Amazon order' },
  { id: 'd5', tab: 'March 2026', row: 6, date: '2026-03-18', amount: 29.99, category: 'Entertainment', card: 'Amex Gold', note: 'Concert ticket' },
  { id: 'd6', tab: 'March 2026', row: 7, date: '2026-03-22', amount: 74.15, category: 'Groceries', card: 'Debit', note: 'Trader Joes' },
  { id: 'd7', tab: 'March 2026', row: 8, date: '2026-03-27', amount: 45.00, category: 'Healthcare', card: 'Debit', note: 'Co-pay' },
  { id: 'd8', tab: 'April 2026', row: 2, date: '2026-04-03', amount: 91.20, category: 'Groceries', card: 'Debit', note: 'Costco run' },
  { id: 'd9', tab: 'April 2026', row: 3, date: '2026-04-06', amount: 58.40, category: 'Dining', card: 'Amex Gold', note: 'Sushi night' },
  { id: 'd10', tab: 'April 2026', row: 4, date: '2026-04-10', amount: 22.00, category: 'Transport', card: 'Chase Sapphire', note: 'Uber rides' },
  { id: 'd11', tab: 'April 2026', row: 5, date: '2026-04-14', amount: 135.00, category: 'Shopping', card: 'Chase Sapphire', note: 'New shoes' },
  { id: 'd12', tab: 'April 2026', row: 6, date: '2026-04-19', amount: 18.99, category: 'Entertainment', card: 'Amex Gold', note: 'Movie streaming' },
  { id: 'd13', tab: 'April 2026', row: 7, date: '2026-04-24', amount: 66.75, category: 'Groceries', card: 'Debit', note: 'Whole Foods' },
  { id: 'd14', tab: 'April 2026', row: 8, date: '2026-04-28', amount: 150.00, category: 'Healthcare', card: 'Debit', note: 'Dental cleaning' },
  { id: 'd15', tab: 'May 2026', row: 2, date: '2026-05-02', amount: 79.80, category: 'Groceries', card: 'Debit', note: 'Trader Joes' },
  { id: 'd16', tab: 'May 2026', row: 3, date: '2026-05-07', amount: 42.60, category: 'Dining', card: 'Amex Gold', note: 'Brunch with friends' },
  { id: 'd17', tab: 'May 2026', row: 4, date: '2026-05-12', amount: 18.00, category: 'Transport', card: 'Chase Sapphire', note: 'Subway card' },
  { id: 'd18', tab: 'May 2026', row: 5, date: '2026-05-16', amount: 89.99, category: 'Shopping', card: 'Chase Sapphire', note: 'Nordstrom Rack' },
  { id: 'd19', tab: 'May 2026', row: 6, date: '2026-05-20', amount: 35.00, category: 'Entertainment', card: 'Amex Gold', note: 'Museum tickets' },
  { id: 'd20', tab: 'May 2026', row: 7, date: '2026-05-22', amount: 83.40, category: 'Groceries', card: 'Debit', note: 'Weekly shop' },
];

export default function DemoPage() {
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [monthTabKeys, setMonthTabKeys] = useState<string[]>(['2026-03', '2026-04', '2026-05']);
  const [monthConfigs, setMonthConfigs] = useState<Record<string, MonthConfig>>({});
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(100);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  async function handleAddTransaction(t: Omit<Transaction, 'id' | 'tab' | 'row'>): Promise<string> {
    const id = `demo_${nextId.current++}`;
    const monthKey = t.date.slice(0, 7);
    const isNewTab = !monthTabKeys.includes(monthKey);
    const tabs = isNewTab ? [...monthTabKeys, monthKey].sort() : monthTabKeys;
    if (isNewTab) setMonthTabKeys(tabs);

    const [fyr, fmo] = monthKey.split('-').map(Number);
    const syncFromKey = isNewTab
      ? (fmo === 1 ? `${fyr - 1}-12` : `${fyr}-${String(fmo - 1).padStart(2, '0')}`)
      : monthKey;

    const updatedTxns = [...transactions, { ...t, id, tab: '', row: 0 }];
    setTransactions(syncCarryOvers(syncFromKey, updatedTxns, tabs, config, monthConfigs, nextId));
    return id;
  }

  async function handleEditTransaction(id: string, updates: Omit<Transaction, 'id' | 'tab' | 'row'>) {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) return;
    const oldMonthKey = txn.date.slice(0, 7);
    const newMonthKey = updates.date.slice(0, 7);
    const isNewTab = !monthTabKeys.includes(newMonthKey);
    const tabs = isNewTab ? [...monthTabKeys, newMonthKey].sort() : monthTabKeys;
    if (isNewTab) setMonthTabKeys(tabs);

    const updatedTxns = transactions.map((t) => t.id === id ? { ...t, ...updates } : t);
    const fromMonthKey = oldMonthKey < newMonthKey ? oldMonthKey : newMonthKey;
    setTransactions(syncCarryOvers(fromMonthKey, updatedTxns, tabs, config, monthConfigs, nextId));
  }

  async function handleDeleteTransaction(id: string) {
    const txn = transactions.find((t) => t.id === id);
    const updatedTxns = transactions.filter((t) => t.id !== id);
    if (!txn) { setTransactions(updatedTxns); return; }

    let fromMonthKey = txn.date.slice(0, 7);
    if (txn.category === 'Carry Over') {
      const [yr, mo] = fromMonthKey.split('-').map(Number);
      fromMonthKey = mo === 1 ? `${yr - 1}-12` : `${yr}-${String(mo - 1).padStart(2, '0')}`;
    }
    setTransactions(syncCarryOvers(fromMonthKey, updatedTxns, monthTabKeys, config, monthConfigs, nextId));
  }

  async function handleConfigAdd(type: string, name: string, value?: string, extra?: string) {
    const id = String(nextId.current++);
    setConfig((c) => {
      if (type === 'category') return { ...c, categories: [...c.categories, { id, name }] };
      if (type === 'card') return { ...c, cards: [...c.cards, { id, name }] };
      if (type === 'fixed_expense') return { ...c, fixedExpenses: [...c.fixedExpenses, { id, name, amount: parseFloat(value ?? '0') || 0 }] };
      if (type === 'saving_goal') return { ...c, savingGoals: [...c.savingGoals, { id, name, amount: parseFloat(value ?? '0') || 0, initialAmount: parseFloat(extra ?? '0') || 0 }] };
      return c;
    });
  }

  async function handleConfigEdit(type: string, id: string, name: string, value?: string, extra?: string) {
    setConfig((c) => {
      if (type === 'category') return { ...c, categories: c.categories.map((i) => i.id === id ? { ...i, name } : i) };
      if (type === 'card') return { ...c, cards: c.cards.map((i) => i.id === id ? { ...i, name } : i) };
      if (type === 'fixed_expense') return { ...c, fixedExpenses: c.fixedExpenses.map((i) => i.id === id ? { ...i, name, amount: parseFloat(value ?? '0') || 0 } : i) };
      if (type === 'saving_goal') return { ...c, savingGoals: c.savingGoals.map((i) => i.id === id ? { ...i, name, amount: parseFloat(value ?? '0') || 0, initialAmount: parseFloat(extra ?? '0') || 0 } : i) };
      return c;
    });
  }

  async function handleConfigDelete(type: string, id: string) {
    setConfig((c) => {
      if (type === 'category') return { ...c, categories: c.categories.filter((i) => i.id !== id) };
      if (type === 'card') return { ...c, cards: c.cards.filter((i) => i.id !== id) };
      if (type === 'fixed_expense') return { ...c, fixedExpenses: c.fixedExpenses.filter((i) => i.id !== id) };
      if (type === 'saving_goal') return { ...c, savingGoals: c.savingGoals.filter((i) => i.id !== id) };
      return c;
    });
  }

  async function handleSetIncome(amount: number) {
    setConfig((c) => ({ ...c, monthlyIncome: amount }));
  }

  async function handleSetMonthlyIncomeOverride(monthKey: string, amount: number, note?: string) {
    setMonthConfigs((mc) => ({ ...mc, [monthKey]: { ...(mc[monthKey] ?? { fixedExpenses: [] }), income: amount, incomeNote: note } }));
  }

  async function handleDeleteMonthlyIncomeOverride(monthKey: string) {
    setMonthConfigs((mc) => {
      const existing = mc[monthKey];
      if (!existing) return mc;
      const { income: _i, incomeNote: _n, ...rest } = existing;
      return { ...mc, [monthKey]: rest };
    });
  }

  async function handleSetFixedExpenseOverride(monthKey: string, expenseName: string, amount: number, note?: string) {
    setMonthConfigs((mc) => {
      const existing = mc[monthKey] ?? { fixedExpenses: [] };
      const fes = existing.fixedExpenses.some((fe) => fe.name === expenseName)
        ? existing.fixedExpenses.map((fe) => fe.name === expenseName ? { ...fe, amount, note } : fe)
        : [...existing.fixedExpenses, { name: expenseName, amount, note }];
      return { ...mc, [monthKey]: { ...existing, fixedExpenses: fes } };
    });
  }

  async function handleDeleteFixedExpenseOverride(monthKey: string, expenseName: string) {
    const defaultAmount = config.fixedExpenses.find((fe) => fe.name === expenseName)?.amount ?? 0;
    setMonthConfigs((mc) => {
      const existing = mc[monthKey] ?? { fixedExpenses: [] };
      const fes = existing.fixedExpenses.map((fe) => fe.name === expenseName ? { name: fe.name, amount: defaultAmount } : fe);
      return { ...mc, [monthKey]: { ...existing, fixedExpenses: fes } };
    });
  }

  async function handleSetMonthFixedExpenses(monthKey: string, fixedExpenses: { name: string; amount: number; note?: string }[]) {
    setMonthConfigs((mc) => ({ ...mc, [monthKey]: { ...(mc[monthKey] ?? { fixedExpenses: [] }), fixedExpenses } }));
  }

  return (
    <div className="h-[100svh] bg-white text-[#1a1a1a] flex flex-col overflow-hidden">

      {!bannerDismissed && (
        <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12 }}>
          <span style={{ fontSize: 12, color: '#166534' }}>
            Demo mode — changes aren&apos;t saved.{' '}
            <Link href="/" style={{ color: '#166534', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
              Sign in
            </Link>
            {' '}to use your own data.
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <header style={{ borderBottom: '1px solid #ececec', flexShrink: 0 }}>
        <div className="hidden sm:flex justify-between items-center px-12 py-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/ledger-A-512.png" alt="Ledger" width={18} height={18} style={{ borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Ledger</span>
            <span style={{ color: '#d8d8d8', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: '#444' }}>Demo Budget</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#888' }}>
            <span>demo@example.com</span>
            <span>·</span>
            <Link href="/" style={{ color: '#888', fontSize: 12, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>
        <div className="sm:hidden flex justify-between items-center px-5 py-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/ledger-A-512.png" alt="Ledger" width={16} height={16} style={{ borderRadius: '50%' }} />
            <span style={{ fontSize: 13, color: '#444' }}>Demo Budget</span>
          </div>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', gap: 4 }}
              aria-label="Menu"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ display: 'block', width: 18, height: 1.5, background: '#888', borderRadius: 1 }} />
              ))}
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid #ececec', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.09)', minWidth: 160, zIndex: 300, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px 8px', fontSize: 11, color: '#aaa', borderBottom: '1px solid #f0f0f0' }}>
                  demo@example.com
                </div>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '11px 14px', fontSize: 13, color: '#1a1a1a', textDecoration: 'none' }}
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav style={{ borderBottom: '1px solid #ececec', flexShrink: 0 }}>
        <div className="px-12 max-sm:px-5" style={{ display: 'flex', gap: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #1a1a1a' : '2px solid transparent',
                padding: '14px 0',
                marginRight: 28,
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#1a1a1a' : '#888',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 px-12 max-sm:px-5" style={{ overflowY: 'auto' }}>
        {activeTab === 'overview' && (
          <OverviewTab
            transactions={transactions}
            config={config}
            monthConfigs={monthConfigs}
            isLoading={false}
            onSetMonthlyIncomeOverride={handleSetMonthlyIncomeOverride}
            onDeleteMonthlyIncomeOverride={handleDeleteMonthlyIncomeOverride}
            onSetFixedExpenseOverride={handleSetFixedExpenseOverride}
            onDeleteFixedExpenseOverride={handleDeleteFixedExpenseOverride}
            onAddIncomeEntry={async () => {}}
            onEditIncomeEntry={async () => {}}
            onDeleteIncomeEntry={async () => {}}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            config={config}
            monthConfigs={monthConfigs}
            isLoading={false}
            onAdd={handleAddTransaction}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            config={config}
            isLoading={false}
            onAdd={handleConfigAdd}
            onDelete={handleConfigDelete}
            onEdit={handleConfigEdit}
            onSetIncome={handleSetIncome}
          />
        )}
        {activeTab === 'everything' && (
          <EverythingTab
            transactions={transactions}
            config={config}
            monthConfigs={monthConfigs}
            isLoading={false}
            onSetMonthlyIncomeOverride={handleSetMonthlyIncomeOverride}
            onDeleteMonthlyIncomeOverride={handleDeleteMonthlyIncomeOverride}
            onSetFixedExpenseOverride={handleSetFixedExpenseOverride}
            onDeleteFixedExpenseOverride={handleDeleteFixedExpenseOverride}
            onSetMonthFixedExpenses={handleSetMonthFixedExpenses}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
          />
        )}
      </main>
    </div>
  );
}
