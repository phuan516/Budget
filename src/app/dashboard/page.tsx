'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useStore, DashboardTab, Transaction } from '@/lib/store/useStore';
import OverviewTab from '@/components/dashboard/OverviewTab';
import TransactionsTab from '@/components/dashboard/TransactionsTab';
import SettingsTab from '@/components/dashboard/SettingsTab';
import EverythingTab from '@/components/dashboard/EverythingTab';

const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'settings', label: 'Settings' },
  { id: 'everything', label: 'Everything' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const selectedSheet = useStore((s) => s.selectedSheet);
  const config = useStore((s) => s.config);
  const setSelectedSheet = useStore((s) => s.setSelectedSheet);
  const setConfig = useStore((s) => s.setConfig);
  const updateConfig = useStore((s) => s.updateConfig);
  const clearSelectedSheet = useStore((s) => s.clearSelectedSheet);
  const transactions = useStore((s) => s.transactions);
  const setTransactions = useStore((s) => s.setTransactions);
  const monthTabKeys = useStore((s) => s.monthTabKeys);
  const setMonthTabKeys = useStore((s) => s.setMonthTabKeys);
  const monthConfigs = useStore((s) => s.monthConfigs);
  const setMonthConfigs = useStore((s) => s.setMonthConfigs);
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const selectedSheetRef = useRef(selectedSheet);
  useEffect(() => { selectedSheetRef.current = selectedSheet; }, [selectedSheet]);

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

  function handleSignOut() {
    clearSelectedSheet();
    signOut();
  }

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && !selectedSheet) router.push('/sheets/select');
  }, [loading, user, selectedSheet, router]);

  const syncSheetName = useCallback(async () => {
    const sheet = selectedSheetRef.current;
    if (!sheet) return;
    try {
      const res = await fetch(`/api/sheets/details?sheetId=${sheet.id}`);
      if (!res.ok) return;
      const { name } = await res.json();
      if (name && name !== sheet.name) {
        setSelectedSheet({ ...sheet, name });
      }
    } catch { /* silent — stale name is non-critical */ }
  }, [setSelectedSheet]);

  const loadConfig = useCallback(async (silent = false) => {
    if (!selectedSheet) return;
    if (!silent) setConfigLoading(true);
    try {
      const res = await fetch(`/api/config?sheetId=${selectedSheet.id}`);
      if (res.status === 401) { signOut(); return; }
      if (!silent && !res.ok) throw new Error('Failed to load config');
      if (res.ok) setConfig(await res.json());
    } catch (err) {
      if (!silent) console.error(err);
    } finally {
      if (!silent) setConfigLoading(false);
    }
  }, [selectedSheet, setConfig, signOut]);

  const loadTransactions = useCallback(async (silent = false) => {
    if (!selectedSheet) return;
    if (!silent) setTxnLoading(true);
    try {
      const res = await fetch(`/api/transactions?sheetId=${selectedSheet.id}`);
      if (res.status === 401) { signOut(); return; }
      if (!silent && !res.ok) throw new Error('Failed to load transactions');
      if (res.ok) {
        const { transactions, monthTabKeys, monthConfigs } = await res.json();
        setTransactions(transactions);
        setMonthTabKeys(monthTabKeys);
        setMonthConfigs(monthConfigs);
      }
    } catch (err) {
      if (!silent) console.error(err);
    } finally {
      if (!silent) setTxnLoading(false);
    }
  }, [selectedSheet, setTransactions, setMonthTabKeys, setMonthConfigs, signOut]);

  useEffect(() => {
    if (!loading && user && selectedSheet) {
      syncSheetName();
      loadConfig();
      loadTransactions();
    }
  }, [loading, user, selectedSheet, syncSheetName, loadConfig, loadTransactions]);

  async function handleConfigAdd(type: string, name: string, value?: string, extra?: string) {
    if (!selectedSheet) return;
    const tempId = `tmp_${Date.now()}`;
    if (type === 'category') updateConfig({ categories: [...config.categories, { id: tempId, name }] });
    else if (type === 'card') updateConfig({ cards: [...config.cards, { id: tempId, name }] });
    else if (type === 'fixed_expense') updateConfig({ fixedExpenses: [...config.fixedExpenses, { id: tempId, name, amount: parseFloat(value ?? '0') || 0 }] });
    else if (type === 'saving_goal') updateConfig({ savingGoals: [...config.savingGoals, { id: tempId, name, amount: parseFloat(value ?? '0') || 0, initialAmount: parseFloat(extra ?? '0') || 0 }] });
    await fetch('/api/config/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, type, name, value: value ?? '', extra: extra ?? '' }),
    });
    loadConfig(true);
    if (type === 'fixed_expense') loadTransactions(true);
  }

  async function handleConfigEdit(type: string, id: string, name: string, value?: string, extra?: string) {
    if (!selectedSheet) return;
    const rowIndex = parseInt(id);
    if (type === 'category') updateConfig({ categories: config.categories.map((i) => i.id === id ? { ...i, name } : i) });
    else if (type === 'card') updateConfig({ cards: config.cards.map((i) => i.id === id ? { ...i, name } : i) });
    else if (type === 'fixed_expense') updateConfig({ fixedExpenses: config.fixedExpenses.map((i) => i.id === id ? { ...i, name, amount: parseFloat(value ?? '0') || 0 } : i) });
    else if (type === 'saving_goal') updateConfig({ savingGoals: config.savingGoals.map((i) => i.id === id ? { ...i, name, amount: parseFloat(value ?? '0') || 0, initialAmount: parseFloat(extra ?? '0') || 0 } : i) });
    await fetch('/api/config/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, type, rowIndex, name, value: value ?? '', extra: extra ?? '' }),
    });
    loadConfig(true);
    if (type === 'fixed_expense') loadTransactions(true);
  }

  async function handleConfigDelete(type: string, id: string) {
    if (!selectedSheet) return;
    if (type === 'category') updateConfig({ categories: config.categories.filter((i) => i.id !== id) });
    else if (type === 'card') updateConfig({ cards: config.cards.filter((i) => i.id !== id) });
    else if (type === 'fixed_expense') updateConfig({ fixedExpenses: config.fixedExpenses.filter((i) => i.id !== id) });
    else if (type === 'saving_goal') updateConfig({ savingGoals: config.savingGoals.filter((i) => i.id !== id) });
    await fetch('/api/config/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, type, rowIndex: parseInt(id) }),
    });
    loadConfig(true);
    if (type === 'fixed_expense') loadTransactions(true);
  }

  async function handleSetIncome(amount: number) {
    if (!selectedSheet) return;
    updateConfig({ monthlyIncome: amount });
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const existingMonthConfig = monthConfigs[currentMonthKey];
    if (existingMonthConfig?.income !== undefined) {
      const { income: _i, incomeNote: _n, incomeEntries: _e, ...rest } = existingMonthConfig;
      setMonthConfigs({ ...monthConfigs, [currentMonthKey]: rest });
    }
    await fetch('/api/config/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, income: amount }),
    });
    loadConfig(true);
  }

  async function handleSetMonthlyIncomeOverride(monthKey: string, amount: number, note?: string) {
    if (!selectedSheet) return;
    const existing = monthConfigs[monthKey] ?? { fixedExpenses: [] };
    const { incomeEntries: _e, ...rest } = existing;
    setMonthConfigs({ ...monthConfigs, [monthKey]: { ...rest, income: amount, incomeNote: note } });
    await fetch('/api/config/income/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, monthKey, income: amount, note }),
    });
  }

  async function handleDeleteMonthlyIncomeOverride(monthKey: string) {
    if (!selectedSheet) return;
    const existing = monthConfigs[monthKey];
    if (existing) {
      const { income: _i, incomeNote: _n, ...rest } = existing;
      setMonthConfigs({ ...monthConfigs, [monthKey]: rest });
    }
    await fetch('/api/config/income/override', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, monthKey }),
    });
  }

  async function handleSetFixedExpenseOverride(monthKey: string, expenseName: string, amount: number, note?: string) {
    if (!selectedSheet) return;
    const existing = monthConfigs[monthKey] ?? { fixedExpenses: [] };
    const fes = existing.fixedExpenses.some((fe) => fe.name === expenseName)
      ? existing.fixedExpenses.map((fe) => fe.name === expenseName ? { ...fe, amount, note } : fe)
      : [...existing.fixedExpenses, { name: expenseName, amount, note }];
    setMonthConfigs({ ...monthConfigs, [monthKey]: { ...existing, fixedExpenses: fes } });
    await fetch('/api/config/fixed-expense/override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, monthKey, expenseName, income: amount, note }),
    });
    loadTransactions(true);
  }

  async function handleSetMonthFixedExpenses(monthKey: string, fixedExpenses: { name: string; amount: number; note?: string }[]) {
    if (!selectedSheet) return;
    const existing = monthConfigs[monthKey] ?? { fixedExpenses: [] };
    setMonthConfigs({ ...monthConfigs, [monthKey]: { ...existing, fixedExpenses } });
    await fetch('/api/config/fixed-expense/month-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, monthKey, fixedExpenses }),
    });
    loadTransactions(true);
  }

  async function handleAddIncomeEntry(amount: number, note?: string) {
    if (!selectedSheet) return;
    const today = new Date().toISOString().slice(0, 10);
    const monthKey = today.slice(0, 7);
    const newEntry = { id: `tmp_${Date.now()}`, date: today, amount, note };
    const existing = monthConfigs[monthKey] ?? { fixedExpenses: [] };
    setMonthConfigs({ ...monthConfigs, [monthKey]: { ...existing, incomeEntries: [...(existing.incomeEntries ?? []), newEntry] } });
    await fetch('/api/config/income/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, amount, note }),
    });
    loadTransactions(true);
  }

  async function handleAddIncomeEntryForMonth(monthKey: string, amount: number, note?: string) {
    if (!selectedSheet) return;
    const [yr, mo] = monthKey.split('-').map(Number);
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const tabName = `${MONTHS[mo - 1]} ${yr}`;
    const date = `${monthKey}-01`;
    const newEntry = { id: `tmp_${Date.now()}`, date, amount, note };
    const existing = monthConfigs[monthKey] ?? { fixedExpenses: [] };
    setMonthConfigs({ ...monthConfigs, [monthKey]: { ...existing, incomeEntries: [...(existing.incomeEntries ?? []), newEntry] } });
    await fetch('/api/config/income/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, amount, note, tabName, date }),
    });
    loadTransactions(true);
  }

  async function handleEditIncomeEntry(id: string, amount: number, note?: string) {
    if (!selectedSheet) return;
    const monthKey = Object.keys(monthConfigs).find(k => monthConfigs[k]?.incomeEntries?.some(e => e.id === id));
    if (!monthKey) return;
    const existing = monthConfigs[monthKey];
    if (!existing) return;
    setMonthConfigs({
      ...monthConfigs,
      [monthKey]: { ...existing, incomeEntries: existing.incomeEntries?.map(e => e.id === id ? { ...e, amount, note } : e) },
    });
    const [tabName, rowIndexStr] = id.split('|');
    await fetch('/api/config/income/entries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, tabName, rowIndex: parseInt(rowIndexStr), amount, note }),
    });
    loadTransactions(true);
  }

  async function handleDeleteIncomeEntry(id: string) {
    if (!selectedSheet) return;
    const monthKey = Object.keys(monthConfigs).find(k => monthConfigs[k]?.incomeEntries?.some(e => e.id === id));
    if (!monthKey) return;
    const existing = monthConfigs[monthKey];
    if (!existing) return;
    setMonthConfigs({
      ...monthConfigs,
      [monthKey]: { ...existing, incomeEntries: existing.incomeEntries?.filter(e => e.id !== id) },
    });
    const [tabName, rowIndexStr] = id.split('|');
    await fetch('/api/config/income/entries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, tabName, rowIndex: parseInt(rowIndexStr) }),
    });
    loadTransactions(true);
  }

  async function handleDeleteFixedExpenseOverride(monthKey: string, expenseName: string) {
    if (!selectedSheet) return;
    const defaultAmount = config.fixedExpenses.find((fe) => fe.name === expenseName)?.amount ?? 0;
    const existing = monthConfigs[monthKey] ?? { fixedExpenses: [] };
    const fes = existing.fixedExpenses.map((fe) => fe.name === expenseName ? { name: fe.name, amount: defaultAmount } : fe);
    setMonthConfigs({ ...monthConfigs, [monthKey]: { ...existing, fixedExpenses: fes } });
    await fetch('/api/config/fixed-expense/override', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, monthKey, expenseName }),
    });
    loadTransactions(true);
  }

  // Walks all month tabs from fromMonthKey forward, creating/updating/deleting
  // "Carry Over" transactions so overspend chains correctly across months.
  async function syncCarryOvers(fromMonthKey: string, txns: Transaction[], tabs: string[]) {
    if (!selectedSheet) return;

    const LONG_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    function keyToLongLabel(key: string) {
      const [yr, mo] = key.split('-').map(Number);
      return `${LONG_MONTHS[mo - 1]} ${yr}`;
    }
    function advanceKey(key: string) {
      const [yr, mo] = key.split('-').map(Number);
      return mo === 12 ? `${yr + 1}-01` : `${yr}-${String(mo + 1).padStart(2, '0')}`;
    }

    const sorted = [...tabs].sort();
    const CLAIM_RE = /\[←\d{4}-\d{2}\]/;

    // Compute the carry-over that flows INTO fromMonthKey from prior months
    let running = 0;
    for (const key of sorted) {
      if (key >= fromMonthKey) break;
      const income = monthConfigs[key]?.income ?? config.monthlyIncome;
      if (income <= 0) { running = 0; continue; }
      const fes = monthConfigs[key]?.fixedExpenses ?? [];
      const fixed = config.fixedExpenses.reduce((s, fe) => s + (fes.find(f => f.name === fe.name)?.amount ?? fe.amount), 0);
      const own = txns.filter(t => t.date.startsWith(key) && t.category !== 'Carry Over' && !CLAIM_RE.test(t.note ?? '')).reduce((s, t) => s + t.amount, 0);
      running = Math.max(0, own + fixed + running - income);
    }

    // Process fromMonthKey and every later tab, creating/updating/deleting carry-overs
    for (const key of sorted) {
      if (key < fromMonthKey) continue;

      const income = monthConfigs[key]?.income ?? config.monthlyIncome;
      const nk = advanceKey(key);

      if (income <= 0) {
        running = 0;
        if (tabs.includes(nk)) {
          for (const e of txns.filter(t => t.date.startsWith(nk) && t.category === 'Carry Over' && !t.id.startsWith('tmp_'))) {
            await fetch('/api/transactions/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetId: selectedSheet.id, tab: e.tab, row: e.row }) });
          }
        }
        continue;
      }

      const fes = monthConfigs[key]?.fixedExpenses ?? [];
      const fixed = config.fixedExpenses.reduce((s, fe) => s + (fes.find(f => f.name === fe.name)?.amount ?? fe.amount), 0);
      const own = txns.filter(t => t.date.startsWith(key) && t.category !== 'Carry Over' && !CLAIM_RE.test(t.note ?? '')).reduce((s, t) => s + t.amount, 0);
      const deficit = own + fixed + running - income;
      const carryOut = Math.max(0, Math.round(deficit * 100) / 100);
      running = carryOut;

      if (!tabs.includes(nk)) continue;

      const existing = txns.filter(t => t.date.startsWith(nk) && t.category === 'Carry Over' && !t.id.startsWith('tmp_'));
      const note = `From ${keyToLongLabel(key)}`;
      const [nkYr, nkMo] = nk.split('-');
      const date = `${nkYr}-${nkMo}-01`;

      if (carryOut > 0.005) {
        if (existing.length === 1 && Math.abs(existing[0].amount - carryOut) < 0.01 && existing[0].note === note) continue;
        for (const e of existing) {
          await fetch('/api/transactions/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetId: selectedSheet.id, tab: e.tab, row: e.row }) });
        }
        await fetch('/api/transactions/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetId: selectedSheet.id, date, amount: carryOut, category: 'Carry Over', card: '', note }) });
      } else {
        for (const e of existing) {
          await fetch('/api/transactions/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetId: selectedSheet.id, tab: e.tab, row: e.row }) });
        }
      }
    }
  }

  async function handleAddTransaction(t: Omit<Transaction, 'id' | 'tab' | 'row'>): Promise<string> {
    if (!selectedSheet) return '';
    const tempId = `tmp_${Date.now()}`;
    const updatedTxns = [...transactions, { ...t, id: tempId, tab: '', row: 0 }];
    setTransactions(updatedTxns);

    await fetch('/api/transactions/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, ...t }),
    });

    const fromMonthKey = t.date.slice(0, 7);
    const isNewTab = !monthTabKeys.includes(fromMonthKey);
    const tabs = isNewTab ? [...monthTabKeys, fromMonthKey] : monthTabKeys;
    // When a new tab is created, sync from the previous month so the incoming
    // carry-over transaction gets written into the new tab.
    const [fyr, fmo] = fromMonthKey.split('-').map(Number);
    const syncFromKey = isNewTab
      ? (fmo === 1 ? `${fyr - 1}-12` : `${fyr}-${String(fmo - 1).padStart(2, '0')}`)
      : fromMonthKey;
    await syncCarryOvers(syncFromKey, updatedTxns, tabs);

    loadTransactions(true);
    return tempId;
  }

  async function handleEditTransaction(id: string, updates: Omit<Transaction, 'id' | 'tab' | 'row'>) {
    if (!selectedSheet) return;

    const txn = transactions.find((t) => t.id === id);
    if (!txn) return;

    const oldMonthKey = txn.date.slice(0, 7);
    const newMonthKey = updates.date.slice(0, 7);

    const updatedTxns = transactions.map((t) => t.id === id ? { ...t, ...updates } : t);
    setTransactions(updatedTxns);

    if (oldMonthKey === newMonthKey) {
      await fetch('/api/transactions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: selectedSheet.id, tab: txn.tab, row: txn.row, ...updates }),
      });
    } else {
      await fetch('/api/transactions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: selectedSheet.id, tab: txn.tab, row: txn.row }),
      });
      await fetch('/api/transactions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: selectedSheet.id, ...updates }),
      });
    }

    const fromMonthKey = oldMonthKey < newMonthKey ? oldMonthKey : newMonthKey;
    const isNewTab = !monthTabKeys.includes(newMonthKey);
    const tabs = isNewTab ? [...monthTabKeys, newMonthKey] : monthTabKeys;
    await syncCarryOvers(fromMonthKey, updatedTxns, tabs);

    loadTransactions(true);
  }

  async function handleDeleteTransaction(id: string) {
    if (!selectedSheet) return;

    const txn = transactions.find((t) => t.id === id);
    const updatedTxns = transactions.filter((t) => t.id !== id);
    setTransactions(updatedTxns);

    await fetch('/api/transactions/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, tab: txn?.tab, row: txn?.row }),
    });

    if (txn) {
      let fromMonthKey = txn.date.slice(0, 7);
      // When deleting a carry-over transaction, sync from the source month (one before)
      // so the carry-over into that month gets correctly re-created if still needed
      if (txn.category === 'Carry Over') {
        const [yr, mo] = fromMonthKey.split('-').map(Number);
        fromMonthKey = mo === 1 ? `${yr - 1}-12` : `${yr}-${String(mo - 1).padStart(2, '0')}`;
      }
      await syncCarryOvers(fromMonthKey, updatedTxns, monthTabKeys);
    }

    loadTransactions(true);
  }

  if (loading || !user || !selectedSheet) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100svh] bg-white text-[#1a1a1a] flex flex-col overflow-hidden">

      <header style={{ borderBottom: '1px solid #ececec', flexShrink: 0 }}>
        {/* Desktop */}
        <div className="hidden sm:flex justify-between items-center px-12 py-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/ledger-A-512.png" alt="Ledger" width={18} height={18} style={{ borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Ledger</span>
            <span style={{ color: '#d8d8d8', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: '#444' }}>{selectedSheet.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#888' }}>
            <span>{user.email}</span>
            <span>·</span>
            <Link href="/sheets/select" style={{ color: '#888', fontSize: 12, textDecoration: 'none' }}>
              Change sheet
            </Link>
            <span>·</span>
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12, padding: 0 }}
            >
              Sign out
            </button>
          </div>
        </div>
        {/* Mobile */}
        <div className="sm:hidden flex justify-between items-center px-5 py-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/ledger-A-512.png" alt="Ledger" width={16} height={16} style={{ borderRadius: '50%' }} />
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
                  { label: 'Sign out', action: () => { setMenuOpen(false); handleSignOut(); } },
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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                transactions={transactions}
                config={config}
                monthConfigs={monthConfigs}
                isLoading={configLoading || txnLoading}
                onSetMonthlyIncomeOverride={handleSetMonthlyIncomeOverride}
                onDeleteMonthlyIncomeOverride={handleDeleteMonthlyIncomeOverride}
                onSetFixedExpenseOverride={handleSetFixedExpenseOverride}
                onDeleteFixedExpenseOverride={handleDeleteFixedExpenseOverride}
                onAddIncomeEntry={handleAddIncomeEntry}
                onEditIncomeEntry={handleEditIncomeEntry}
                onDeleteIncomeEntry={handleDeleteIncomeEntry}
              />
            )}
            {activeTab === 'transactions' && (
              <TransactionsTab
                transactions={transactions}
                config={config}
                monthConfigs={monthConfigs}
                isLoading={txnLoading}
                onAdd={handleAddTransaction}
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                config={config}
                isLoading={configLoading}
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
                isLoading={configLoading || txnLoading}
                onSetMonthlyIncomeOverride={handleSetMonthlyIncomeOverride}
                onDeleteMonthlyIncomeOverride={handleDeleteMonthlyIncomeOverride}
                onSetFixedExpenseOverride={handleSetFixedExpenseOverride}
                onDeleteFixedExpenseOverride={handleDeleteFixedExpenseOverride}
                onSetMonthFixedExpenses={handleSetMonthFixedExpenses}
                onAddIncomeEntry={handleAddIncomeEntryForMonth}
                onEditIncomeEntry={handleEditIncomeEntry}
                onDeleteIncomeEntry={handleDeleteIncomeEntry}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
