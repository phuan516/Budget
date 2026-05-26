import { Transaction } from '@/lib/store/useStore';
import { getCategoryTotals } from './shareUtils';

const MONO = '"JetBrains Mono", monospace';
const GRAYS = ['#1a1a1a', '#3d3d3d', '#636363', '#8a8a8a', '#b0b0b0', '#d0d0d0'];

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface Props {
  transactions: Transaction[];
  viewYear: number;
  viewMonth: number;
}

export default function BreakdownCard({ transactions, viewYear, viewMonth }: Props) {
  const CARD_W = 1080;
  const CARD_H = 1080;

  const monthName = new Date(viewYear, viewMonth, 1)
    .toLocaleString('default', { month: 'long' }).toUpperCase();
  const label = `${monthName} · BREAKDOWN`;

  const expenses = transactions.filter((t) => t.amount > 0 && !/\[←/.test(t.note ?? ''));
  const totals = getCategoryTotals(transactions);
  const grandTotal = totals.reduce((s, c) => s + c.amount, 0);
  const entryCount = expenses.length;

  const top5 = totals.slice(0, 5);
  const otherAmount = totals.slice(5).reduce((s, c) => s + c.amount, 0);
  const displayRows = otherAmount > 0 ? [...top5, { name: 'Other', amount: otherAmount }] : top5;

  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: '#f0eeea',
        fontFamily: '"Inter", system-ui, sans-serif',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top label */}
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '0.08em', color: '#555' }}>
        {label}
      </div>

      {/* Hero + subtitle + bar */}
      <div>
        <div style={{ fontSize: 82, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.0, marginBottom: 16 }}>
          Where it went.
        </div>
        <div style={{ fontSize: 28, color: '#666', fontFamily: MONO, marginBottom: 44 }}>
          {fmt(grandTotal)} across {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
        </div>
        {grandTotal > 0 && (
          <div style={{ display: 'flex', height: 20, borderRadius: 4, overflow: 'hidden' }}>
            {displayRows.map((row, i) => (
              <div
                key={row.name}
                style={{ width: `${(row.amount / grandTotal) * 100}%`, background: GRAYS[i] ?? '#e0e0e0' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Category rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {displayRows.map((row, i) => (
          <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, background: GRAYS[i] ?? '#e0e0e0', flexShrink: 0 }} />
            <span style={{ fontSize: 34, color: '#1a1a1a', flex: 1 }}>{row.name}</span>
            <span style={{ fontSize: 34, fontFamily: MONO, color: '#1a1a1a' }}>{fmt(row.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
