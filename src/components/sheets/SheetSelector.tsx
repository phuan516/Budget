'use client';

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { SheetMetadata } from '@/lib/google/sheets';

interface SheetSelectorProps {
  onSelectSheet: (sheetId: string) => void;
  onCreateSheet: () => void;
  accessToken: string;
  isCreating?: boolean;
  isSelecting?: boolean;
}

function SheetsIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="18" height="20" rx="2" fill="#0F9D58"/>
      <rect x="6" y="8" width="12" height="1.5" fill="#fff" opacity="0.9"/>
      <rect x="6" y="11" width="12" height="1.5" fill="#fff" opacity="0.9"/>
      <rect x="6" y="14" width="12" height="1.5" fill="#fff" opacity="0.9"/>
      <rect x="11" y="7" width="1.5" height="10" fill="#0F9D58"/>
    </svg>
  );
}

function MiniSheetPreview({ height }: { height: number }) {
  return (
    <div style={{ border: '1px solid #ececec', borderRadius: 4, height, marginBottom: 10, background: '#fafafa', display: 'flex', flexDirection: 'column' }}>
      {[0, 1, 2, 3].map((r) => (
        <div key={r} style={{ flex: 1, borderBottom: r < 3 ? '1px solid #ececec' : 'none', display: 'flex' }}>
          <div style={{ flex: 1, borderRight: '1px solid #ececec', background: r === 0 ? '#ececec' : 'transparent' }} />
          <div style={{ flex: 1, borderRight: '1px solid #ececec', background: r === 0 ? '#ececec' : 'transparent' }} />
          <div style={{ flex: 1, background: r === 0 ? '#ececec' : 'transparent' }} />
        </div>
      ))}
    </div>
  );
}

const ACCENT = 'oklch(0.65 0.13 150)';
const MONO = 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)';
const FILTER_KEY = 'budget_sheet_filter';

type OwnerFilter = 'all' | 'mine' | 'shared';
const FILTER_OPTIONS: { value: OwnerFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'shared', label: 'Shared' },
];

export default function SheetSelector({ onSelectSheet, onCreateSheet, accessToken, isCreating, isSelecting }: SheetSelectorProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>(() => {
    if (typeof window === 'undefined') return 'all';
    return (localStorage.getItem(FILTER_KEY) as OwnerFilter) ?? 'mine';
  });
  const availableSheets = useStore((state) => state.availableSheets);
  const setAvailableSheets = useStore((state) => state.setAvailableSheets);

  const handleFilterChange = (value: OwnerFilter) => {
    setOwnerFilter(value);
    localStorage.setItem(FILTER_KEY, value);
  };

  const loadSheets = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/sheets/list', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        console.error('Failed to load sheets:', await response.json());
        return;
      }
      const sheets: SheetMetadata[] = await response.json();
      setAvailableSheets(sheets);
    } catch (error) {
      console.error('Failed to load sheets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, setAvailableSheets]);

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  const filteredSheets = availableSheets.filter((s) => {
    if (!s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (ownerFilter === 'mine') return s.ownedByMe === true;
    if (ownerFilter === 'shared') return s.ownedByMe === false;
    return true;
  });

  const handleConfirm = () => {
    if (pendingId) onSelectSheet(pendingId);
  };

  // ── Skeleton tiles for loading state ──────────────────────
  const skeletonTiles = Array.from({ length: 5 }, (_, i) => (
    <div key={i} style={{ border: '1px solid #d8d8d8', borderRadius: 10, padding: 16, minHeight: 140, background: '#fafafa', animation: 'pulse 1.5s ease-in-out infinite' }} />
  ));

  return (
    <div className="flex-1 flex flex-col max-sm:min-h-0">

      {/* ── DESKTOP LAYOUT (640px+) ── */}
      <div className="hidden sm:block" style={{ padding: '48px 48px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5, margin: '0 0 4px', color: '#1a1a1a' }}>
              Where should we write?
            </h1>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
              Pick an existing sheet or start fresh.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Refresh */}
            <button
              onClick={loadSheets}
              disabled={isLoading}
              title="Refresh sheets"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: '1px solid #d8d8d8', borderRadius: 10, background: 'transparent', cursor: isLoading ? 'not-allowed' : 'pointer', color: '#888', flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? 'animate-spin' : ''} aria-hidden="true">
                <path d="M13 2v4H9"/>
                <path d="M1 12v-4h4"/>
                <path d="M11.6 8.5a5 5 0 1 1-.8-5.1L13 6"/>
                <path d="M2.4 5.5a5 5 0 1 1 .8 5.1L1 8"/>
              </svg>
            </button>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d8d8d8', borderRadius: 10, padding: '9px 12px', minWidth: 200 }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#888" strokeWidth="1.5" aria-hidden="true">
                <circle cx="6" cy="6" r="4.5"/>
                <path d="M10 10l3 3"/>
              </svg>
              <input
                type="text"
                placeholder="Search sheets…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: 13, color: '#1a1a1a', flex: 1, border: 'none', outline: 'none', background: 'transparent' }}
              />
            </div>
            {/* Ownership filter */}
            <div style={{ display: 'flex', border: '1px solid #d8d8d8', borderRadius: 999, overflow: 'hidden' }}>
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterChange(opt.value)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    borderRight: opt.value !== 'shared' ? '1px solid #d8d8d8' : 'none',
                    background: ownerFilter === opt.value ? '#1a1a1a' : 'transparent',
                    color: ownerFilter === opt.value ? '#fff' : '#888',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {isLoading ? skeletonTiles : (
            <>
              {filteredSheets.map((sheet) => {
                const selected = pendingId === sheet.id;
                return (
                  <button
                    key={sheet.id}
                    onClick={() => !isSelecting && setPendingId(sheet.id)}
                    style={{
                      border: selected ? '1.5px solid #1a1a1a' : '1px solid #d8d8d8',
                      borderRadius: 10,
                      padding: 16,
                      cursor: isSelecting ? 'not-allowed' : 'pointer',
                      background: '#fff',
                      minHeight: 140,
                      textAlign: 'left',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <SheetsIcon size={15} />
                      <span style={{ fontSize: 10, color: '#888', fontFamily: MONO }}>— rows</span>
                      {selected && (
                        isSelecting ? (
                          <div className="ml-auto w-3 h-3 border-[1.5px] border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            ● Selected
                          </span>
                        )
                      )}
                    </div>
                    <MiniSheetPreview height={52} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{sheet.name}</div>
                  </button>
                );
              })}

              <button
                onClick={onCreateSheet}
                disabled={isCreating}
                style={{
                  border: '1.5px dashed #d8d8d8',
                  borderRadius: 10,
                  padding: 16,
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  background: '#fafafa',
                  minHeight: 140,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#888',
                  fontSize: 13,
                }}
              >
                {isCreating ? (
                  <div className="w-6 h-6 border-2 border-[#888] border-t-transparent rounded-full animate-spin mb-1" />
                ) : (
                  <div style={{ fontSize: 24, marginBottom: 6, lineHeight: 1 }}>+</div>
                )}
                {isCreating ? 'Creating…' : 'New sheet'}
              </button>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 32, paddingBottom: 48 }}>
          <button
            onClick={() => !isSelecting && setPendingId(null)}
            style={{ border: '1.5px solid #d8d8d8', background: 'transparent', color: '#1a1a1a', padding: '9px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: isSelecting ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!pendingId || isSelecting}
            style={{
              border: 'none',
              background: pendingId ? '#1a1a1a' : '#d8d8d8',
              color: '#fff',
              padding: '9px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              cursor: pendingId && !isSelecting ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isSelecting && <div className="w-3 h-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />}
            {isSelecting ? 'Opening…' : 'Use this sheet →'}
          </button>
        </div>
      </div>

      {/* ── MOBILE LAYOUT (< 640px) ── */}
      <div className="sm:hidden flex-1 flex flex-col overflow-hidden">

        {/* Top bar — locked */}
        <div style={{ flexShrink: 0, padding: '20px 16px 12px', borderBottom: '1px solid #ececec' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.4, margin: '0 0 2px', color: '#1a1a1a' }}>
            Where should we write?
          </h1>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>Pick an existing sheet or start fresh.</p>

          {/* Refresh + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button
              onClick={loadSheets}
              disabled={isLoading}
              title="Refresh sheets"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: '1px solid #d8d8d8', borderRadius: 10, background: 'transparent', cursor: isLoading ? 'not-allowed' : 'pointer', color: '#888', flexShrink: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? 'animate-spin' : ''} aria-hidden="true">
                <path d="M13 2v4H9"/>
                <path d="M1 12v-4h4"/>
                <path d="M11.6 8.5a5 5 0 1 1-.8-5.1L13 6"/>
                <path d="M2.4 5.5a5 5 0 1 1 .8 5.1L1 8"/>
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d8d8d8', borderRadius: 10, padding: '9px 12px', flex: 1 }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#888" strokeWidth="1.5" aria-hidden="true">
                <circle cx="6" cy="6" r="4.5"/>
                <path d="M10 10l3 3"/>
              </svg>
              <input
                type="text"
                placeholder="Search your Drive…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: 12, color: '#1a1a1a', flex: 1, border: 'none', outline: 'none', background: 'transparent' }}
              />
            </div>
          </div>

          {/* Ownership filter */}
          <div style={{ display: 'flex', border: '1px solid #d8d8d8', borderRadius: 999, overflow: 'hidden' }}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  borderRight: opt.value !== 'shared' ? '1px solid #d8d8d8' : 'none',
                  background: ownerFilter === opt.value ? '#1a1a1a' : 'transparent',
                  color: ownerFilter === opt.value ? '#fff' : '#888',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable sheet grid */}
        <div className="flex-1 min-h-0" style={{ overflowY: 'auto', padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {filteredSheets.map((sheet) => {
              const selected = pendingId === sheet.id;
              return (
                <button
                  key={sheet.id}
                  onClick={() => !isSelecting && setPendingId(sheet.id)}
                  style={{
                    border: selected ? '1.5px solid #1a1a1a' : '1px solid #d8d8d8',
                    borderRadius: 10,
                    padding: 12,
                    position: 'relative',
                    minHeight: 128,
                    background: '#fff',
                    textAlign: 'left',
                    cursor: isSelecting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <SheetsIcon size={13} />
                    <span style={{ fontSize: 9, color: '#888', fontFamily: MONO }}>— rows</span>
                  </div>
                  <MiniSheetPreview height={42} />
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.2 }}>{sheet.name}</div>
                  {selected && (
                    isSelecting ? (
                      <div className="absolute top-2 right-2 w-3 h-3 border-[1.5px] border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 700, color: ACCENT }}>●</div>
                    )
                  )}
                </button>
              );
            })}

            <button
              onClick={onCreateSheet}
              disabled={isCreating}
              style={{
                border: '1.5px dashed #d8d8d8',
                borderRadius: 10,
                padding: 12,
                background: '#fafafa',
                minHeight: 128,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888',
                fontSize: 12,
                gridColumn: 'span 2',
                cursor: isCreating ? 'not-allowed' : 'pointer',
              }}
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-[#888] border-t-transparent rounded-full animate-spin mb-1" />
              ) : (
                <div style={{ fontSize: 20, marginBottom: 4, lineHeight: 1 }}>+</div>
              )}
              {isCreating ? 'Creating…' : 'New sheet'}
            </button>
          </div>
        </div>

        {/* Bottom bar — locked */}
        <div style={{ flexShrink: 0, padding: '12px 16px 20px', borderTop: '1px solid #ececec', display: 'flex', gap: 8 }}>
          <button
            onClick={() => !isSelecting && setPendingId(null)}
            style={{ flex: 1, padding: 12, border: '1.5px solid #d8d8d8', background: 'transparent', color: '#1a1a1a', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: isSelecting ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!pendingId || isSelecting}
            style={{
              flex: 2,
              padding: 12,
              border: 'none',
              background: pendingId ? '#1a1a1a' : '#d8d8d8',
              color: '#fff',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              cursor: pendingId && !isSelecting ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isSelecting && <div className="w-3 h-3 border-[1.5px] border-white border-t-transparent rounded-full animate-spin" />}
            {isSelecting ? 'Opening…' : 'Use this sheet →'}
          </button>
        </div>
      </div>

    </div>
  );
}
