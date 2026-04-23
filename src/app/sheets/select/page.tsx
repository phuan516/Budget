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
  const selectedSheet = useStore((state) => state.selectedSheet);
  const setSelectedSheet = useStore((state) => state.setSelectedSheet);

  useEffect(() => {
    // Give the hook time to load from localStorage
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check if not configured and redirect to home
  useEffect(() => {
    if (isConfigError) {
      router.push('/');
    }
  }, [isConfigError, router]);

  useEffect(() => {
    if (!isInitializing && !accessToken) {
      console.log('Not authenticated, redirecting to home...');
      router.push('/');
    }
  }, [isInitializing, accessToken, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!accessToken || !user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleSelectSheet = async (sheetId: string) => {
    try {
      const response = await fetch('/api/sheets/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ sheetId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please sign in again.');
          logout();
          return;
        }
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: 'My Budget Tracker' }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please sign in again.');
          logout();
          return;
        }
        throw new Error(data.error || 'Failed to create sheet');
      }

      setSelectedSheet({
        id: data.id,
        name: data.name,
        url: data.url,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sheet');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <div className="max-w-4xl mx-auto w-full">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">$</span>
              </div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                Budget Tracker
              </h1>
            </div>
            <button
              onClick={logout}
              className="text-sm text-zinc-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </header>

        <main className="py-8 px-6">
          {error && (
            <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <SheetSelector
            accessToken={accessToken}
            onSelectSheet={handleSelectSheet}
            onCreateSheet={handleCreateNew}
            isCreating={isCreating}
          />
        </main>
      </div>
    </div>
  );
}