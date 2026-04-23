'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const transactions = useStore((s) => s.transactions);
  const setTransactions = useStore((s) => s.setTransactions);
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const [configLoading, setConfigLoading] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
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

  useEffect(() => {
    if (!isInitializing && accessToken && selectedSheet) {
      loadConfig();
      loadTransactions();
    }
  }, [isInitializing, accessToken, selectedSheet, loadConfig, loadTransactions]);

  /* ── Config mutations ──────────────────────────────────────── */
  async function handleConfigAdd(type: string, name: string, value?: string) {
    if (!accessToken || !selectedSheet) return;
    await fetch('/api/config/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, action: 'add', type, name, value: value ?? '' }),
    });
    await loadConfig();
  }

  async function handleConfigDelete(type: string, id: string) {
    if (!accessToken || !selectedSheet) return;
    await fetch('/api/config/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, action: 'delete', rowIndex: parseInt(id) }),
    });
    await loadConfig();
  }

  async function handleSetIncome(amount: number) {
    if (!accessToken || !selectedSheet) return;
    await fetch('/api/config/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, action: 'setIncome', income: amount }),
    });
    await loadConfig();
  }

  /* ── Transaction mutations ─────────────────────────────────── */
  async function handleAddTransaction(t: Omit<Transaction, 'id'>) {
    if (!accessToken || !selectedSheet) return;
    await fetch('/api/transactions/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, ...t }),
    });
    await loadTransactions();
  }

  async function handleDeleteTransaction(id: string) {
    if (!accessToken || !selectedSheet) return;
    await fetch('/api/transactions/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ sheetId: selectedSheet.id, rowIndex: parseInt(id) }),
    });
    await loadTransactions();
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
    <div className="min-h-[100svh] bg-white text-[#1a1a1a] flex flex-col">

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
          <span style={{ fontSize: 11, color: '#888' }}>{emailShort}</span>
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
