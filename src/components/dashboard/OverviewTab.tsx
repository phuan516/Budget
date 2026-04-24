'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Transaction, Config } from '@/lib/store/useStore';

const MONO = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';
const ACCENT = '#0F9D58';
const BAR_COLORS = ['#1a1a1a', '#444', '#666', '#888', '#aaa', '#ccc'];

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ border: '1px solid #ececec', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, color: accent ? ACCENT : '#1a1a1a', fontFamily: MONO }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 13 }}>{label}</div>
  );
}

interface Props {
  transactions: Transaction[];
  config: Config;
  isLoading: boolean;
}

export default function OverviewTab({ transactions, config, isLoading }: Props) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthTxns = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }),
    [transactions, currentMonth, currentYear],
  );

  const totalSpent = useMemo(() => monthTxns.reduce((s, t) => s + t.amount, 0), [monthTxns]);
  const fixedTotal = useMemo(
    () => config.fixedExpenses.reduce((s, e) => s + e.amount, 0),
    [config.fixedExpenses],
  );
  const remaining = config.monthlyIncome > 0 ? config.monthlyIncome - totalSpent : null;

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.forEach((t) => {
      const cat = t.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthTxns]);

  const recent = useMemo(
    () => [...transactions].reverse().slice(0, 8),
    [transactions],
  );

  const savingGoalProgress = useMemo(() => {
    const months = new Set(transactions.map((t) => t.date.slice(0, 7)));
    const monthsCount = (() => {
      if (months.size === 0) return 0;
      const sorted = [...months].sort();
      const [ey, em] = sorted[0].split('-').map(Number);
      const now = new Date();
      return (now.getFullYear() - ey) * 12 + (now.getMonth() + 1 - em) + 1;
    })();
    return config.savingGoals.map((g) => {
      const txnSaved = transactions
        .filter((t) => t.category === g.name)
        .reduce((s, t) => s + t.amount, 0);
      const matchingFixed = config.fixedExpenses.find(
        (fe) => fe.name.toLowerCase() === g.name.toLowerCase(),
      );
      const fixedSaved = matchingFixed ? matchingFixed.amount * monthsCount : 0;
      const saved = (g.initialAmount ?? 0) + txnSaved + fixedSaved;
      const pct = g.amount > 0 ? Math.min(100, (saved / g.amount) * 100) : 0;
      return { ...g, saved, pct, hasFixed: !!matchingFixed };
    });
  }, [transactions, config.savingGoals, config.fixedExpenses]);

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0 48px' }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>{monthLabel}</div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}
        className="max-sm:grid-cols-1">
        <SummaryCard label="Spent this month" value={fmt(totalSpent)} />
        {config.monthlyIncome > 0 ? (
          <SummaryCard
            label="Remaining"
            value={fmt(remaining ?? 0)}
            sub={`of ${fmt(config.monthlyIncome)} income`}
            accent={(remaining ?? 0) >= 0}
          />
        ) : (
          <SummaryCard label="Remaining" value="—" sub="Set income in Settings" />
        )}
        <SummaryCard
          label="Fixed expenses"
          value={fixedTotal > 0 ? fmt(fixedTotal) : '—'}
          sub={fixedTotal > 0 ? `${config.fixedExpenses.length} items` : 'Add in Settings'}
        />
      </div>

      {/* Category breakdown */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#1a1a1a' }}>By category</div>
        {categoryData.length === 0 ? (
          <EmptyState label="No transactions this month" />
        ) : (
          <div style={{ height: 200, width: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#888', fontFamily: MONO }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(v) => [fmt(Number(v)), 'Spent']}
                  contentStyle={{ border: '1px solid #ececec', borderRadius: 8, fontSize: 12, boxShadow: 'none' }}
                  cursor={{ fill: '#f5f5f5' }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Saving goals progress */}
      {savingGoalProgress.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#1a1a1a' }}>Saving goals</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {savingGoalProgress.map((g) => (
              <div key={g.id} style={{ border: '1px solid #ececec', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{g.name}</span>
                  <span style={{ fontSize: 12, color: '#888', fontFamily: MONO }}>
                    {fmt(g.saved)} / {fmt(g.amount)}
                  </span>
                </div>
                {g.hasFixed && (
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>includes monthly fixed contribution</div>
                )}
                <div style={{ height: 4, background: '#ececec', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${g.pct}%`, background: ACCENT, borderRadius: 2, transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>{g.pct.toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: '#1a1a1a' }}>Recent</div>
        {recent.length === 0 ? (
          <EmptyState label="No transactions yet — add one in Transactions" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {recent.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.category || 'Uncategorized'}{t.note ? ` · ${t.note}` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{t.date}{t.card ? ` · ${t.card}` : ''}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', fontFamily: MONO, marginLeft: 16 }}>{fmt(t.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
