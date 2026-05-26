import { Transaction } from '@/lib/store/useStore';
import { getYtdStats } from './shareUtils';

const MONO = '"JetBrains Mono", monospace';

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface Props {
  transactions: Transaction[];
  viewYear: number;
  viewMonth: number;
}

export default function YearToDateCard({ transactions, viewYear, viewMonth }: Props) {
  const CARD_W = 1080;
  const CARD_H = 1080;

  const stats = getYtdStats(transactions, viewYear, viewMonth);

  const startLabel = 'Jan';
  const endLabel = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'short' });
  const rangeLabel = startLabel === endLabel ? startLabel : `${startLabel}–${endLabel}`;

  const metrics = [
    {
      label: 'TOTAL SPEND',
      value: fmt(stats.totalSpend),
      sub: `${stats.totalTransactions} transactions`,
    },
    {
      label: 'MONTHLY AVG',
      value: fmt(stats.monthlyAvg),
      sub: `over ${stats.monthsTracked} ${stats.monthsTracked === 1 ? 'month' : 'months'}`,
    },
    {
      label: 'TOP CATEGORY',
      value: stats.topCategory || '—',
      sub: stats.topAmount > 0 ? fmt(stats.topAmount) : '',
    },
    {
      label: 'BEST MONTH',
      value: stats.bestMonth || '—',
      sub: stats.bestMonthAmount > 0 ? fmt(stats.bestMonthAmount) : '',
    },
  ];

  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: '#1e3a8a',
        fontFamily: '"Inter", system-ui, sans-serif',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: 64,
        boxSizing: 'border-box',
        gap: 40,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background year watermark */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          left: -10,
          fontSize: 320,
          fontWeight: 900,
          color: 'rgba(255,255,255,0.07)',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {viewYear}
      </div>

      {/* Label + hero */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
          {rangeLabel.toUpperCase()} · {viewYear}
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1.0 }}>
          Year to date.
        </div>
      </div>

      {/* 4 metric rows */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 44, fontWeight: 700, color: '#fff', fontFamily: MONO, lineHeight: 1 }}>
                {m.value}
              </div>
            </div>
            {m.sub && (
              <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', textAlign: 'right', lineHeight: 1.4 }}>
                {m.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
