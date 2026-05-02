'use client';

import { useState, useMemo } from 'react';
import { Transaction, Config } from '@/lib/store/useStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from 'recharts';
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

interface Props {
  transactions: Transaction[];
  config: Config;
  isLoading: boolean;
}

export default function EverythingTab({ transactions, config, isLoading }: Props) {
  const [subTab, setSubTab] = useState<'transactions' | 'charts'>('transactions');
  const [search, setSearch] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const allMonthKeys = useMemo(
    () => [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort(),
    [transactions]
  );

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
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortBy === 'amount') cmp = Math.abs(a.amount) - Math.abs(b.amount);
      else cmp = a.category.localeCompare(b.category);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [transactions, search, selectedMonths, sortBy, sortDir]);

  const monthChartData = useMemo(
    () =>
      allMonthKeys.map(key => {
        const income = config.monthlyIncomeOverrides?.[key] ?? config.monthlyIncome;
        const fixed = config.fixedExpenses.reduce(
          (sum, fe) => sum + (config.fixedExpenseOverrides?.[key]?.[fe.name] ?? fe.amount),
          0
        );
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
          point[fe.name] = config.fixedExpenseOverrides?.[key]?.[fe.name] ?? fe.amount;
        });
        return point;
      }),
    [allMonthKeys, config]
  );

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
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

  if (isLoading) {
    return (
      <div className={s.spinner}>
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={s.root}>
      {/* Sub-tab nav */}
      <div className={s.subNav}>
        {(['transactions', 'charts'] as const).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`${s.subNavBtn} ${subTab === t ? s.subNavBtnActive : ''}`}
          >
            {t === 'transactions' ? 'All Transactions' : 'Charts'}
          </button>
        ))}
      </div>

      {subTab === 'transactions' && (
        <div>
          <input
            type="text"
            placeholder="Search by note, category, or card…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={s.searchInput}
          />

          {/* Month filter pills */}
          {allMonthKeys.length > 0 && (
            <div className={s.pillRow}>
              <span className={s.pillLabel}>Month</span>
              <button
                onClick={() => setSelectedMonths(new Set())}
                className={`${s.pill} ${selectedMonths.size === 0 ? s.pillActive : ''}`}
              >All</button>
              {allMonthKeys.map(key => (
                <button
                  key={key}
                  onClick={() => toggleMonth(key)}
                  className={`${s.pill} ${selectedMonths.has(key) ? s.pillActive : ''}`}
                >{keyToShortLabel(key)}</button>
              ))}
            </div>
          )}

          {/* Sort controls */}
          <div className={s.sortRow}>
            <span className={s.sortLabel}>Sort</span>
            {(['date', 'amount', 'category'] as const).map(field => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`${s.sortBtn} ${sortBy === field ? s.sortBtnActive : ''}`}
              >
                {field}{sortBy === field ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </button>
            ))}
          </div>

          {/* Summary */}
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

          {/* Transaction list */}
          {filtered.length === 0 ? (
            <div className={s.empty}>No transactions found</div>
          ) : (
            <div>
              {filtered.map((t, i) => {
                const isRefund = t.amount < 0;
                const monthKey = t.date.slice(0, 7);
                const prevMonthKey = i > 0 ? filtered[i - 1].date.slice(0, 7) : null;
                const showHeader = sortBy === 'date' && monthKey !== prevMonthKey;
                return (
                  <div key={t.id}>
                    {showHeader && (
                      <div className={s.monthHeader}>{keyToFullLabel(monthKey)}</div>
                    )}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
