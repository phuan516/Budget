import { Transaction } from '@/lib/store/useStore';
import { getNoSpendStreak } from './shareUtils';

interface Props {
  transactions: Transaction[];
  scale?: number;
}

export default function StreakCard({ transactions, scale = 1 }: Props) {
  const CARD_W = 1080;
  const CARD_H = 1080;

  const streak = getNoSpendStreak(transactions);
  const displayCount = Math.min(streak, 7);

  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: '#1a1a1a',
        fontFamily: '"Inter", system-ui, sans-serif',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 80px 100px',
        boxSizing: 'border-box',
      }}
    >
      {/* Label */}
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.12em', color: '#555' }}>
        STREAK
      </div>

      {/* Center content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '0.1em', color: '#555', marginBottom: 16 }}>
          NO-SPEND DAYS
        </div>
        <div style={{ fontSize: 280, fontWeight: 900, color: '#4CAF50', lineHeight: 0.9, marginBottom: 24 }}>
          {streak}
        </div>
        <div style={{ fontSize: 40, color: '#fff', marginBottom: 64 }}>
          {streak === 1 ? 'day and counting' : 'and counting'}
        </div>

        {/* Checkmark circles */}
        {displayCount > 0 && (
          <div style={{ display: 'flex', gap: 20 }}>
            {Array.from({ length: displayCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ))}
            {streak > 7 && (
              <div style={{ fontSize: 36, color: '#4CAF50', alignSelf: 'center', marginLeft: 8 }}>
                +{streak - 7}
              </div>
            )}
          </div>
        )}

        {streak === 0 && (
          <div style={{ fontSize: 32, color: '#555', textAlign: 'center' }}>
            Start your streak today!
          </div>
        )}
      </div>
    </div>
  );
}
