'use client';
import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { SessionProvider, useSession, signIn as nextSignIn, signOut as nextSignOut } from 'next-auth/react';
import { useStore } from '@/lib/store/useStore';

interface AuthContextType {
  user: { name: string; email: string } | null;
  loading: boolean;
  signIn: (callbackUrl?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthContextInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const user = session?.user
    ? { name: session.user.name ?? session.user.email ?? 'User', email: session.user.email ?? '' }
    : null;

  const signingOut = useRef(false);
  const clearSelectedSheet = useStore((s) => s.clearSelectedSheet);

  const handleSignOut = useCallback(() => {
    if (signingOut.current) return;
    signingOut.current = true;
    clearSelectedSheet();
    nextSignOut({ callbackUrl: '/' });
  }, [clearSelectedSheet]);

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      if (signingOut.current) return;
      signingOut.current = true;
      clearSelectedSheet();
      nextSignOut({ redirect: false }).then(() => {
        window.location.href = '/';
      });
    }
  }, [session, clearSelectedSheet]);

  return (
    <AuthContext.Provider value={{
      user, loading,
      signIn: (callbackUrl = '/dashboard') => nextSignIn('google', { callbackUrl }, { prompt: 'consent' }),
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider><AuthContextInner>{children}</AuthContextInner></SessionProvider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
