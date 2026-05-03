'use client';

import { useMemo, useState } from 'react';
import { Transaction, Config } from '@/lib/store/useStore';
import s from './OverviewTab.module.css';

const ACCENT = 'oklch(0.65 0.13 150)';
const WARN = 'oklch(0.72 0.12 55)';
const DANGER = 'oklch(0.58 0.18 25)';
const INK = '#1a1a1a';

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type MonthConfig = { income?: number; incomeNote?: string; fixedExpenses: { name: string; amount: number; note?: string }[] };

interface Props {
  transactions: Transaction[];
  config: Config;
  monthConfigs: Record<string, MonthConfig>;
  isLoading: boolean;
  onSetMonthlyIncomeOverride: (monthKey: string, amount: number, note?: string) => Promise<void>;
  onDeleteMonthlyIncomeOverride: (monthKey: string) => Promise<void>;
  onSetFixedExpenseOverride: (monthKey: string, expenseName: string, amount: number, note?: string) => Promise<void>;
  onDeleteFixedExpenseOverride: (monthKey: string, expenseName: string) => Promise<void>;
}

export default function OverviewTab({ transactions, config, monthConfigs, isLoading, onSetMonthlyIncomeOverride, onDeleteMonthlyIncomeOverride, onSetFixedExpenseOverride, onDeleteFixedExpenseOverride }: Props) {
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

  const totalSpent = useMemo(() => monthTxns.reduce((sum, t) => sum + t.amount, 0), [monthTxns]);

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
  const monthFEs = monthConfigs?.[thisMonthKey]?.fixedExpenses ?? [];
  const income = monthConfigs?.[thisMonthKey]?.income ?? config.monthlyIncome;
  const incomeNote = monthConfigs?.[thisMonthKey]?.incomeNote;
  const totalFixed = config.fixedExpenses.reduce((sum, fe) => {
    const monthFE = monthFEs.find(mfe => mfe.name === fe.name);
    return sum + (monthFE?.amount ?? fe.amount);
  }, 0);
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
        breakdown: null as { name: string; amount: number; defaultAmount: number; hasOverride: boolean; note?: string }[] | null,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 7);

    if (config.fixedExpenses.length > 0) {
      txnEntries.push({
        name: 'Monthly Expenses',
        amount: totalFixed,
        isFixed: true,
        pct: total > 0 ? (totalFixed / total) * 100 : 0,
        breakdown: config.fixedExpenses.map((fe) => {
          const monthFE = monthFEs.find(mfe => mfe.name === fe.name);
          const amt = monthFE?.amount ?? fe.amount;
          const hasOvr = monthFE !== undefined && monthFE.amount !== fe.amount;
          const note = monthFE?.note;
          return { name: fe.name, amount: amt, defaultAmount: fe.amount, hasOverride: hasOvr, note };
        }),
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
      const txnSaved = transactions.filter((t) => t.category === g.name).reduce((sum, t) => sum + t.amount, 0);
      const matchingFixed = config.fixedExpenses.find((fe) => fe.name.toLowerCase() === g.name.toLowerCase());
      const fixedSaved = matchingFixed ? matchingFixed.amount * monthsCount : 0;
      const saved = (g.initialAmount ?? 0) + txnSaved + fixedSaved;
      const goalPct = g.amount > 0 ? Math.min(100, (saved / g.amount) * 100) : 0;
      return { ...g, saved, pct: goalPct, hasFixed: !!matchingFixed };
    });
  }, [transactions, config.savingGoals, config.fixedExpenses]);

  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState('');
  const [incomeNoteDraft, setIncomeNoteDraft] = useState('');
  const [savingIncomeDraft, setSavingIncomeDraft] = useState(false);
  const [editingFixedItem, setEditingFixedItem] = useState<string | null>(null);
  const [fixedItemDraft, setFixedItemDraft] = useState('');
  const [fixedItemNoteDraft, setFixedItemNoteDraft] = useState('');
  const [savingFixedItem, setSavingFixedItem] = useState(false);
  const [resettingFixedItem, setResettingFixedItem] = useState<string | null>(null);
  const [resettingAllFixed, setResettingAllFixed] = useState(false);

  const hasOverride = income !== config.monthlyIncome;
  const hasAnyFixedOverride = config.fixedExpenses.some(fe => {
    const monthFE = monthFEs.find(mfe => mfe.name === fe.name);
    return monthFE !== undefined && monthFE.amount !== fe.amount;
  });

  async function handleSaveIncomeOverride() {
    const val = parseFloat(incomeDraft);
    if (!val || val < 0) { setEditingIncome(false); return; }
    setSavingIncomeDraft(true);
    try {
      if (val === config.monthlyIncome && !incomeNoteDraft.trim()) {
        if (hasOverride) await onDeleteMonthlyIncomeOverride(thisMonthKey);
      } else {
        await onSetMonthlyIncomeOverride(thisMonthKey, val, incomeNoteDraft.trim() || undefined);
      }
      setEditingIncome(false);
    } finally {
      setSavingIncomeDraft(false);
    }
  }

  async function handleSaveFixedItem(fe: { name: string; defaultAmount: number }) {
    const val = parseFloat(fixedItemDraft);
    if (!val || val < 0) { setEditingFixedItem(null); return; }
    setSavingFixedItem(true);
    try {
      if (val === fe.defaultAmount && !fixedItemNoteDraft.trim()) {
        // User entered the default amount — reset the month tab back to default
        await onDeleteFixedExpenseOverride(thisMonthKey, fe.name);
      } else {
        await onSetFixedExpenseOverride(thisMonthKey, fe.name, val, fixedItemNoteDraft.trim() || undefined);
      }
      setEditingFixedItem(null);
    } finally {
      setSavingFixedItem(false);
    }
  }

  async function handleResetAllFixed() {
    const overriddenNames = config.fixedExpenses
      .filter(fe => {
        const monthFE = monthFEs.find(mfe => mfe.name === fe.name);
        return monthFE !== undefined && monthFE.amount !== fe.amount;
      })
      .map(fe => fe.name);
    if (overriddenNames.length === 0) return;
    setResettingAllFixed(true);
    try {
      for (const name of overriddenNames) {
        await onDeleteFixedExpenseOverride(thisMonthKey, name);
      }
    } finally {
      setResettingAllFixed(false);
    }
  }

  if (isLoading) {
    return (
      <div className={s.spinner}>
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dayLabel = (day: number) =>
    new Date(currentYear, currentMonth, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const barColor = isOver ? DANGER : ACCENT;
  const warnColor = isOver ? DANGER : WARN;

  return (
    <div>
      {/* ── Hero ── */}
      <div className={s.hero}>
        <div className={s.heroEyebrow}>Spent this month</div>
        <div className={s.heroAmountRow}>
          <div className={s.heroAmount}>{fmt(totalCommitted)}</div>
          {income > 0 && (
            <div className={s.heroIncome}>
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
                    className={s.incomeEditInput}
                  />
                  <input
                    type="text"
                    placeholder="Note (optional)"
                    value={incomeNoteDraft}
                    onChange={(e) => setIncomeNoteDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveIncomeOverride(); if (e.key === 'Escape') setEditingIncome(false); }}
                    className={s.incomeNoteInput}
                  />
                  <span>· {monthLabel}</span>
                  <button onClick={handleSaveIncomeOverride} disabled={savingIncomeDraft} className={s.incomeBtnSave}>
                    {savingIncomeDraft ? '…' : 'Save'}
                  </button>
                  {hasOverride && (
                    <button
                      onClick={async () => { setSavingIncomeDraft(true); try { await onDeleteMonthlyIncomeOverride(thisMonthKey); setEditingIncome(false); } finally { setSavingIncomeDraft(false); } }}
                      disabled={savingIncomeDraft}
                      className={s.incomeBtnReset}
                    >
                      Reset to default
                    </button>
                  )}
                  <button onClick={() => setEditingIncome(false)} className={s.incomeBtnCancel}>Cancel</button>
                </>
              ) : (
                <>
                  <span>/ {fmt(income)} · {monthLabel}</span>
                  {hasOverride && <span className={s.customBadge}>custom</span>}
                  {hasOverride && incomeNote && (
                    <span className={s.overrideNote}>{incomeNote}</span>
                  )}
                  <button
                    onClick={() => { setIncomeDraft(String(income)); setIncomeNoteDraft(incomeNote ?? ''); setEditingIncome(true); }}
                    className={s.incomeEditBtn}
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

        <div className={s.progressTrack}>
          {income > 0 && (
            <div className={s.progressFill} style={{ width: `${Math.min(100, pct)}%` }}>
              {totalFixed > 0 && (
                <div className={s.progressSegment} style={{ flex: totalFixed, background: warnColor }} />
              )}
              {totalSpent > 0 && (
                <div className={s.progressSegment} style={{ flex: totalSpent, background: barColor }} />
              )}
            </div>
          )}
        </div>

        {income > 0 && (
          <div className={s.progressLegend}>
            {totalFixed > 0 && (
              <span className={s.progressLegendItem}>
                <span className={s.progressLegendDot} style={{ background: warnColor }} />
                Monthly {fmt(totalFixed)}
              </span>
            )}
            {totalSpent > 0 && (
              <span className={s.progressLegendItem}>
                <span className={s.progressLegendDot} style={{ background: barColor }} />
                Variable {fmt(totalSpent)}
              </span>
            )}
          </div>
        )}

        {income > 0 && isOver ? (
          <div className={s.overBudgetAlert}>
            <span style={{ color: DANGER }}>
              Over budget by <strong className={s.overBudgetAlertAmount}>{fmt(totalCommitted - income)}</strong> — overspend carried to next month
            </span>
          </div>
        ) : (
          <div className={s.heroSpacer} />
        )}

        <div
          className={`${s.statGrid} grid-cols-2 ${income > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}
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
              <div className={s.statLabel}>{label}</div>
              <div className={s.statValue}>{value}</div>
            </div>
          ))}
          {income > 0 && (
            <div>
              <div className={s.statLabel}>Left to spend</div>
              <div className={s.statValue} style={{ color: isOver ? DANGER : ACCENT }}>
                {isOver ? `-${fmt(totalCommitted - income)}` : fmt(income - totalCommitted)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={s.divider} />

      {/* ── Body ── */}
      <div className={`${s.body} grid-cols-1 xl:grid-cols-[1.3fr_1fr_1fr]`}>

        {/* Heatmap */}
        <div>
          <div className={s.heatmapHeader}>
            <div className={s.heatmapTitle}>Daily spend</div>
            <div className={s.heatmapCount}>{monthTxns.length} entries</div>
          </div>

          <div className={s.heatmapGrid}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className={s.heatmapDayLabel}>{d}</div>
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
              const textColor = !isFuture && alpha > 0.5 ? '#fff' : (!isFuture && alpha > 0.25 ? INK : '#888');
              const isHovered = hoveredDay === day;
              return (
                <div
                  key={day}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    aspectRatio: '1',
                    background: isFuture ? 'transparent' : `rgba(26,26,26,${alpha.toFixed(2)})`,
                    border: isFuture ? '1px solid #ececec' : 'none',
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
                        position: 'absolute', top: 2, right: 2,
                        width: 5, height: 5, borderRadius: '50%', background: ACCENT,
                      }}
                    />
                  )}
                  {isHovered && (
                    <div className={s.tooltip}>
                      <div className={`${s.tooltipDate} ${data ? s.tooltipDateSpaced : ''}`}>{dayLabel(day)}</div>
                      {data && (
                        <>
                          <div className={s.tooltipAmount}>{fmt(data.amount)}</div>
                          <div className={s.tooltipEntries}>{data.entryCount} {data.entryCount === 1 ? 'entry' : 'entries'}</div>
                        </>
                      )}
                      <div className={s.tooltipCaret} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={s.heatmapLegend}>
            less
            {[0.1, 0.25, 0.45, 0.7, 0.95].map((o) => (
              <div key={o} style={{ width: 11, height: 11, background: `rgba(26,26,26,${o})`, borderRadius: 2, flexShrink: 0 }} />
            ))}
            more
            <span className={s.heatmapLegendDot}>
              <span className={s.heatmapTodayDot} style={{ background: ACCENT }} />
              today
            </span>
          </div>

          <div className={s.statTiles}>
            {[
              { label: 'Biggest day', value: biggestDay ? fmt(biggestDay.amount) : '—', sub: biggestDay ? dayLabel(biggestDay.day) : '' },
              { label: 'Cheapest day', value: cheapestDay ? fmt(cheapestDay.amount) : '—', sub: cheapestDay ? dayLabel(cheapestDay.day) : '' },
              { label: 'No-spend streak', value: `${noSpendStreak} day${noSpendStreak !== 1 ? 's' : ''}`, sub: 'current' },
            ].map(({ label, value, sub }) => (
              <div key={label} className={s.statTile}>
                <div className={s.statTileLabel}>{label}</div>
                <div className={s.statTileValue}>{value}</div>
                {sub && <div className={s.statTileSub}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* By category */}
        <div>
          <div className={s.categoryTitle}>By category</div>
          {categoryData.length === 0 ? (
            <div className={s.categoryEmpty}>No transactions this month</div>
          ) : (
            categoryData.map(({ name, amount, isFixed, pct: catPct, breakdown }) => (
              <div key={name} className={s.categoryItem}>
                <div className={s.categoryRow}>
                  <span className={s.categoryName}>
                    {name}
                    {isFixed && hasAnyFixedOverride && <span className={s.customBadge}>custom</span>}
                  </span>
                  <span className={s.categoryAmountRow}>
                    {isFixed && hasAnyFixedOverride && (
                      <button
                        onClick={() => handleResetAllFixed()}
                        disabled={resettingAllFixed}
                        className={s.categoryResetBtn}
                      >
                        {resettingAllFixed ? '…' : 'Reset to default'}
                      </button>
                    )}
                    <span className={s.categoryAmount}>{fmt(amount)}</span>
                  </span>
                </div>
                <div className={s.categoryBar} style={{ marginBottom: isFixed ? 8 : 0 }}>
                  <div className={s.categoryBarFill} style={{ width: `${catPct}%`, background: isFixed ? WARN : INK }} />
                </div>
                {isFixed && breakdown && (
                  <div className={s.breakdownList}>
                    {breakdown.map((item) => (
                      <div key={item.name} className={s.breakdownItem}>
                        {editingFixedItem === item.name ? (
                          <div className={s.breakdownEditRow}>
                            <span className={s.breakdownEditName}>{item.name}</span>
                            <span className={s.breakdownEditSymbol}>$</span>
                            <input
                              autoFocus
                              type="number"
                              min="0"
                              step="1"
                              value={fixedItemDraft}
                              onChange={(e) => setFixedItemDraft(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFixedItem(item); if (e.key === 'Escape') setEditingFixedItem(null); }}
                              className={s.breakdownEditInput}
                            />
                            <input
                              type="text"
                              placeholder="Note (optional)"
                              value={fixedItemNoteDraft}
                              onChange={(e) => setFixedItemNoteDraft(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFixedItem(item); if (e.key === 'Escape') setEditingFixedItem(null); }}
                              className={s.breakdownNoteInput}
                            />
                            <button onClick={() => handleSaveFixedItem(item)} disabled={savingFixedItem} className={s.breakdownSaveBtn}>
                              {savingFixedItem ? '…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingFixedItem(null)} className={s.breakdownCancelBtn}>Cancel</button>
                          </div>
                        ) : (
                          <div className={s.breakdownViewRow}>
                            <span className={s.breakdownViewName}>
                              {item.name}
                              {item.hasOverride && item.note && (
                                <span className={s.breakdownNote}>{item.note}</span>
                              )}
                            </span>
                            <span className={s.breakdownViewRight}>
                              {item.hasOverride && (
                                <>
                                  <span className={s.customBadge}>custom</span>
                                  <button
                                    onClick={async (e) => { e.stopPropagation(); setResettingFixedItem(item.name); try { await onDeleteFixedExpenseOverride(thisMonthKey, item.name); } finally { setResettingFixedItem(null); } }}
                                    disabled={resettingFixedItem === item.name}
                                    className={s.breakdownResetBtn}
                                  >
                                    {resettingFixedItem === item.name ? '…' : 'Reset'}
                                  </button>
                                </>
                              )}
                              <span className={s.breakdownAmount}>{fmt(item.amount)}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingFixedItem(item.name); setFixedItemDraft(String(item.amount)); setFixedItemNoteDraft(item.note ?? ''); }}
                                className={s.breakdownEditBtn}
                                title={`Override ${item.name} for ${monthLabel}`}
                              >
                                <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" />
                                </svg>
                              </button>
                            </span>
                          </div>
                        )}
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
            <div className={s.goalsTitle}>Saving goals</div>
            <div className={s.goalsList}>
              {savingGoalProgress.map((g) => (
                <div key={g.id} className={s.goalCard}>
                  <div className={s.goalRow}>
                    <span className={s.goalName}>{g.name}</span>
                    <span className={s.goalAmount}>{fmt(g.saved)} / {fmt(g.amount)}</span>
                  </div>
                  {g.hasFixed && <div className={s.goalFixedNote}>includes monthly fixed</div>}
                  <div className={s.goalBar}>
                    <div className={s.goalBarFill} style={{ width: `${g.pct}%`, background: ACCENT }} />
                  </div>
                  <div className={s.goalPct}>{g.pct.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
