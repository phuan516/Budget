import { Transaction } from '@/lib/store/useStore';
import { getDailySpend } from './shareUtils';

const MONO = '"JetBrains Mono", monospace';

const CLAIM_TAG_RE = /\[←(\d{4}-\d{2})\]/;

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface Props {
  transactions: Transaction[];
  viewYear: number;
  viewMonth: number;
  income: number;
  scale?: number;
}

export default function MonthlyRecapCard({ transactions, viewYear, viewMonth, income, scale = 1 }: Props) {
  const CARD_W = 1080;
  const CARD_H = 1080;

  const monthName = new Date(viewYear, viewMonth, 1)
    .toLocaleString('default', { month: 'long' }).toUpperCase();
  const label = `${monthName} · RECAP`;

  const monthSpend = transactions
    .filter((t) => t.amount > 0 && !CLAIM_TAG_RE.test(t.note ?? ''))
    .reduce((s, t) => s + t.amount, 0);

  const underBy = income > 0 ? income - monthSpend : 0;
  const pct = income > 0 ? Math.min(monthSpend / income, 1) : 0;

  const dailySpend = getDailySpend(transactions, viewYear, viewMonth);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Build a 5×7 grid of days (padded)
  const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const cells: number[] = Array(totalCells).fill(0);
  for (let d = 1; d <= daysInMonth; d++) cells[firstDow + d - 1] = d;

  const maxSpend = Math.max(...Object.values(dailySpend), 1);

  function dayColor(day: number) {
    if (day === 0) return 'transparent';
    const spend = dailySpend[day] ?? 0;
    if (spend === 0) return '#c8f0d8'; // light green = no-spend
    const intensity = spend / maxSpend;
    const gray = Math.round(26 + (1 - intensity) * 180);
    return `rgb(${gray},${gray},${gray})`;
  }

  const rows: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: '#f5f2ec',
        fontFamily: '"Inter", system-ui, sans-serif',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '72px 80px 72px',
        boxSizing: 'border-box',
      }}
    >
      {/* Label */}
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '0.08em', color: '#888', marginBottom: 48 }}>
        {label}
      </div>

      {/* Context */}
      {underBy >= 0 && income > 0 ? (
        <>
          <div style={{ fontSize: 32, color: '#555', marginBottom: 16 }}>I came in under budget by</div>
          <div style={{ fontSize: 120, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, fontFamily: MONO, marginBottom: 24 }}>
            {fmt(underBy)}
          </div>
          <div style={{ fontSize: 28, color: '#888', fontFamily: MONO, marginBottom: 48 }}>
            spent {fmt(monthSpend)} of {fmt(income)}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 32, color: '#555', marginBottom: 16 }}>I spent</div>
          <div style={{ fontSize: 120, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, fontFamily: MONO, marginBottom: 24 }}>
            {fmt(monthSpend)}
          </div>
          <div style={{ fontSize: 28, color: '#888', fontFamily: MONO, marginBottom: 48 }}>
            {income > 0 ? `of ${fmt(income)} budget` : 'this month'}
          </div>
        </>
      )}

      {/* Progress bar */}
      {income > 0 && (
        <div
          style={{
            height: 14,
            borderRadius: 999,
            background: '#ddd',
            marginBottom: 64,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct * 100}%`,
              height: '100%',
              background: underBy >= 0 ? '#4CAF50' : '#e05a4e',
              borderRadius: 999,
            }}
          />
        </div>
      )}

      {/* Heat map */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '0.1em', color: '#888', marginBottom: 20 }}>
          DAILY SPEND
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 10 }}>
              {row.map((day, ci) => (
                <div
                  key={ci}
                  style={{
                    width: 112,
                    height: 72,
                    borderRadius: 10,
                    background: dayColor(day),
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
