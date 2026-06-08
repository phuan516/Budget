'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/lib/store/useStore';
import SheetSelector from '@/components/sheets/SheetSelector';

export default function SheetSelectionPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, loading, signOut } = useAuth();
  const clearSelectedSheet = useStore((s) => s.clearSelectedSheet);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const setSelectedSheet = useStore((state) => state.setSelectedSheet);

  function handleSignOut() {
    clearSelectedSheet();
    signOut();
  }

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  const handleSelectSheet = async (sheetId: string) => {
    setError(null);
    setIsSelecting(true);
    try {
      const response = await fetch('/api/sheets/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { setError('Session expired. Please sign in again.'); signOut(); return; }
        throw new Error(data.error || 'Failed to select sheet');
      }
      if (data.valid && data.sheet) {
        setSelectedSheet(data.sheet);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid sheet structure');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select sheet');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCreateNew = async (name: string) => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { setError('Session expired. Please sign in again.'); signOut(); return; }
        throw new Error(data.error || 'Failed to create sheet');
      }
      setSelectedSheet({ id: data.id, name: data.name, url: data.url });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sheet');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] max-sm:h-[100svh] max-sm:overflow-hidden bg-white text-[#1a1a1a] flex flex-col">

      <header style={{ borderBottom: '1px solid #ececec', flexShrink: 0 }}>
        {/* Desktop */}
        <div className="hidden sm:flex justify-between items-center px-12 py-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/ledger-A-512.png" alt="Ledger" width={18} height={18} style={{ borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Ledger</span>
            <span style={{ color: '#d8d8d8', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: '#444' }}>Select sheet</span>
          </div>
          <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{user.email}</span>
            <span>·</span>
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12, padding: 0 }}
            >
              Sign out
            </button>
          </div>
        </div>
        {/* Mobile */}
        <div className="sm:hidden flex justify-between items-center px-5 py-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/ledger-A-512.png" alt="Ledger" width={16} height={16} style={{ borderRadius: '50%' }} />
            <span style={{ fontSize: 13, color: '#444' }}>Select sheet</span>
          </div>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', gap: 4 }}
              aria-label="Menu"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ display: 'block', width: 18, height: 1.5, background: '#888', borderRadius: 1 }} />
              ))}
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: '#fff',
                border: '1px solid #ececec',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.09)',
                minWidth: 160,
                zIndex: 300,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 14px 8px', fontSize: 11, color: '#aaa', borderBottom: '1px solid #f0f0f0' }}>
                  {user.email}
                </div>
                <button
                  onClick={() => { setMenuOpen(false); handleSignOut(); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#1a1a1a' }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div style={{ margin: '12px 48px 0', padding: '10px 14px', background: '#fafafa', border: '1px solid #d8d8d8', borderRadius: 8, fontSize: 13, color: '#1a1a1a' }}
          className="max-sm:mx-4">
          {error}
        </div>
      )}

      <SheetSelector
        onSelectSheet={handleSelectSheet}
        onCreateSheet={handleCreateNew}
        onCancel={() => router.back()}
        isCreating={isCreating}
        isSelecting={isSelecting}
      />
    </div>
  );
}
