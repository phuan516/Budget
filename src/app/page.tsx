'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleOAuth } from '@/lib/hooks/useGoogleOAuth';
import { useStore } from '@/lib/store/useStore';

function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09 0-.73.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isLoading, login, isConfigError, accessToken, user, isSilentLoading } = useGoogleOAuth();
  const selectedSheet = useStore((s) => s.selectedSheet);

  useEffect(() => {
    if (!isSilentLoading && accessToken && user) {
      router.push(selectedSheet ? '/dashboard' : '/sheets/select');
    }
  }, [isSilentLoading, accessToken, user, selectedSheet, router]);

  const handleLogin = () => { login(); };

  if (isSilentLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isConfigError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 text-center">
            Google OAuth Not Configured
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            The app administrator needs to set up Google OAuth credentials before you can sign in.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6 border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-3">Setup Steps:</h3>
            <ol className="list-decimal list-inside text-sm text-amber-700 dark:text-amber-500 space-y-2">
              <li><strong>Create a project:</strong> Go to Google Cloud Console</li>
              <li><strong>Enable APIs:</strong> Enable Google Sheets API and Google Drive API</li>
              <li><strong>Create OAuth credentials:</strong> Create OAuth 2.0 Client ID</li>
              <li><strong>Configure .env.local:</strong> Add <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id</code></li>
            </ol>
          </div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
            Once configured, restart your dev server and try again.
          </div>
        </div>
      </div>
    );
  }

  const spinner = (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
  );

  return (
    <div className="min-h-[100svh] bg-white text-[#1a1a1a] relative overflow-hidden flex flex-col">

      <header className="flex justify-between items-center shrink-0 px-14 py-8 max-sm:px-[22px] max-sm:py-3">
        <div className="flex items-center gap-[10px]">
          <div className="w-[22px] h-[22px] rounded-full bg-[#1a1a1a] shrink-0 max-sm:w-[18px] max-sm:h-[18px]" />
          <span className="text-[15px] font-semibold tracking-[-0.2px] max-sm:text-[13px]">Ledger</span>
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="border border-[#d8d8d8] bg-transparent text-[#1a1a1a] px-4 py-[9px] rounded-full text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#f5f5f5] hover:border-[#1a1a1a] disabled:opacity-50 max-sm:text-[11px] max-sm:px-3 max-sm:py-[6px]"
        >
          Sign in
        </button>
      </header>

      {/* ── MOBILE LAYOUT (< 640px) ── */}
      <div className="sm:hidden flex-1 flex flex-col px-[22px] pb-5">
        <div className="flex-1 pt-[48px]">
          <p className="text-[10px] text-[#888] mb-[18px] uppercase tracking-[0.3px]">
            Budget tracking · Your spreadsheet
          </p>
          <h1 className="font-semibold leading-[0.95] tracking-[-1.6px] mb-5 mt-0" style={{ fontSize: 52 }}>
            Your money,<br /><span style={{ color: '#0F9D58' }}>your sheet.</span>
          </h1>
          <p className="text-[14px] text-[#444] leading-[1.45] mb-8 max-w-[260px]">
            Connect a Google Sheet. Track spending. Own your data.
          </p>
        </div>

        <div>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] text-white py-[14px] rounded-full text-[14px] font-medium cursor-pointer disabled:opacity-70"
          >
            {isLoading ? spinner : <GoogleG size={16} />}
            Continue with Google
          </button>
          <p className="text-[10px] text-[#888] text-center mt-[10px]">
            We only request access to sheets you pick.
          </p>
          <p className="text-[10px] text-[#888] text-center mt-[6px]">
            No server storage · End-to-end with your Drive
          </p>
        </div>
      </div>

      {/* ── DESKTOP HERO (640px+) ── */}
      <div className="hidden sm:block pt-[60px] px-14 max-w-[900px]">
        <p className="text-[13px] text-[#888] mb-7 uppercase tracking-[0.3px]">
          Budget tracking · Your spreadsheet
        </p>
        <h1
          className="font-semibold leading-[0.95] mb-7 mt-0"
          style={{ fontSize: 'clamp(52px, 7vw, 88px)', letterSpacing: '-2.5px' }}
        >
          Your money,<br /><span style={{ color: '#0F9D58' }}>your sheet.</span>
        </h1>
        <p className="text-[17px] text-[#444] max-w-[420px] leading-[1.4] mb-11">
          Connect a Google Sheet. Track spending. Own your data.
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-[22px] py-[14px] rounded-full text-[14px] font-medium cursor-pointer disabled:opacity-70"
        >
          {isLoading ? spinner : <GoogleG size={16} />}
          Continue with Google
        </button>
        <p className="text-[12px] text-[#888] mt-[14px]">
          We only request access to the sheets you pick.
        </p>
      </div>

      <p className="hidden sm:block absolute left-14 bottom-8 text-[11px] text-[#888]">
        No server storage · End-to-end with your Drive
      </p>
    </div>
  );
}
