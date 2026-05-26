'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { SessionProvider, useSession, signIn as nextSignIn, signOut as nextSignOut } from 'next-auth/react';

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

  return (
    <AuthContext.Provider value={{
      user, loading,
      signIn: (callbackUrl = '/dashboard') => nextSignIn('google', { callbackUrl }, { prompt: 'select_account' }),
      signOut: () => nextSignOut({ callbackUrl: '/' }),
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
