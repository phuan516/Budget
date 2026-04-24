'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleOAuth } from '@/lib/hooks/useGoogleOAuth';
import { useStore, DashboardTab, Transaction } from '@/lib/store/useStore';
import OverviewTab from '@/components/dashboard/OverviewTab';
import TransactionsTab from '@/components/dashboard/TransactionsTab';
import SettingsTab from '@/components/dashboard/SettingsTab';

const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'settings', label: 'Settings' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, user, logout } = useGoogleOAuth();
  const selectedSheet = useStore((s) => s.selectedSheet);
  const config = useStore((s) => s.config);
  const setConfig = useStore((s) => s.setConfig);
  const updateConfig = useStore((s) => s.updateConfig);
  const transactions = useStore((s) => s.transactions);
  const setTransactions = useStore((s) => s.setTransactions);
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const [configLoading, setConfigLoading] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsInitializing(false), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isInitializing && !accessToken) router.push('/');
  }, [isInitializing, accessToken, router]);

  useEffect(() => {
    if (!isInitializing && accessToken && !selectedSheet) router.push('/sheets/select');
  }, [isInitializing, accessToken, selectedSheet, router]);

  const loadConfig = useCallback(async () => {
    if (!accessToken || !selectedSheet) return;
    setConfigLoading(true);
    try {
      const res = await fetch(`/api/config?sheetId=${selectedSheet.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Failed to load config');
      setConfig(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setConfigLoading(false);
    }
  }, [accessToken, selectedSheet, setConfig, logout]);

  const loadTransactions = useCallback(async () => {
    if (!accessToken || !selectedSheet) return;
    setTxnLoading(true);
    try {
      const res = await fetch(`/api/transactions?sheetId=${selectedSheet.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) { logout(); return; }
      if (!res.ok) throw new Error('Failed to load transactions');
      setTransactions(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setTxnLoading(false);
    }
  }, [accessToken, selectedSheet, setTransactions, logout]);

  const loadTransactionsSilent = useCallback(async () => {
    if (!accessToken || !selectedSheet) return;
    try {
      const res = await fetch(`/api/transactions?sheetId=${selectedSheet.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) { logout(); return; }
      if (res.ok) setTransactions(await res.json());
    } catch { /* silent */ }
  }, [accessToken, selectedSheet, setTransactions, logout]);

  const loadConfigSilent = useCallback(async () => {
    if (!accessToken || !selectedSheet) return;
    try {
      const res = await fetch(`/api/config?sheetId=${selectedSheet.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) { logout(); return; }
      if (res.ok) setConfig(await res.json());
    } catch { /* silent */ }
  }, [accessToken, selectedSheet, setConfig, logout]);

  useEffect(() => {
    if (!isInitializing && accessToken && selectedSheet) {
      loadConfig();
      loadTransactions();
    }
  }, [isInitializing, accessToken, selectedSheet, loadConfig, loadTransactions]);

  /* ── Config mutations ──────────────────────────────────────── */
  async function handleConfigAdd(type: string, name: string, value?: string, extra?: string) {
    if (!accessToken || !selectedSheet) return;
    const tempId = `tmp_${Date.now()}`;
    if (type === 'category') updateConfig({ categories: [...config.categories, { id: tempId, name }] });
    else if (type === 'card') updateConfig({ cards: [...config.cards, { id: tempId, name }] });
    else if (type === 'fixed_expense') updateConfig({ fixedExpenses: [...config.fixedExpenses, { id: tempId, name, amount: parseFloat(value ?? '0') || 0 }] });
    else if (type === 'saving_goal') updateConfig({ savingGoals: [...config.savingGoals, { id: tempId, name, amount: parseFloat(value ?? '0') || 0, initialAmount: parseFloat(extra ?? '0') || 0 }] });
    await fetch('/api/config/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, action: 'add', type, name, value: value ?? '', extra: extra ?? '' }),
    });
    loadConfigSilent();
  }

  async function handleConfigDelete(type: string, id: string) {
    if (!accessToken || !selectedSheet) return;
    if (type === 'category') updateConfig({ categories: config.categories.filter((i) => i.id !== id) });
    else if (type === 'card') updateConfig({ cards: config.cards.filter((i) => i.id !== id) });
    else if (type === 'fixed_expense') updateConfig({ fixedExpenses: config.fixedExpenses.filter((i) => i.id !== id) });
    else if (type === 'saving_goal') updateConfig({ savingGoals: config.savingGoals.filter((i) => i.id !== id) });
    await fetch('/api/config/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, action: 'delete', type, rowIndex: parseInt(id) }),
    });
    loadConfigSilent();
  }

  async function handleSetIncome(amount: number) {
    if (!accessToken || !selectedSheet) return;
    updateConfig({ monthlyIncome: amount });
    await fetch('/api/config/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, action: 'setIncome', income: amount }),
    });
    loadConfigSilent();
  }

  /* ── Transaction mutations ─────────────────────────────────── */
  async function handleAddTransaction(t: Omit<Transaction, 'id'>): Promise<string> {
    if (!accessToken || !selectedSheet) return '';
    const tempId = `tmp_${Date.now()}`;
    setTransactions([...transactions, { ...t, id: tempId }]);

    await fetch('/api/transactions/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, ...t }),
    });

    // Check if this transaction pushes the current month over budget
    if (config.monthlyIncome > 0) {
      const now = new Date();
      const [tYear, tMonth] = t.date.split('-').map(Number);
      const isThisMonth = tYear === now.getFullYear() && tMonth - 1 === now.getMonth();

      if (isThisMonth) {
        const newTotal = [...transactions, t]
          .filter((txn) => {
            const [y, m] = txn.date.split('-').map(Number);
            return y === now.getFullYear() && m - 1 === now.getMonth();
          })
          .reduce((s, txn) => s + txn.amount, 0);

        if (newTotal > config.monthlyIncome) {
          const overAmount = Math.round((newTotal - config.monthlyIncome) * 100) / 100;
          const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
          const nextMonthIdx = (now.getMonth() + 1) % 12;
          const nextDate = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-01`;
          const fromLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

          // Delete existing carry-over in next month (if any) to replace with updated amount
          const existing = transactions.find((txn) => {
            const [y, m] = txn.date.split('-').map(Number);
            return y === nextYear && m - 1 === nextMonthIdx && txn.category === 'Carry Over';
          });
          if (existing && !existing.id.startsWith('tmp_')) {
            await fetch('/api/transactions/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({ sheetId: selectedSheet.id, transactionId: existing.id }),
            });
          }

          await fetch('/api/transactions/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
              sheetId: selectedSheet.id,
              date: nextDate,
              amount: overAmount,
              category: 'Carry Over',
              card: '',
              note: `From ${fromLabel}`,
            }),
          });
        }
      }
    }

    loadTransactionsSilent();
    return tempId;
  }

  async function handleDeleteTransaction(id: string) {
    if (!accessToken || !selectedSheet) return;

    const txn = transactions.find((t) => t.id === id);
    setTransactions(transactions.filter((t) => t.id !== id));

    await fetch('/api/transactions/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, transactionId: id }),
    });

    // Sync carry-over when deleting a current-month transaction
    if (txn && config.monthlyIncome > 0) {
      const now = new Date();
      const [tYear, tMonth] = txn.date.split('-').map(Number);
      const isThisMonth = tYear === now.getFullYear() && tMonth - 1 === now.getMonth();

      if (isThisMonth) {
        const newTotal = transactions
          .filter((t) => t.id !== id)
          .filter((t) => {
            const [y, m] = t.date.split('-').map(Number);
            return y === now.getFullYear() && m - 1 === now.getMonth();
          })
          .reduce((s, t) => s + t.amount, 0);

        const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
        const nextMonthIdx = (now.getMonth() + 1) % 12;

        const existing = transactions.find((t) => {
          const [y, m] = t.date.split('-').map(Number);
          return y === nextYear && m - 1 === nextMonthIdx && t.category === 'Carry Over';
        });

        if (existing && !existing.id.startsWith('tmp_')) {
          if (newTotal <= config.monthlyIncome) {
            // Back under budget — remove carry-over
            await fetch('/api/transactions/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({ sheetId: selectedSheet.id, transactionId: existing.id }),
            });
          } else {
            // Still over budget — update carry-over to new amount
            const overAmount = Math.round((newTotal - config.monthlyIncome) * 100) / 100;
            const nextDate = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-01`;
            const fromLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
            await fetch('/api/transactions/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({ sheetId: selectedSheet.id, transactionId: existing.id }),
            });
            await fetch('/api/transactions/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({
                sheetId: selectedSheet.id,
                date: nextDate,
                amount: overAmount,
                category: 'Carry Over',
                card: '',
                note: `From ${fromLabel}`,
              }),
            });
          }
        }
      }
    }

    loadTransactionsSilent();
  }

  if (isInitializing || !accessToken || !user || !selectedSheet) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const emailShort = user.email.includes('@') ? user.email.split('@')[0] + '@…' : user.email;

  return (
    <div className="h-[100svh] bg-white text-[#1a1a1a] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid #ececec', flexShrink: 0 }}>
        {/* Desktop */}
        <div className="hidden sm:flex justify-between items-center px-12 py-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Ledger</span>
            <span style={{ color: '#d8d8d8', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: '#444' }}>{selectedSheet.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#888' }}>
            <span>{user.email}</span>
            <span>·</span>
            <button
              onClick={() => router.push('/sheets/select')}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12, padding: 0 }}
            >
              Change sheet
            </button>
            <span>·</span>
            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12, padding: 0 }}
            >
              Sign out
            </button>
          </div>
        </div>
        {/* Mobile */}
        <div className="sm:hidden flex justify-between items-center px-5 py-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#1a1a1a' }} />
            <span style={{ fontSize: 13, color: '#444', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedSheet.name}
            </span>
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
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: '#fff',
                border: '1px solid #ececec',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
                minWidth: 160,
                zIndex: 300,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 14px 8px', fontSize: 11, color: '#aaa', borderBottom: '1px solid #f0f0f0' }}>
                  {user.email}
                </div>
                {[
                  { label: 'Change sheet', action: () => { setMenuOpen(false); router.push('/sheets/select'); } },
                  { label: 'Sign out', action: () => { setMenuOpen(false); logout(); } },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#1a1a1a' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Tab nav ────────────────────────────────────────────── */}
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

      {/* ── Tab content ────────────────────────────────────────── */}
      <main className="flex-1 px-12 max-sm:px-5" style={{ overflowY: 'auto' }}>
        {activeTab === 'overview' && (
          <OverviewTab
            transactions={transactions}
            config={config}
            isLoading={configLoading || txnLoading}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            config={config}
            isLoading={txnLoading}
            onAdd={handleAddTransaction}
            onDelete={handleDeleteTransaction}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            config={config}
            isLoading={configLoading}
            onAdd={handleConfigAdd}
            onDelete={handleConfigDelete}
            onSetIncome={handleSetIncome}
          />
        )}
      </main>

    </div>
  );
}
