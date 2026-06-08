'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
  const { loading, signIn, user } = useAuth();
  const selectedSheet = useStore((s) => s.selectedSheet);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(selectedSheet ? '/dashboard' : '/sheets/select');
    }
  }, [loading, user, selectedSheet, router]);

  const handleLogin = () => {
    setIsSigningIn(true);
    signIn('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
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
          <Image src="/ledger-A-512.png" alt="Ledger" width={22} height={22} className="rounded-full shrink-0 max-sm:w-[18px] max-sm:h-[18px]" />
          <span className="text-[15px] font-semibold tracking-[-0.2px] max-sm:text-[13px]">Ledger</span>
        </div>
        <button
          onClick={handleLogin}
          disabled={isSigningIn}
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
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] text-white py-[14px] rounded-full text-[14px] font-medium cursor-pointer disabled:opacity-70"
          >
            {isSigningIn ? spinner : <GoogleG size={16} />}
            Continue with Google
          </button>
          <p className="text-[11px] text-[#888] text-center mt-[10px]">
            or{' '}
            <Link href="/demo" className="underline underline-offset-2 hover:text-[#555]">
              try the demo
            </Link>
          </p>
          <p className="text-[10px] text-[#888] text-center mt-[6px]">
            We only request access to sheets you pick.
          </p>
          <p className="text-[10px] text-[#888] text-center mt-[6px]">
            No server storage · End-to-end with your Drive · <a href="/privacy" className="underline underline-offset-2">Privacy</a> · <a href="/terms" className="underline underline-offset-2">Terms</a> · <a href="/changelog" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Changelog</a>
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
          disabled={isSigningIn}
          className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-[22px] py-[14px] rounded-full text-[14px] font-medium cursor-pointer disabled:opacity-70"
        >
          {isSigningIn ? spinner : <GoogleG size={16} />}
          Continue with Google
        </button>
        <p className="text-[12px] text-[#888] mt-[14px]">
          We only request access to the sheets you pick.{' '}
          <Link href="/demo" className="underline underline-offset-2 hover:text-[#555]">
            Try the demo.
          </Link>
        </p>
      </div>

      <p className="hidden sm:block absolute left-14 bottom-8 text-[11px] text-[#888]">
        No server storage · End-to-end with your Drive · <a href="/privacy" className="underline underline-offset-2 hover:text-[#555]">Privacy</a> · <a href="/terms" className="underline underline-offset-2 hover:text-[#555]">Terms</a> · <a href="/changelog" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#555]">Changelog</a>
      </p>
    </div>
  );
}
