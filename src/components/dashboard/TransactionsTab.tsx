'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Config } from '@/lib/store/useStore';
import s from './TransactionsTab.module.css';

const MONO = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  transactions: Transaction[];
  config: Config;
  isLoading: boolean;
  onAdd: (t: Omit<Transaction, 'id'>) => Promise<string>;
  onDelete: (id: string) => Promise<void>;
}

type SortBy = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export default function TransactionsTab({ transactions, config, isLoading, onAdd, onDelete }: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [isRefund, setIsRefund] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    amount: '',
    category: '',
    card: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCard, setFilterCard] = useState('');

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthFiltered = useMemo(
    () =>
      transactions.filter((t) => {
        const [y, m] = t.date.split('-').map(Number);
        return y === viewYear && m - 1 === viewMonth;
      }),
    [transactions, viewMonth, viewYear],
  );

  const monthTotal = useMemo(() => monthFiltered.reduce((s, t) => s + t.amount, 0), [monthFiltered]);

  const uniqueCategories = useMemo(
    () => [...new Set(monthFiltered.map((t) => t.category).filter(Boolean))].sort(),
    [monthFiltered],
  );
  const uniqueCards = useMemo(
    () => [...new Set(monthFiltered.map((t) => t.card).filter(Boolean))].sort(),
    [monthFiltered],
  );

  const displayed = useMemo(() => {
    let result = [...monthFiltered];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.category.toLowerCase().includes(q) ||
          t.note.toLowerCase().includes(q) ||
          t.card.toLowerCase().includes(q),
      );
    }

    if (filterCategory) result = result.filter((t) => t.category === filterCategory);
    if (filterCard) result = result.filter((t) => t.card === filterCard);

    result.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      return a.amount - b.amount;
    });

    return result;
  }, [monthFiltered, search, filterCategory, filterCard, sortBy]);

  const displayedTotal = useMemo(() => displayed.reduce((s, t) => s + t.amount, 0), [displayed]);

  const hasFilters = search.trim() !== '' || filterCategory !== '' || filterCard !== '' || sortBy !== 'date-desc';

  function clearFilters() {
    setSearch('');
    setFilterCategory('');
    setFilterCard('');
    setSortBy('date-desc');
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  const maxMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
  const maxYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

  function nextMonth() {
    if (viewYear > maxYear || (viewYear === maxYear && viewMonth >= maxMonth)) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const isAtMax = viewYear === maxYear && viewMonth === maxMonth;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { setFormError('Enter a valid amount'); return; }
    if (!form.date) { setFormError('Enter a date'); return; }
    setFormError(null);
    setSaving(true);
    try {
      const rawAmount = parseFloat(form.amount);
      const amount = isRefund ? -rawAmount : rawAmount;
      const tempId = await onAdd({ date: form.date, amount, category: form.category, card: form.card, note: form.note });
      setForm({ date: todayISO(), amount: '', category: '', card: '', note: '' });
      setIsRefund(false);
      setNewId(tempId);
      setTimeout(() => setNewId(null), 600);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await onDelete(id); }
    finally { setDeletingId(null); }
  }

  function CustomSelect({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string; disabled?: boolean; divider?: boolean }[];
  }) {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      function onDown(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      }
      document.addEventListener('mousedown', onDown);
      return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    const selected = options.find((o) => !o.disabled && !o.divider && o.value === value);

    return (
      <div ref={ref} className={s.selectWrap}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={s.selectBtn}
        >
          <span className={`${s.selectBtnText} ${!selected ? s.selectBtnTextPlaceholder : ''}`}>
            {selected ? selected.label : '— none —'}
          </span>
          <svg
            viewBox="0 0 10 6" width="10" height="10" fill="none"
            stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
          >
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>

        {open && (
          <div className={s.selectDropdown}>
            {options.map((opt, i) => {
              if (opt.divider) {
                return (
                  <div
                    key={i}
                    className={`${s.selectDivider} ${i > 0 ? s.selectDividerBordered : ''}`}
                  >
                    {opt.label}
                  </div>
                );
              }
              const isSelected = opt.value === value;
              const isHovered = hovered === `${i}`;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHovered(`${i}`)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`${s.selectOption} ${isHovered ? s.selectOptionHovered : ''} ${isSelected ? s.selectOptionSelected : ''}`}
                >
                  {opt.label}
                  {isSelected && (
                    <svg viewBox="0 0 12 10" width="12" height="10" fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 5l3.5 3.5L11 1" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={s.root}>
      <style>{`@keyframes txn-slide-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Add transaction form */}
      <form onSubmit={handleAdd} className={s.form}>
        <div className={s.formHeader}>
          <span className={s.formTitle}>Add transaction</span>
          <div className={s.typeToggle}>
            {(['Expense', 'Refund'] as const).map((label) => {
              const active = label === 'Refund' ? isRefund : !isRefund;
              const activeClass = active
                ? label === 'Refund' ? s.typeToggleBtnRefundActive : s.typeToggleBtnActive
                : '';
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsRefund(label === 'Refund')}
                  className={`${s.typeToggleBtn} ${activeClass}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={s.formGrid}>
          <div className={s.formField}>
            <label className={s.formLabel}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className={s.input}
              required
            />
          </div>
          <div className={s.formField}>
            <label className={s.formLabel}>Amount</label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className={`${s.input} ${s.inputMono}`}
              required
            />
          </div>
          <div className={s.formField}>
            <label className={s.formLabel}>Category</label>
            <CustomSelect
              value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
              options={[
                { label: '— none —', value: '' },
                ...config.categories.map((c) => ({ label: c.name, value: c.name })),
                ...(config.savingGoals.length > 0 ? [
                  { label: 'Saving goals', value: '', divider: true },
                  ...config.savingGoals.map((g) => ({ label: g.name, value: g.name })),
                ] : []),
              ]}
            />
          </div>
          <div className={s.formField}>
            <label className={s.formLabel}>Card / Payment</label>
            <CustomSelect
              value={form.card}
              onChange={(v) => setForm((f) => ({ ...f, card: v }))}
              options={[
                { label: '— none —', value: '' },
                ...config.cards.map((c) => ({ label: c.name, value: c.name })),
              ]}
            />
          </div>
        </div>

        <div className={s.formNoteField}>
          <label className={s.formLabel}>Note (optional)</label>
          <input
            type="text"
            placeholder="e.g. Grocery run"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className={s.input}
          />
        </div>

        {formError && <div className={s.formError}>{formError}</div>}
        <div className={s.formActions}>
          <button
            type="submit"
            disabled={saving}
            className={`${s.btnPrimary} ${saving ? s.btnPrimaryDisabled : ''}`}
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>

      {/* Month nav */}
      <div className={s.monthNav}>
        <div className={s.monthNavInner}>
          <button onClick={prevMonth} className={s.monthNavBtn}>‹</button>
          <span className={s.monthLabel}>{monthLabel}</span>
          <button
            onClick={nextMonth}
            disabled={isAtMax}
            className={`${s.monthNavBtn} ${isAtMax ? s.monthNavBtnDisabled : ''}`}
          >›</button>
        </div>
        <span className={s.monthCount}>{monthFiltered.length} items · {fmt(monthTotal)}</span>
      </div>

      {/* Search, sort, filter controls */}
      {!isLoading && monthFiltered.length > 0 && (
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
              onChange={(e) => setSearch(e.target.value)}
              className={`${s.input} ${s.searchInput}`}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className={s.searchClear}>×</button>
            )}
          </div>

          <div className={s.filterRow}>
            <div>
              <label className={s.filterLabel}>Sort</label>
              <CustomSelect
                value={sortBy}
                onChange={(v) => setSortBy(v as SortBy)}
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
                  ...uniqueCategories.map((c) => ({ label: c, value: c })),
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
                  ...uniqueCards.map((c) => ({ label: c, value: c })),
                ]}
              />
            </div>
          </div>

          {hasFilters && (
            <div className={s.filterSummary}>
              <span className={s.filterCount}>
                {displayed.length} of {monthFiltered.length} · {fmt(displayedTotal)}
              </span>
              <button type="button" onClick={clearFilters} className={s.clearBtn}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transaction list */}
      {isLoading ? (
        <div className={s.listSpinner}>
          <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className={s.listEmpty}>
          {monthFiltered.length === 0 ? `No transactions in ${monthLabel}` : 'No transactions match your filters'}
        </div>
      ) : (
        <div className={s.list}>
          {displayed.map((t) => (
            <div
              key={t.id}
              className={s.txnRow}
              style={{ animation: t.id === newId ? 'txn-slide-in 0.35s ease' : undefined }}
            >
              <div className={s.txnBody}>
                <div className={s.txnPrimary}>
                  <span>{t.category || <span className={s.txnNoCategory}>No category</span>}</span>
                  {t.amount < 0 && <span className={s.txnRefundBadge}>Refund</span>}
                  {t.note && <span className={s.txnNote}>· {t.note}</span>}
                </div>
                <div className={s.txnMeta}>
                  {t.date}{t.card ? ` · ${t.card}` : ''}
                </div>
              </div>
              <div
                className={`${s.txnAmount} ${t.amount < 0 ? s.txnAmountRefund : ''}`}
                style={{ fontFamily: MONO }}
              >
                {t.amount < 0 ? `−${fmt(Math.abs(t.amount))}` : fmt(t.amount)}
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={deletingId === t.id}
                className={s.txnDeleteBtn}
                title="Delete"
              >
                {deletingId === t.id ? '…' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
