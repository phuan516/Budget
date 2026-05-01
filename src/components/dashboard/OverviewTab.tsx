'use client';

import { useMemo, useState } from 'react';
import { Transaction, Config } from '@/lib/store/useStore';

const ACCENT = 'oklch(0.65 0.13 150)';
const WARN = 'oklch(0.72 0.12 55)';
const DANGER = 'oklch(0.58 0.18 25)';
const INK = '#1a1a1a';
const INK3 = '#888';
const LINE2 = '#ececec';

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

interface Props {
  transactions: Transaction[];
  config: Config;
  isLoading: boolean;
  onSetMonthlyIncomeOverride: (monthKey: string, amount: number) => Promise<void>;
  onDeleteMonthlyIncomeOverride: (monthKey: string) => Promise<void>;
}

export default function OverviewTab({ transactions, config, isLoading, onSetMonthlyIncomeOverride, onDeleteMonthlyIncomeOverride }: Props) {
  const now = new Date();
  const today = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthTxns = useMemo(
    () =>
      transactions.filter((t) => {
        const [y, m] = t.date.split('-').map(Number);
        return y === currentYear && m - 1 === currentMonth;
      }),
    [transactions, currentMonth, currentYear],
  );

  const totalSpent = useMemo(() => monthTxns.reduce((s, t) => s + t.amount, 0), [monthTxns]);

  const dailyTotals = useMemo(() => {
    const map: Record<string, { amount: number; entryCount: number }> = {};
    monthTxns.forEach((t) => {
      const day = parseInt(t.date.split('-')[2], 10);
      const key = String(day);
      if (!map[key]) map[key] = { amount: 0, entryCount: 0 };
      map[key].amount += t.amount;
      map[key].entryCount += 1;
    });
    return map;
  }, [monthTxns]);

  const spentToday = dailyTotals[String(today)]?.amount ?? 0;

  const spentThisWeek = useMemo(() => {
    const dow = now.getDay();
    const daysFromMon = dow === 0 ? 6 : dow - 1;
    let total = 0;
    for (let d = Math.max(1, today - daysFromMon); d <= today; d++) {
      total += dailyTotals[String(d)]?.amount ?? 0;
    }
    return total;
  }, [dailyTotals, today, now]);

  const dailyAvg = today > 0 ? totalSpent / today : 0;
  const projected = today > 0 ? Math.round((totalSpent / today) * daysInMonth / 10) * 10 : 0;

  const thisMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const income = config.monthlyIncomeOverrides?.[thisMonthKey] ?? config.monthlyIncome;
  const totalFixed = config.fixedExpenses.reduce((s, fe) => s + fe.amount, 0);
  const totalCommitted = totalSpent + totalFixed;
  const pct = income > 0 ? (totalCommitted / income) * 100 : 0;
  const isOver = pct >= 100;

  const maxDailySpend = useMemo(
    () => Math.max(0, ...Object.values(dailyTotals).map((d) => d.amount)),
    [dailyTotals],
  );

  const firstDayOfWeek = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }, [currentYear, currentMonth]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.forEach((t) => {
      const cat = t.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    const total = totalCommitted;
    const txnEntries = Object.entries(map)
      .map(([name, amount]) => ({
        name, amount, isFixed: false,
        pct: total > 0 ? (amount / total) * 100 : 0,
        breakdown: null as { name: string; amount: number }[] | null,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 7);

    if (config.fixedExpenses.length > 0) {
      txnEntries.push({
        name: 'Fixed Expenses',
        amount: totalFixed,
        isFixed: true,
        pct: total > 0 ? (totalFixed / total) * 100 : 0,
        breakdown: config.fixedExpenses.map((fe) => ({ name: fe.name, amount: fe.amount })),
      });
    }

    return txnEntries.sort((a, b) => b.amount - a.amount);
  }, [monthTxns, totalCommitted, totalFixed, config.fixedExpenses]);

  const { biggestDay, cheapestDay, noSpendStreak } = useMemo(() => {
    const entries = Object.entries(dailyTotals).map(([day, data]) => ({ day: parseInt(day), ...data }));
    const biggest = entries.length > 0 ? entries.reduce((a, b) => (a.amount >= b.amount ? a : b)) : null;
    const cheapest = entries.length > 0 ? entries.reduce((a, b) => (a.amount <= b.amount ? a : b)) : null;
    let streak = 0;
    for (let d = today; d >= 1; d--) {
      if (!dailyTotals[String(d)] || dailyTotals[String(d)].amount === 0) streak++;
      else break;
    }
    return { biggestDay: biggest, cheapestDay: cheapest, noSpendStreak: streak };
  }, [dailyTotals, today]);

  const savingGoalProgress = useMemo(() => {
    const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
    const monthsCount = (() => {
      if (months.size === 0) return 0;
      const sorted = [...months].sort();
      const [ey, em] = sorted[0].split('-').map(Number);
      return (now.getFullYear() - ey) * 12 + (now.getMonth() + 1 - em) + 1;
    })();
    return config.savingGoals.map((g) => {
      const txnSaved = transactions.filter((t) => t.category === g.name).reduce((s, t) => s + t.amount, 0);
      const matchingFixed = config.fixedExpenses.find((fe) => fe.name.toLowerCase() === g.name.toLowerCase());
      const fixedSaved = matchingFixed ? matchingFixed.amount * monthsCount : 0;
      const saved = (g.initialAmount ?? 0) + txnSaved + fixedSaved;
      const pct = g.amount > 0 ? Math.min(100, (saved / g.amount) * 100) : 0;
      return { ...g, saved, pct, hasFixed: !!matchingFixed };
    });
  }, [transactions, config.savingGoals, config.fixedExpenses]);

  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState('');
  const [savingIncomeDraft, setSavingIncomeDraft] = useState(false);

  const hasOverride = !!config.monthlyIncomeOverrides?.[thisMonthKey];

  async function handleSaveIncomeOverride() {
    const val = parseFloat(incomeDraft);
    if (!val || val < 0) { setEditingIncome(false); return; }
    setSavingIncomeDraft(true);
    try {
      if (val === config.monthlyIncome) {
        if (hasOverride) await onDeleteMonthlyIncomeOverride(thisMonthKey);
      } else {
        await onSetMonthlyIncomeOverride(thisMonthKey, val);
      }
      setEditingIncome(false);
    } finally {
      setSavingIncomeDraft(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dayLabel = (day: number) =>
    new Date(currentYear, currentMonth, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{ padding: '32px 0 24px' }}>
        <div style={{ fontSize: 11, color: INK3, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
          Spent this month
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginBottom: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              fontSize: 'clamp(48px, 6vw, 80px)',
              fontWeight: 600,
              letterSpacing: -2.5,
              lineHeight: 0.9,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmt(totalCommitted)}
          </div>
          {income > 0 && (
            <div style={{ fontSize: 14, color: INK3, paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {editingIncome ? (
                <>
                  <span>/ $</span>
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="1"
                    value={incomeDraft}
                    onChange={(e) => setIncomeDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveIncomeOverride(); if (e.key === 'Escape') setEditingIncome(false); }}
                    style={{ width: 90, border: '1px solid #d8d8d8', borderRadius: 6, padding: '3px 7px', fontSize: 13, outline: 'none', fontVariantNumeric: 'tabular-nums' }}
                  />
                  <span>· {monthLabel}</span>
                  <button
                    onClick={handleSaveIncomeOverride}
                    disabled={savingIncomeDraft}
                    style={{ border: 'none', background: '#1a1a1a', color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 11, cursor: 'pointer' }}
                  >
                    {savingIncomeDraft ? '…' : 'Save'}
                  </button>
                  {hasOverride && (
                    <button
                      onClick={async () => { setSavingIncomeDraft(true); try { await onDeleteMonthlyIncomeOverride(thisMonthKey); setEditingIncome(false); } finally { setSavingIncomeDraft(false); } }}
                      disabled={savingIncomeDraft}
                      style={{ border: '1px solid #d8d8d8', background: 'none', color: '#888', padding: '3px 10px', borderRadius: 999, fontSize: 11, cursor: 'pointer' }}
                    >
                      Reset to default
                    </button>
                  )}
                  <button
                    onClick={() => setEditingIncome(false)}
                    style={{ border: 'none', background: 'none', color: '#aaa', fontSize: 11, cursor: 'pointer', padding: '3px 6px' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span>/ {fmt(income)} · {monthLabel}</span>
                  {hasOverride && (
                    <span style={{ fontSize: 10, color: '#0F9D58', background: '#e8f5e9', borderRadius: 4, padding: '1px 5px', fontWeight: 500 }}>custom</span>
                  )}
                  <button
                    onClick={() => { setIncomeDraft(String(income)); setEditingIncome(true); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                    title="Edit this month's income"
                  >
                    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ height: 4, background: LINE2, borderRadius: 2, maxWidth: 520, overflow: 'hidden' }}>
          {income > 0 && (
            <div style={{ display: 'flex', height: '100%', width: `${Math.min(100, pct)}%`, transition: 'width 0.4s' }}>
              {totalFixed > 0 && (
                <div style={{ flex: totalFixed, background: isOver ? DANGER : WARN, minWidth: 0 }} />
              )}
              {totalSpent > 0 && (
                <div style={{ flex: totalSpent, background: isOver ? DANGER : ACCENT, minWidth: 0 }} />
              )}
            </div>
          )}
        </div>
        {income > 0 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, color: INK3, maxWidth: 520 }}>
            {totalFixed > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: isOver ? DANGER : WARN, flexShrink: 0 }} />
                Fixed {fmt(totalFixed)}
              </span>
            )}
            {totalSpent > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: isOver ? DANGER : ACCENT, flexShrink: 0 }} />
                Variable {fmt(totalSpent)}
              </span>
            )}
          </div>
        )}
        {income > 0 && isOver ? (
          <div style={{ marginTop: 10, marginBottom: 14, padding: '9px 14px', background: 'oklch(0.97 0.03 25)', border: '1px solid oklch(0.88 0.07 25)', borderRadius: 8, maxWidth: 520 }}>
            <span style={{ fontSize: 13, color: DANGER }}>
              Over budget by <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(totalCommitted - income)}</strong> — overspend carried to next month
            </span>
          </div>
        ) : (
          <div style={{ marginBottom: 24 }} />
        )}
        <div
          style={{ display: 'grid', gap: 32, maxWidth: 800 }}
          className={`grid-cols-2 ${income > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}
        >
          {(
            [
              ['Today', fmt(spentToday)],
              ['This week', fmt(spentThisWeek)],
              ['Daily avg', fmt(dailyAvg)],
              ['Projected', fmt(projected)],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: INK3, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
                {value}
              </div>
            </div>
          ))}
          {income > 0 && (
            <div>
              <div style={{ fontSize: 11, color: INK3, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                Left to spend
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', color: isOver ? DANGER : ACCENT }}>
                {isOver ? `-${fmt(totalCommitted - income)}` : fmt(income - totalCommitted)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: LINE2 }} />

      {/* ── Body: heatmap + by category + saving goals ───────────── */}
      <div
        style={{ display: 'grid', gap: 40, padding: '28px 0 36px' }}
        className="grid-cols-1 xl:grid-cols-[1.3fr_1fr_1fr]"
      >
        {/* Heatmap */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: INK3 }}>Daily spend</div>
            <div style={{ fontSize: 11, color: INK3 }}>{monthTxns.length} entries</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, maxWidth: 480, overflow: 'visible' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} style={{ fontSize: 10, color: INK3, textAlign: 'center', marginBottom: 2 }}>
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const data = dailyTotals[String(day)];
              const normalized = data && maxDailySpend > 0 ? data.amount / maxDailySpend : 0;
              const alpha = data ? 0.08 + normalized * 0.9 : 0.05;
              const isFuture = day > today;
              const isToday = day === today;
              const textColor = !isFuture && alpha > 0.5 ? '#fff' : (!isFuture && alpha > 0.25 ? INK : INK3);
              const isHovered = hoveredDay === day;
              return (
                <div
                  key={day}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    aspectRatio: '1',
                    background: isFuture ? 'transparent' : `rgba(26,26,26,${alpha.toFixed(2)})`,
                    border: isFuture ? `1px solid ${LINE2}` : 'none',
                    borderRadius: 4,
                    position: 'relative',
                    fontSize: 9,
                    color: isFuture ? '#ccc' : textColor,
                    padding: 4,
                    cursor: data ? 'pointer' : 'default',
                  }}
                >
                  {day}
                  {isToday && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: ACCENT,
                      }}
                    />
                  )}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 6px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: INK,
                        color: '#fff',
                        borderRadius: 6,
                        padding: '6px 10px',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 600, marginBottom: data ? 3 : 0 }}>{dayLabel(day)}</div>
                      {data && (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(data.amount)}
                          </div>
                          <div style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>
                            {data.entryCount} {data.entryCount === 1 ? 'entry' : 'entries'}
                          </div>
                        </>
                      )}
                      {/* caret */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: `5px solid ${INK}`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 10, color: INK3 }}>
            less
            {[0.1, 0.25, 0.45, 0.7, 0.95].map((o) => (
              <div key={o} style={{ width: 11, height: 11, background: `rgba(26,26,26,${o})`, borderRadius: 2, flexShrink: 0 }} />
            ))}
            more
            <span style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{ display: 'inline-block', width: 5, height: 5, background: ACCENT, borderRadius: '50%' }}
              />
              today
            </span>
          </div>

          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 22, maxWidth: 480 }}>
            {[
              { label: 'Biggest day', value: biggestDay ? fmt(biggestDay.amount) : '—', sub: biggestDay ? dayLabel(biggestDay.day) : '' },
              { label: 'Cheapest day', value: cheapestDay ? fmt(cheapestDay.amount) : '—', sub: cheapestDay ? dayLabel(cheapestDay.day) : '' },
              { label: 'No-spend streak', value: `${noSpendStreak} day${noSpendStreak !== 1 ? 's' : ''}`, sub: 'current' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ border: `1px solid ${LINE2}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, color: INK3, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </div>
                {sub && <div style={{ fontSize: 10, color: INK3, marginTop: 1 }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* By category */}
        <div>
          <div style={{ fontSize: 12, color: INK3, marginBottom: 14 }}>By category</div>
          {categoryData.length === 0 ? (
            <div style={{ fontSize: 13, color: INK3 }}>No transactions this month</div>
          ) : (
            categoryData.map(({ name, amount, isFixed, pct, breakdown }) => (
              <div
                key={name}
                style={{ marginBottom: 14, position: 'relative' }}
                onMouseEnter={() => isFixed ? setHoveredCategory(name) : undefined}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {name}
                    {isFixed && <span style={{ fontSize: 10, color: INK3 }}>▾</span>}
                  </span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{fmt(amount)}</span>
                </div>
                <div style={{ height: 2, background: LINE2, borderRadius: 1 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: isFixed ? WARN : INK, borderRadius: 1, transition: 'width 0.4s' }} />
                </div>
                {isFixed && hoveredCategory === name && breakdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    minWidth: 180,
                    background: INK,
                    color: '#fff',
                    borderRadius: 8,
                    padding: '10px 12px',
                    zIndex: 20,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                    pointerEvents: 'none',
                  }}>
                    {breakdown.map((item) => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11, padding: '2px 0' }}>
                        <span style={{ color: '#ccc' }}>{item.name}</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Saving goals */}
        {savingGoalProgress.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: INK3, marginBottom: 14 }}>Saving goals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {savingGoalProgress.map((g) => (
                <div key={g.id} style={{ border: `1px solid ${LINE2}`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12 }}>{g.name}</span>
                    <span style={{ fontSize: 11, color: INK3, fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(g.saved)} / {fmt(g.amount)}
                    </span>
                  </div>
                  {g.hasFixed && (
                    <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>includes monthly fixed</div>
                  )}
                  <div style={{ height: 3, background: LINE2, borderRadius: 2 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${g.pct}%`,
                        background: ACCENT,
                        borderRadius: 2,
                        transition: 'width 0.4s',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: INK3, marginTop: 4, textAlign: 'right' }}>
                    {g.pct.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
