'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleOAuth } from '@/lib/hooks/useGoogleOAuth';

export default function LandingPage() {
  const router = useRouter();
  const { isLoading, login, isConfigError, accessToken, user } = useGoogleOAuth(); // ✅ Add these
  const [showSetup, setShowSetup] = useState(false);

   useEffect(() => {
    if (accessToken && user) {
      console.log('✅ User authenticated, redirecting to dashboard...');
      router.push('/sheets/select'); 
    }
  }, [accessToken, user, router]);

  const handleManualLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      setShowSetup(true);
    }
  };

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
              <li>
                <strong>Create a project:</strong> Go to <a href="https://console.cloud.google.com" target="_blank" className="underline text-amber-600 dark:text-amber-400">Google Cloud Console</a>
              </li>
              <li>
                <strong>Enable APIs:</strong> Enable Google Sheets API and Google Drive API
              </li>
              <li>
                <strong>Create OAuth credentials:</strong> Create OAuth 2.0 Client ID
              </li>
              <li>
                <strong>Add redirect URIs:</strong> Add <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">http://localhost:3000</code>
              </li>
              <li>
                <strong>Configure .env.local:</strong> Add <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id</code>
              </li>
            </ol>
          </div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
            Once configured, restart your dev server and try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary-600/20">
              <span className="text-4xl font-bold text-white">$</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Budget Tracker
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Track your spending with Google Sheets. Simple, private, and yours.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleManualLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#4285F4] hover:bg-[#357AE8] text-white px-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#4285F4]/20 hover:shadow-[#4285F4]/30 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26l5.92-2.86-2.84-2.84A8.91 8.91 0 0 1 12 6.6c-2.44 0-4.68.9-6.36 2.4L5.44 8.34C7.16 9.35 9.39 10 12 10c1.62 0 3.13-.56 4.25-1.5L12 7.74l7.07-3.43c.58-.6 1.34-1.03 2.24-1.23V5.5h2.5v2.5h2.5v1.5h-2.5v2.5h2.5v1.5h-2.5v2.5h2.5v1.5h-2.5v2.5c1.42-.86 2.5-2.3 2.5-4.25" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.61-2.82c-1.02.86-2.34 1.38-3.87 1.38-2.99 0-5.53-2.03-6.46-4.83L3.3 18.06C4.74 20.4 7.64 23 12 23" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.12-1.43.35-2.09V7.07L2.81 9.88 2.25 9.88A8.91 8.91 0 0 1 2 12c0 2.54 1.02 4.86 2.56 6.57l3.38-2.62" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.1.56 4.25 1.5l3.18-3.18C17.45 2.52 15.24 1.6 12 1.6 9.39 1.6 6.96 2.53 5.15 4.16l3.61 2.82C6.5 6.56 9.03 5.38 12 5.38" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              By signing in, you agree to our Terms of Service and Privacy Policy.
              <br />
              Your budget data stays in your own Google Sheet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
