'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Config } from '@/lib/store/useStore';

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

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const isAtMax = viewYear === maxYear && viewMonth === maxMonth;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { setFormError('Enter a valid amount'); return; }
    if (!form.date) { setFormError('Enter a date'); return; }
    setFormError(null);
    setSaving(true);
    try {
      const tempId = await onAdd({ date: form.date, amount: parseFloat(form.amount), category: form.category, card: form.card, note: form.note });
      setForm({ date: todayISO(), amount: '', category: '', card: '', note: '' });
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

  const inputStyle: React.CSSProperties = {
    border: '1px solid #d8d8d8',
    borderRadius: 8,
    padding: '9px 11px',
    fontSize: 13,
    color: '#1a1a1a',
    background: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

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
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            ...inputStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            cursor: 'pointer',
            textAlign: 'left',
            paddingRight: 10,
          }}
        >
          <span style={{ color: selected ? '#1a1a1a' : '#aaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.label : '— none —'}
          </span>
          <svg viewBox="0 0 10 6" width="10" height="10" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #d8d8d8',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
            zIndex: 200,
            overflow: 'hidden',
            maxHeight: 220,
            overflowY: 'auto',
          }}>
            {options.map((opt, i) => {
              if (opt.divider) {
                return (
                  <div key={i} style={{ padding: '6px 12px 4px', fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.5, borderTop: i > 0 ? '1px solid #f0f0f0' : 'none', marginTop: i > 0 ? 4 : 0 }}>
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 12px',
                    fontSize: 13,
                    border: 'none',
                    cursor: 'pointer',
                    background: isHovered ? '#f7f7f7' : 'transparent',
                    color: '#1a1a1a',
                    fontWeight: isSelected ? 500 : 400,
                    transition: 'background 0.1s',
                  }}
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
    <div style={{ padding: '24px 0 48px' }}>
      <style>{`@keyframes txn-slide-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Add transaction form */}
      <form onSubmit={handleAdd} style={{ border: '1px solid #ececec', borderRadius: 12, padding: '18px 20px', marginBottom: 28, background: '#fafafa' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#1a1a1a' }}>Add transaction</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}
          className="max-sm:grid-cols-1">
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Amount</label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              style={{ ...inputStyle, fontFamily: MONO }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Category</label>
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
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Card / Payment</label>
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
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 5 }}>Note (optional)</label>
          <input
            type="text"
            placeholder="e.g. Grocery run"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            style={inputStyle}
          />
        </div>
        {formError && <div style={{ fontSize: 12, color: '#c0392b', marginBottom: 10 }}>{formError}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              border: 'none',
              background: saving ? '#d8d8d8' : '#1a1a1a',
              color: '#fff',
              padding: '9px 18px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#888', fontSize: 16, lineHeight: 1 }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 500, minWidth: 140, textAlign: 'center' }}>{monthLabel}</span>
          <button
            onClick={nextMonth}
            disabled={isAtMax}
            style={{ background: 'none', border: 'none', cursor: isAtMax ? 'not-allowed' : 'pointer', padding: 4, color: isAtMax ? '#d8d8d8' : '#888', fontSize: 16, lineHeight: 1 }}
          >›</button>
        </div>
        <span style={{ fontSize: 12, color: '#888', fontFamily: MONO }}>{monthFiltered.length} items · {fmt(monthTotal)}</span>
      </div>

      {/* Search, sort, filter controls */}
      {!isLoading && monthFiltered.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <svg
              viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#aaa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="6.5" cy="6.5" r="5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
            <input
              type="text"
              placeholder="Search category, note, card…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 30 }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, lineHeight: 1, padding: 2 }}
              >
                ×
              </button>
            )}
          </div>

          {/* Sort + filter row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }} className="max-sm:grid-cols-1">
            <div>
              <label style={{ fontSize: 10, color: '#aaa', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>Sort</label>
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
              <label style={{ fontSize: 10, color: '#aaa', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>Category</label>
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
              <label style={{ fontSize: 10, color: '#aaa', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>Card</label>
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

          {/* Active filter summary */}
          {hasFilters && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 12, color: '#888', fontFamily: MONO }}>
                {displayed.length} of {monthFiltered.length} · {fmt(displayedTotal)}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#888', textDecoration: 'underline', padding: 0 }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transaction list */}
      {isLoading ? (
        <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 13 }}>
          {monthFiltered.length === 0 ? `No transactions in ${monthLabel}` : 'No transactions match your filters'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {displayed.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #f0f0f0', gap: 12,
                animation: t.id === newId ? 'txn-slide-in 0.35s ease' : undefined,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#1a1a1a', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{t.category || <span style={{ color: '#aaa' }}>No category</span>}</span>
                  {t.note && <span style={{ color: '#888', fontSize: 12 }}>· {t.note}</span>}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {t.date}{t.card ? ` · ${t.card}` : ''}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', fontFamily: MONO, flexShrink: 0 }}>{fmt(t.amount)}</div>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={deletingId === t.id}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
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
