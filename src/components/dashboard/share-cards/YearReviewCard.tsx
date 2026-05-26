import { Transaction } from '@/lib/store/useStore';
import { getYearStats } from './shareUtils';

const MONO = '"JetBrains Mono", monospace';

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface Props {
  transactions: Transaction[];
  viewYear: number;
}

export default function YearReviewCard({ transactions, viewYear }: Props) {
  const CARD_W = 1080;
  const CARD_H = 1080;

  const stats = getYearStats(transactions, viewYear);

  const metrics = [
    {
      label: 'TOP CATEGORY',
      value: stats.topCategory || '—',
      sub: stats.topAmount > 0 ? `${fmt(stats.topAmount)} · ${stats.topPct}%` : '',
    },
    {
      label: 'BIGGEST DAY',
      value: stats.biggestDay > 0 ? fmt(stats.biggestDay) : '—',
      sub: stats.biggestDayLabel,
    },
    {
      label: 'NO-SPEND DAYS',
      value: String(stats.noSpendDays),
      sub: `out of 365`,
    },
    {
      label: 'TRANSACTIONS',
      value: String(stats.totalTransactions),
      sub: stats.avgPerDay > 0 ? `avg ${fmt(stats.avgPerDay)}/day` : '',
    },
  ];

  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: '#4a9e5c',
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
          color: 'rgba(0,0,0,0.1)',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {viewYear}
      </div>

      {/* Label + hero */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.5)', marginBottom: 20 }}>
          WRAPPED
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.0 }}>
          Your year in spending.
        </div>
      </div>

      {/* 4 metric rows — flex: 1 fills the remaining height */}
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
              background: '#fff',
              borderRadius: 20,
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '0.08em', color: '#888', marginBottom: 6 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 44, fontWeight: 700, color: '#1a1a1a', fontFamily: MONO, lineHeight: 1 }}>
                {m.value}
              </div>
            </div>
            {m.sub && (
              <div style={{ fontSize: 17, color: '#888', textAlign: 'right', lineHeight: 1.4 }}>
                {m.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
