'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Config } from '@/lib/store/useStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from 'recharts';
import CustomSelect from '@/components/ui/CustomSelect';
import s from './EverythingTab.module.css';

const MONO = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LINE_COLORS = ['#1a1a1a', '#6b7280', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];

function fmt(n: number): string {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function yAxisFmt(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`;
}

function keyToShortLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[parseInt(m) - 1]} '${y.slice(2)}`;
}

function keyToFullLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

type MonthConfig = { income?: number; incomeNote?: string; fixedExpenses: { name: string; amount: number; note?: string }[] };
type SortBy = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

interface Props {
  transactions: Transaction[];
  config: Config;
  monthConfigs: Record<string, MonthConfig>;
  isLoading: boolean;
  onSetMonthlyIncomeOverride: (monthKey: string, amount: number, note?: string) => Promise<void>;
  onDeleteMonthlyIncomeOverride: (monthKey: string) => Promise<void>;
  onSetFixedExpenseOverride: (monthKey: string, expenseName: string, amount: number, note?: string) => Promise<void>;
  onDeleteFixedExpenseOverride: (monthKey: string, expenseName: string) => Promise<void>;
  onSetMonthFixedExpenses: (monthKey: string, fixedExpenses: { name: string; amount: number; note?: string }[]) => Promise<void>;
  onEdit: (id: string, updates: Omit<Transaction, 'id' | 'tab' | 'row'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function EverythingTab({ transactions, config, monthConfigs, isLoading, onSetMonthlyIncomeOverride, onDeleteMonthlyIncomeOverride, onSetFixedExpenseOverride, onDeleteFixedExpenseOverride, onSetMonthFixedExpenses, onEdit, onDelete }: Props) {
  const [subTab, setSubTab] = useState<'transactions' | 'charts' | 'edit-months'>('transactions');
  const [search, setSearch] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCard, setFilterCard] = useState('');
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [monthSearch, setMonthSearch] = useState('');
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const [editingIncomeMonth, setEditingIncomeMonth] = useState<string | null>(null);
  const [incomeDraft, setIncomeDraft] = useState('');
  const [incomeNoteDraft, setIncomeNoteDraft] = useState('');
  const [savingIncome, setSavingIncome] = useState(false);
  const [resettingIncome, setResettingIncome] = useState<string | null>(null);
  const [editingFixedKey, setEditingFixedKey] = useState<string | null>(null);
  const [fixedDraft, setFixedDraft] = useState('');
  const [fixedNoteDraft, setFixedNoteDraft] = useState('');
  const [savingFixed, setSavingFixed] = useState(false);
  const [resettingFixed, setResettingFixed] = useState<string | null>(null);
  const [removingFixed, setRemovingFixed] = useState<string | null>(null);
  const [editMonthSearch, setEditMonthSearch] = useState('');
  const [addingExpenseMonth, setAddingExpenseMonth] = useState<string | null>(null);
  const [addNameDraft, setAddNameDraft] = useState('');
  const [addAmountDraft, setAddAmountDraft] = useState('');
  const [addNoteDraft, setAddNoteDraft] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);

  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);
  const [editTxnForm, setEditTxnForm] = useState({ date: '', amount: '', category: '', card: '', note: '' });
  const [editTxnIsRefund, setEditTxnIsRefund] = useState(false);
  const [editTxnSaving, setEditTxnSaving] = useState(false);
  const [editTxnError, setEditTxnError] = useState<string | null>(null);
  const [deletingTxnId, setDeletingTxnId] = useState<string | null>(null);

  const allMonthKeys = useMemo(
    () => [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse(),
    [transactions]
  );

  const filteredMonthKeys = useMemo(() => {
    if (!monthSearch.trim()) return allMonthKeys;
    const q = monthSearch.toLowerCase();
    return allMonthKeys.filter(key =>
      keyToFullLabel(key).toLowerCase().includes(q) ||
      keyToShortLabel(key).toLowerCase().includes(q)
    );
  }, [allMonthKeys, monthSearch]);

  const uniqueCategories = useMemo(
    () => [...new Set(transactions.map(t => t.category).filter(Boolean))].sort(),
    [transactions]
  );
  const uniqueCards = useMemo(
    () => [...new Set(transactions.map(t => t.card).filter(Boolean))].sort(),
    [transactions]
  );

  useEffect(() => {
    if (!monthDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setMonthDropdownOpen(false);
        setMonthSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [monthDropdownOpen]);

  const editMonthKeys = useMemo(() => {
    const all = Object.keys(monthConfigs ?? {}).sort().reverse();
    const q = editMonthSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter(key =>
      keyToFullLabel(key).toLowerCase().includes(q) || keyToShortLabel(key).toLowerCase().includes(q)
    );
  }, [monthConfigs, editMonthSearch]);

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.note.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.card.toLowerCase().includes(q)
      );
    }
    if (selectedMonths.size > 0) {
      result = result.filter(t => selectedMonths.has(t.date.slice(0, 7)));
    }
    if (filterCategory) result = result.filter(t => t.category === filterCategory);
    if (filterCard) result = result.filter(t => t.card === filterCard);
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      return a.amount - b.amount;
    });
    return result;
  }, [transactions, search, selectedMonths, sortBy, filterCategory, filterCard]);

  const monthChartData = useMemo(
    () =>
      allMonthKeys.map(key => {
        const income = monthConfigs?.[key]?.income ?? config.monthlyIncome;
        const monthFEs = monthConfigs?.[key]?.fixedExpenses;
        const fixed = monthFEs
          ? monthFEs.reduce((sum, fe) => sum + fe.amount, 0)
          : config.fixedExpenses.reduce((sum, fe) => sum + fe.amount, 0);
        const variable = transactions
          .filter(t => t.date.startsWith(key) && t.amount > 0 && t.category !== 'Carry Over')
          .reduce((sum, t) => sum + t.amount, 0);
        const refunds = transactions
          .filter(t => t.date.startsWith(key) && t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return {
          month: keyToShortLabel(key),
          income: Math.round(income * 100) / 100,
          spending: Math.round((variable + fixed - refunds) * 100) / 100,
          variable: Math.round(variable * 100) / 100,
          fixed: Math.round(fixed * 100) / 100,
        };
      }),
    [allMonthKeys, transactions, config]
  );

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount > 0 && t.category && t.category !== 'Carry Over') {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      }
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 12);
  }, [transactions]);

  const fixedExpenseChartData = useMemo(
    () =>
      allMonthKeys.map(key => {
        const point: Record<string, string | number> = { month: keyToShortLabel(key) };
        config.fixedExpenses.forEach(fe => {
          const monthFE = monthConfigs?.[key]?.fixedExpenses?.find(mfe => mfe.name === fe.name);
          point[fe.name] = monthFE?.amount ?? fe.amount;
        });
        return point;
      }),
    [allMonthKeys, config]
  );

  const hasFilters = search.trim() !== '' || selectedMonths.size > 0 || filterCategory !== '' || filterCard !== '' || sortBy !== 'date-desc';

  function clearFilters() {
    setSearch('');
    setFilterCategory('');
    setFilterCard('');
    setSortBy('date-desc');
    setSelectedMonths(new Set());
  }

  function toggleMonth(key: string) {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const totalSpend = filtered.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalRefunds = filtered.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  async function saveIncome(monthKey: string) {
    const val = parseFloat(incomeDraft);
    if (!val || val < 0) { setEditingIncomeMonth(null); return; }
    setSavingIncome(true);
    try {
      if (val === config.monthlyIncome && !incomeNoteDraft.trim()) {
        await onDeleteMonthlyIncomeOverride(monthKey);
      } else {
        await onSetMonthlyIncomeOverride(monthKey, val, incomeNoteDraft.trim() || undefined);
      }
      setEditingIncomeMonth(null);
    } finally { setSavingIncome(false); }
  }

  async function saveFixed(monthKey: string, feName: string) {
    const val = parseFloat(fixedDraft);
    if (isNaN(val) || val < 0) { setEditingFixedKey(null); return; }
    setSavingFixed(true);
    try {
      const current = monthConfigs?.[monthKey]?.fixedExpenses ?? [];
      const updated = current.map(fe => fe.name === feName ? { ...fe, amount: val, note: fixedNoteDraft.trim() || undefined } : fe);
      await onSetMonthFixedExpenses(monthKey, updated);
      setEditingFixedKey(null);
    } finally { setSavingFixed(false); }
  }

  async function resetExpense(monthKey: string, feName: string) {
    const defaultAmount = config.fixedExpenses.find(fe => fe.name === feName)?.amount ?? 0;
    const fKey = `${monthKey}::${feName}`;
    setResettingFixed(fKey);
    try {
      const current = monthConfigs?.[monthKey]?.fixedExpenses ?? [];
      const updated = current.map(fe => fe.name === feName ? { name: fe.name, amount: defaultAmount } : fe);
      await onSetMonthFixedExpenses(monthKey, updated);
    } finally { setResettingFixed(null); }
  }

  async function addExpense(monthKey: string) {
    const name = addNameDraft.trim();
    const val = parseFloat(addAmountDraft);
    if (!name || !val || val < 0) { setAddingExpenseMonth(null); return; }
    setSavingAdd(true);
    try {
      const current = monthConfigs?.[monthKey]?.fixedExpenses ?? [];
      if (current.some(fe => fe.name === name)) return;
      const updated = [...current, { name, amount: val, note: addNoteDraft.trim() || undefined }];
      await onSetMonthFixedExpenses(monthKey, updated);
      setAddingExpenseMonth(null);
      setAddNameDraft('');
      setAddAmountDraft('');
      setAddNoteDraft('');
    } finally { setSavingAdd(false); }
  }

  async function removeExpense(monthKey: string, feName: string) {
    const fKey = `${monthKey}::${feName}`;
    setRemovingFixed(fKey);
    try {
      const current = monthConfigs?.[monthKey]?.fixedExpenses ?? [];
      const updated = current.filter(fe => fe.name !== feName);
      await onSetMonthFixedExpenses(monthKey, updated);
    } finally { setRemovingFixed(null); }
  }

  function openEditTxn(t: Transaction) {
    setEditingTxnId(t.id);
    setEditTxnIsRefund(t.amount < 0);
    setEditTxnForm({ date: t.date, amount: String(Math.abs(t.amount)), category: t.category, card: t.card, note: t.note });
    setEditTxnError(null);
  }

  async function handleEditTxnSave() {
    if (!editTxnForm.amount || parseFloat(editTxnForm.amount) <= 0) { setEditTxnError('Enter a valid amount'); return; }
    if (!editTxnForm.date) { setEditTxnError('Enter a date'); return; }
    setEditTxnError(null);
    setEditTxnSaving(true);
    try {
      const amount = editTxnIsRefund ? -parseFloat(editTxnForm.amount) : parseFloat(editTxnForm.amount);
      await onEdit(editingTxnId!, { date: editTxnForm.date, amount, category: editTxnForm.category, card: editTxnForm.card, note: editTxnForm.note });
      setEditingTxnId(null);
    } finally {
      setEditTxnSaving(false);
    }
  }

  async function handleDeleteTxn(id: string) {
    setDeletingTxnId(id);
    try { await onDelete(id); }
    finally { setDeletingTxnId(null); }
  }

  if (isLoading) {
    return (
      <div className={s.spinner}>
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.subNav}>
        {(['transactions', 'charts', 'edit-months'] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`${s.subNavBtn} ${subTab === t ? s.subNavBtnActive : ''}`}
          >
            {t === 'transactions' ? 'All Transactions' : t === 'charts' ? 'Charts' : 'Monthly Config'}
          </button>
        ))}
      </div>

      {subTab === 'transactions' && (
        <div>
          <div className={s.filters}>
            <div className={s.searchWrap}>
              <svg
                viewBox="0 0 16 16" width="14" height="14" fill="none"
                stroke="#aaa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                className={s.searchIcon}
              >
                <circle cx="6.5" cy="6.5" r="5" />
                <line x1="10.5" y1="10.5" x2="14" y2="14" />
              </svg>
              <input
                type="text"
                placeholder="Search category, note, card…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`${s.input} ${s.searchInput}`}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className={s.searchClear}>×</button>
              )}
            </div>

            <div className={s.filterRow}>
              {allMonthKeys.length > 0 && (
                <div>
                  <label className={s.filterLabel}>Month</label>
                  <div className={s.monthDropdownWrap} ref={monthDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setMonthDropdownOpen(o => !o)}
                      className={`${s.selectBtn} ${selectedMonths.size > 0 ? s.monthDropdownBtnActive : ''}`}
                    >
                      <span className={s.selectBtnText}>
                        {selectedMonths.size === 0
                          ? 'All months'
                          : selectedMonths.size === 1
                            ? keyToFullLabel([...selectedMonths][0])
                            : `${selectedMonths.size} months selected`}
                      </span>
                      <svg
                        viewBox="0 0 10 6" width="10" height="10" fill="none"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, transition: 'transform 0.15s', transform: monthDropdownOpen ? 'rotate(180deg)' : 'none' }}
                      >
                        <path d="M1 1l4 4 4-4" />
                      </svg>
                    </button>
                    {monthDropdownOpen && (
                      <div className={s.monthDropdown}>
                        <input
                          type="text"
                          placeholder="Search months…"
                          value={monthSearch}
                          onChange={e => setMonthSearch(e.target.value)}
                          className={s.monthDropdownSearch}
                          autoFocus
                        />
                        <div className={s.monthDropdownList}>
                          <button
                            className={`${s.monthDropdownOption} ${selectedMonths.size === 0 ? s.monthDropdownOptionActive : ''}`}
                            onClick={() => setSelectedMonths(new Set())}
                          >
                            All months
                          </button>
                          {filteredMonthKeys.map(key => (
                            <button
                              key={key}
                              className={`${s.monthDropdownOption} ${selectedMonths.has(key) ? s.monthDropdownOptionActive : ''}`}
                              onClick={() => toggleMonth(key)}
                            >
                              <span className={s.monthDropdownCheck}>{selectedMonths.has(key) ? '✓' : ''}</span>
                              {keyToFullLabel(key)}
                            </button>
                          ))}
                          {filteredMonthKeys.length === 0 && (
                            <div className={s.monthDropdownEmpty}>No months found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className={s.filterLabel}>Sort</label>
                <CustomSelect
                  value={sortBy}
                  onChange={v => setSortBy(v as SortBy)}
                  options={[
                    { label: 'Date (newest)', value: 'date-desc' },
                    { label: 'Date (oldest)', value: 'date-asc' },
                    { label: 'Amount (high → low)', value: 'amount-desc' },
                    { label: 'Amount (low → high)', value: 'amount-asc' },
                  ]}
                />
              </div>
              <div>
                <label className={s.filterLabel}>Category</label>
                <CustomSelect
                  value={filterCategory}
                  onChange={setFilterCategory}
                  options={[
                    { label: 'All', value: '' },
                    ...uniqueCategories.map(c => ({ label: c, value: c })),
                  ]}
                />
              </div>
              <div>
                <label className={s.filterLabel}>Card</label>
                <CustomSelect
                  value={filterCard}
                  onChange={setFilterCard}
                  options={[
                    { label: 'All', value: '' },
                    ...uniqueCards.map(c => ({ label: c, value: c })),
                  ]}
                />
              </div>
            </div>

            {hasFilters && (
              <div className={s.filterSummary}>
                <button type="button" onClick={clearFilters} className={s.clearBtn}>
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <div className={s.summary}>
            <span>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
            <span className={s.summarySep}>·</span>
            <span>Total: <b style={{ color: '#1a1a1a' }}>{fmt(totalSpend)}</b></span>
            {totalRefunds > 0 && (
              <>
                <span className={s.summarySep}>·</span>
                <span>Refunds: <b className={s.summaryRefund}>{`−${fmt(totalRefunds)}`}</b></span>
              </>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className={s.empty}>No transactions found</div>
          ) : (
            <div>
              {filtered.map((t, i) => {
                const isRefund = t.amount < 0;
                const monthKey = t.date.slice(0, 7);
                const prevMonthKey = i > 0 ? filtered[i - 1].date.slice(0, 7) : null;
                const showHeader = sortBy.startsWith('date') && monthKey !== prevMonthKey;
                return (
                  <div key={t.id}>
                    {showHeader && (
                      <div className={s.monthHeader}>{keyToFullLabel(monthKey)}</div>
                    )}
                    {editingTxnId === t.id ? (
                      <div className={s.txnEditForm}>
                        <div className={s.txnEditGrid}>
                          <div>
                            <label className={s.filterLabel}>Date</label>
                            <input type="date" value={editTxnForm.date} onChange={e => setEditTxnForm(f => ({ ...f, date: e.target.value }))} className={s.input} style={{ width: '100%', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <label className={s.filterLabel}>Amount</label>
                            <input type="number" min="0" step="0.01" value={editTxnForm.amount} onChange={e => setEditTxnForm(f => ({ ...f, amount: e.target.value }))} className={s.input} style={{ width: '100%', boxSizing: 'border-box', fontFamily: MONO }} />
                          </div>
                          <div>
                            <label className={s.filterLabel}>Category</label>
                            <select value={editTxnForm.category} onChange={e => setEditTxnForm(f => ({ ...f, category: e.target.value }))} className={s.input} style={{ width: '100%', boxSizing: 'border-box' }}>
                              <option value="">— none —</option>
                              {config.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              {config.savingGoals.length > 0 && config.savingGoals.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={s.filterLabel}>Card / Payment</label>
                            <select value={editTxnForm.card} onChange={e => setEditTxnForm(f => ({ ...f, card: e.target.value }))} className={s.input} style={{ width: '100%', boxSizing: 'border-box' }}>
                              <option value="">— none —</option>
                              {config.cards.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label className={s.filterLabel}>Note</label>
                          <input type="text" value={editTxnForm.note} onChange={e => setEditTxnForm(f => ({ ...f, note: e.target.value }))} className={s.input} placeholder="e.g. Grocery run" style={{ width: '100%', boxSizing: 'border-box' }} />
                        </div>
                        {editTxnError && <div style={{ fontSize: 12, color: '#c0392b', marginBottom: 8 }}>{editTxnError}</div>}
                        <div className={s.txnEditActions}>
                          <div style={{ display: 'flex', border: '1px solid #d8d8d8', borderRadius: 999, overflow: 'hidden', fontSize: 12 }}>
                            {(['Expense', 'Refund'] as const).map(label => {
                              const active = label === 'Refund' ? editTxnIsRefund : !editTxnIsRefund;
                              return (
                                <button key={label} type="button" onClick={() => setEditTxnIsRefund(label === 'Refund')}
                                  style={{ padding: '5px 12px', border: 'none', background: active ? (label === 'Refund' ? '#0F9D58' : '#1a1a1a') : 'transparent', color: active ? '#fff' : '#888', cursor: 'pointer', fontWeight: active ? 600 : 400 }}>
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                          <button type="button" onClick={() => setEditingTxnId(null)} className={s.txnEditCancelBtn}>Cancel</button>
                          <button type="button" onClick={handleEditTxnSave} disabled={editTxnSaving} className={s.txnEditSaveBtn}>{editTxnSaving ? 'Saving…' : 'Save'}</button>
                        </div>
                      </div>
                    ) : (
                      <div className={s.txnRow}>
                        <div className={s.txnBody}>
                          <div className={s.txnPrimary}>
                            <span>{t.category || <span className={s.txnNoCategory}>No category</span>}</span>
                            {isRefund && <span className={s.txnRefundBadge}>Refund</span>}
                            {t.note && <span className={s.txnNote}>· {t.note}</span>}
                          </div>
                          <div className={s.txnMeta}>
                            {t.date}{t.card ? ` · ${t.card}` : ''}
                          </div>
                        </div>
                        <div
                          className={`${s.txnAmount} ${isRefund ? s.txnAmountRefund : ''}`}
                          style={{ fontFamily: MONO }}
                        >
                          {isRefund ? `−${fmt(Math.abs(t.amount))}` : fmt(t.amount)}
                        </div>
                        <button onClick={() => openEditTxn(t)} className={s.txnEditBtn} title="Edit">
                          <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteTxn(t.id)} disabled={deletingTxnId === t.id} className={s.txnDeleteBtn} title="Delete">
                          {deletingTxnId === t.id ? '…' : '×'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'edit-months' && (
        <div className={s.editMonths}>
          <div className={s.searchWrap} style={{ marginBottom: 16 }}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#aaa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={s.searchIcon}>
              <circle cx="6.5" cy="6.5" r="5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
            <input
              type="text"
              placeholder="Search months…"
              value={editMonthSearch}
              onChange={e => setEditMonthSearch(e.target.value)}
              className={`${s.input} ${s.searchInput}`}
            />
            {editMonthSearch && (
              <button type="button" onClick={() => setEditMonthSearch('')} className={s.searchClear}>×</button>
            )}
          </div>
          {editMonthKeys.length === 0 ? (
            <div className={s.empty}>{Object.keys(monthConfigs ?? {}).length === 0 ? 'No months found' : 'No months match'}</div>
          ) : editMonthKeys.map(monthKey => {
            const mc = monthConfigs?.[monthKey];
            const income = mc?.income ?? config.monthlyIncome;
            const hasIncomeOverride = mc?.income !== undefined && mc.income !== config.monthlyIncome;
            const incomeNote = mc?.incomeNote;

            const globalNames = new Set(config.fixedExpenses.map(fe => fe.name));
            const allExpenses = mc?.fixedExpenses ?? [];

            return (
              <div key={monthKey} className={s.editMonthCard}>
                <div className={s.editMonthTitle}>{keyToFullLabel(monthKey)}</div>

                {/* Income row */}
                <div className={s.editRow}>
                  <span className={s.editRowLabel}>Income</span>
                  {editingIncomeMonth === monthKey ? (
                    <div className={s.editInlineForm}>
                      <span>$</span>
                      <input
                        autoFocus type="number" min="0" step="1"
                        value={incomeDraft}
                        onChange={e => setIncomeDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveIncome(monthKey); if (e.key === 'Escape') setEditingIncomeMonth(null); }}
                        className={s.editInput}
                      />
                      <input
                        type="text" placeholder="Note (optional)"
                        value={incomeNoteDraft}
                        onChange={e => setIncomeNoteDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveIncome(monthKey); if (e.key === 'Escape') setEditingIncomeMonth(null); }}
                        className={s.editNoteInput}
                      />
                      <button onClick={() => saveIncome(monthKey)} disabled={savingIncome} className={s.editSaveBtn}>
                        {savingIncome ? '…' : 'Save'}
                      </button>
                      {hasIncomeOverride && (
                        <button
                          onClick={async () => { setResettingIncome(monthKey); try { await onDeleteMonthlyIncomeOverride(monthKey); setEditingIncomeMonth(null); } finally { setResettingIncome(null); } }}
                          disabled={resettingIncome === monthKey}
                          className={s.editResetBtn}
                        >
                          {resettingIncome === monthKey ? '…' : 'Reset'}
                        </button>
                      )}
                      <button onClick={() => setEditingIncomeMonth(null)} className={s.editCancelBtn}>Cancel</button>
                    </div>
                  ) : (
                    <div className={s.editRowValue}>
                      {hasIncomeOverride && <span className={s.editCustomBadge}>custom</span>}
                      <span>${income.toLocaleString()}</span>
                      {incomeNote && <span className={s.editNote}>{incomeNote}</span>}
                      <button
                        onClick={() => { setIncomeDraft(String(income)); setIncomeNoteDraft(incomeNote ?? ''); setEditingIncomeMonth(monthKey); }}
                        className={s.editBtn} title="Edit income"
                      >
                        <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Fixed expense rows */}
                {allExpenses.map(fe => {
                  const fKey = `${monthKey}::${fe.name}`;
                  const isGlobal = globalNames.has(fe.name);
                  const globalDefault = config.fixedExpenses.find(g => g.name === fe.name)?.amount;
                  const hasOverride = isGlobal && globalDefault !== undefined && fe.amount !== globalDefault;

                  return (
                    <div key={fe.name} className={s.editRow}>
                      <span className={s.editRowLabel}>{fe.name}</span>
                      {editingFixedKey === fKey ? (
                        <div className={s.editInlineForm}>
                          <span>$</span>
                          <input
                            autoFocus type="number" min="0" step="1"
                            value={fixedDraft}
                            onChange={e => setFixedDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveFixed(monthKey, fe.name); if (e.key === 'Escape') setEditingFixedKey(null); }}
                            className={s.editInput}
                          />
                          <input
                            type="text" placeholder="Note (optional)"
                            value={fixedNoteDraft}
                            onChange={e => setFixedNoteDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveFixed(monthKey, fe.name); if (e.key === 'Escape') setEditingFixedKey(null); }}
                            className={s.editNoteInput}
                          />
                          <button onClick={() => saveFixed(monthKey, fe.name)} disabled={savingFixed} className={s.editSaveBtn}>
                            {savingFixed ? '…' : 'Save'}
                          </button>
                          {hasOverride && (
                            <button
                              onClick={() => { setEditingFixedKey(null); resetExpense(monthKey, fe.name); }}
                              disabled={resettingFixed === fKey}
                              className={s.editResetBtn}
                            >
                              {resettingFixed === fKey ? '…' : 'Reset'}
                            </button>
                          )}
                          <button onClick={() => setEditingFixedKey(null)} className={s.editCancelBtn}>Cancel</button>
                        </div>
                      ) : (
                        <div className={s.editRowValue}>
                          {hasOverride && <span className={s.editCustomBadge}>custom</span>}
                          <span>${fe.amount.toLocaleString()}</span>
                          {fe.note && <span className={s.editNote}>{fe.note}</span>}
                          <button
                            onClick={() => { setFixedDraft(String(fe.amount)); setFixedNoteDraft(fe.note ?? ''); setEditingFixedKey(fKey); }}
                            className={s.editBtn} title={`Edit ${fe.name}`}
                          >
                            <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeExpense(monthKey, fe.name)}
                            disabled={removingFixed === fKey}
                            className={s.editRemoveBtn}
                            title={`Remove ${fe.name}`}
                          >
                            {removingFixed === fKey ? '…' : (
                              <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add expense form / button */}
                {addingExpenseMonth === monthKey ? (
                  <div className={s.editAddForm}>
                    <input
                      autoFocus type="text" placeholder="Expense name"
                      value={addNameDraft}
                      onChange={e => setAddNameDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addExpense(monthKey); if (e.key === 'Escape') setAddingExpenseMonth(null); }}
                      className={s.editAddNameInput}
                    />
                    <span>$</span>
                    <input
                      type="number" min="0" step="1" placeholder="Amount"
                      value={addAmountDraft}
                      onChange={e => setAddAmountDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addExpense(monthKey); if (e.key === 'Escape') setAddingExpenseMonth(null); }}
                      className={s.editInput}
                    />
                    <input
                      type="text" placeholder="Note (optional)"
                      value={addNoteDraft}
                      onChange={e => setAddNoteDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addExpense(monthKey); if (e.key === 'Escape') setAddingExpenseMonth(null); }}
                      className={s.editNoteInput}
                    />
                    <button onClick={() => addExpense(monthKey)} disabled={savingAdd} className={s.editSaveBtn}>
                      {savingAdd ? '…' : 'Add'}
                    </button>
                    <button onClick={() => setAddingExpenseMonth(null)} className={s.editCancelBtn}>Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddNameDraft(''); setAddAmountDraft(''); setAddNoteDraft(''); setAddingExpenseMonth(monthKey); }}
                    className={s.editAddBtn}
                  >
                    + Add expense
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'charts' && (
        <div className={s.charts}>

          <div className={s.chartSection}>
            <div className={s.chartTitle}>Income vs Spending</div>
            {monthChartData.length === 0 ? (
              <div className={s.chartEmpty}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthChartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => yAxisFmt(Number(v))} />
                  <Tooltip formatter={(val) => fmt(Number(val))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Income" fill="#d4d4d4" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="spending" name="Spending" fill="#1a1a1a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={s.chartSection}>
            <div className={s.chartTitle}>Spending by Category</div>
            {categoryData.length === 0 ? (
              <div className={s.chartEmpty}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, categoryData.length * 30)}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 4, right: 60, bottom: 4, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(val) => fmt(Number(val))} />
                  <Bar dataKey="amount" name="Spending" fill="#1a1a1a" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={s.chartSection}>
            <div className={s.chartTitle}>Fixed Expenses Over Time</div>
            {config.fixedExpenses.length === 0 || allMonthKeys.length === 0 ? (
              <div className={s.chartEmpty}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={fixedExpenseChartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => yAxisFmt(Number(v))} />
                  <Tooltip formatter={(val) => fmt(Number(val))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {config.fixedExpenses.map((fe, i) => (
                    <Line
                      key={fe.id}
                      type="monotone"
                      dataKey={fe.name}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={s.chartSection}>
            <div className={s.chartTitle}>Monthly Spending Breakdown</div>
            {monthChartData.length === 0 ? (
              <div className={s.chartEmpty}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthChartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => yAxisFmt(Number(v))} />
                  <Tooltip formatter={(val) => fmt(Number(val))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="variable" name="Variable" stroke="#1a1a1a" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="fixed" name="Fixed" stroke="#888" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
