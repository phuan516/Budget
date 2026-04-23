'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleOAuth } from '@/lib/hooks/useGoogleOAuth';
import { useStore } from '@/lib/store/useStore';
import SheetSelector from '@/components/sheets/SheetSelector';

export default function SheetSelectionPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { accessToken, user, logout, isConfigError } = useGoogleOAuth();
  const setSelectedSheet = useStore((state) => state.setSelectedSheet);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isConfigError) router.push('/');
  }, [isConfigError, router]);

  useEffect(() => {
    if (!isInitializing && !accessToken) router.push('/');
  }, [isInitializing, accessToken, router]);

  const handleSelectSheet = async (sheetId: string) => {
    setError(null);
    try {
      const response = await fetch('/api/sheets/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ sheetId }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { setError('Session expired. Please sign in again.'); logout(); return; }
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
    }
  };

  const handleCreateNew = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/sheets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ name: `Ledger — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}` }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) { setError('Session expired. Please sign in again.'); logout(); return; }
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

  if (isInitializing || !accessToken || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const emailShort = user.email.includes('@')
    ? user.email.split('@')[0] + '@…'
    : user.email;

  return (
    <div className="min-h-[100svh] bg-white text-[#1a1a1a] flex flex-col">

      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid #ececec', flexShrink: 0 }}>
        {/* Desktop */}
        <div className="hidden sm:flex justify-between items-center px-12 py-7">
          <span style={{ fontSize: 13, fontWeight: 600 }}>Ledger · Choose sheet</span>
          <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{user.email}</span>
            <span>·</span>
            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12, padding: 0 }}
            >
              Sign out
            </button>
          </div>
        </div>
        {/* Mobile */}
        <div className="sm:hidden flex justify-between items-center px-5 pt-3 pb-[14px]">
          <span style={{ fontSize: 13, fontWeight: 600 }}>Choose sheet</span>
          <span style={{ fontSize: 11, color: '#888' }}>{emailShort}</span>
        </div>
      </header>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div style={{ margin: '12px 48px 0', padding: '10px 14px', background: '#fafafa', border: '1px solid #d8d8d8', borderRadius: 8, fontSize: 13, color: '#1a1a1a' }}
          className="max-sm:mx-4">
          {error}
        </div>
      )}

      {/* ── SHEET SELECTOR ── */}
      <SheetSelector
        accessToken={accessToken!}
        onSelectSheet={handleSelectSheet}
        onCreateSheet={handleCreateNew}
        isCreating={isCreating}
      />
    </div>
  );
}
