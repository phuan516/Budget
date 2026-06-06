'use client';

import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Transaction, Config } from '@/lib/store/useStore';
import BreakdownCard from './share-cards/BreakdownCard';
import YearReviewCard from './share-cards/YearReviewCard';
import YearToDateCard from './share-cards/YearToDateCard';
import MonthlyRecapCard from './share-cards/MonthlyRecapCard';
import StreakCard from './share-cards/StreakCard';
import s from './ShareModal.module.css';

type MonthConfig = { income?: number; incomeNote?: string; fixedExpenses: { name: string; amount: number; note?: string }[] };

type CardStyle = 'breakdown' | 'year' | 'ytd' | 'recap' | 'streak';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  monthTransactions: Transaction[];
  allTransactions: Transaction[];
  viewYear: number;
  viewMonth: number;
  config: Config;
  monthConfigs: Record<string, MonthConfig>;
}

const STYLES: { id: CardStyle; label: string; bg: string }[] = [
  { id: 'breakdown', label: 'Breakdown', bg: '#f0eeea' },
  { id: 'year', label: 'Wrapped', bg: '#4a9e5c' },
  { id: 'ytd', label: 'Year to Date', bg: '#1e3a8a' },
  { id: 'recap', label: 'Monthly', bg: '#f5f2ec' },
  { id: 'streak', label: 'Streak', bg: '#1a1a1a' },
];

// Fills its parent (.styleThumbnail) which already carries the correct aspect-ratio via CSS.
// Measures its own rendered width after mount to compute the right scale factor.
function ThumbnailPreview({ style, monthTransactions, allTransactions, viewYear, viewMonth, income }: {
  style: CardStyle;
  monthTransactions: Transaction[];
  allTransactions: Transaction[];
  viewYear: number;
  viewMonth: number;
  income: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setScale(containerRef.current.offsetWidth / 1080);
    }
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {scale > 0 && (
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none', userSelect: 'none' }}>
          {style === 'breakdown' && <BreakdownCard transactions={monthTransactions} viewYear={viewYear} viewMonth={viewMonth} />}
          {style === 'year' && <YearReviewCard transactions={allTransactions} viewYear={viewYear} />}
          {style === 'ytd' && <YearToDateCard transactions={allTransactions} viewYear={viewYear} viewMonth={viewMonth} />}
          {style === 'recap' && <MonthlyRecapCard transactions={monthTransactions} viewYear={viewYear} viewMonth={viewMonth} income={income} />}
          {style === 'streak' && <StreakCard transactions={allTransactions} />}
        </div>
      )}
    </div>
  );
}

export default function ShareModal({ isOpen, onClose, monthTransactions, allTransactions, viewYear, viewMonth, config, monthConfigs }: Props) {
  const [selected, setSelected] = useState<CardStyle>('breakdown');
  const [downloading, setDownloading] = useState(false);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(452);

  useEffect(() => {
    if (!isOpen) return;
    const el = previewAreaRef.current;
    if (!el) return;
    const update = () => setContainerW(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  const isDecember = viewMonth === 11;

  // Reset to 'breakdown' if 'year' is selected but we're no longer on December
  useEffect(() => {
    if (!isDecember && selected === 'year') setSelected('breakdown');
    if (isDecember && selected === 'ytd') setSelected('breakdown');
  }, [isDecember, selected]);

  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const viewMonthConfig = monthConfigs?.[monthKey];
  const income = viewMonthConfig?.income ?? config.monthlyIncome ?? 0;

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });
  const availableStyles = STYLES.filter((st) => {
    if (st.id === 'year') return isDecember;
    if (st.id === 'ytd') return !isDecember;
    return true;
  });

  async function handleDownload() {
    if (!downloadRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      // downloadRef points to the full-size card (1080px, no transform) for a crisp export
      const dataUrl = await toPng(downloadRef.current, { pixelRatio: 1 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `budget-${selected}-${viewYear}-${String(viewMonth + 1).padStart(2, '0')}.png`;
      a.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setDownloading(false);
    }
  }

  // All cards are 1080×1080 — scale to fill the container width exactly.
  const scale = containerW / 1080;
  const scaledW = containerW;
  const scaledH = containerW;

  function renderCard() {
    if (selected === 'breakdown') return <BreakdownCard transactions={monthTransactions} viewYear={viewYear} viewMonth={viewMonth} />;
    if (selected === 'year') return <YearReviewCard transactions={allTransactions} viewYear={viewYear} />;
    if (selected === 'ytd') return <YearToDateCard transactions={allTransactions} viewYear={viewYear} viewMonth={viewMonth} />;
    if (selected === 'recap') return <MonthlyRecapCard transactions={monthTransactions} viewYear={viewYear} viewMonth={viewMonth} income={income} />;
    return <StreakCard transactions={allTransactions} />;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={s.overlay}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={s.modal}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className={s.header}>
              <span className={s.title}>Share · {monthName} {viewYear}</span>
              <button className={s.closeBtn} onClick={onClose} title="Close">×</button>
            </div>

            {/* Style picker */}
            <div className={s.stylePicker}>
              {availableStyles.map((st) => (
                <button
                  key={st.id}
                  className={`${s.styleBtn} ${selected === st.id ? s.styleBtnActive : ''}`}
                  onClick={() => setSelected(st.id)}
                >
                  <div className={s.styleThumbnail} style={{ background: st.bg }}>
                    <ThumbnailPreview
                      style={st.id}
                      monthTransactions={monthTransactions}
                      allTransactions={allTransactions}
                      viewYear={viewYear}
                      viewMonth={viewMonth}
                      income={income}
                    />
                  </div>
                  <div className={s.styleBtnLabel}>{st.label}</div>
                </button>
              ))}
            </div>

            {/* Card preview — ref used only for measuring width */}
            <div ref={previewAreaRef} className={s.previewArea} style={{ height: scaledH }}>
              <div style={{ width: scaledW, height: scaledH, overflow: 'hidden', position: 'relative' }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
                  {renderCard()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={s.actions}>
              <button className={`${s.downloadBtn} ${s.downloadBtnFull}`} onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <>
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M8 2a6 6 0 1 0 6 6h-2a4 4 0 1 1-4-4V2z" />
                    </svg>
                    Exporting…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2v8M5 7l3 3 3-3M3 12h10" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Off-screen full-resolution card — captured by handleDownload for a crisp 1080px PNG */}
          <div aria-hidden style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
            <div ref={downloadRef}>
              {renderCard()}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
