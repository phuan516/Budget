'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store/useStore';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

const TOKEN_EXPIRY_KEY = 'budget_token_expiry';
const USER_KEY = 'budget_user';
const TOKEN_KEY = 'budget_access_token';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

async function loadGoogleSDK() {
  if (window.google) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google SDK'));
    document.body.appendChild(script);
  });
}

export function useGoogleOAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSilentLoading, setIsSilentLoading] = useState(true);
  const [isConfigError, setIsConfigError] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);
  const clearSelectedSheet = useStore((state) => state.clearSelectedSheet);
  const setAvailableSheets = useStore((state) => state.setAvailableSheets);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    const isExpired = storedExpiry ? Date.now() > parseInt(storedExpiry, 10) : !storedToken;

    if (storedToken && storedUser && !isExpired) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      }
      setIsSilentLoading(false);
      return;
    }

    // Token expired or missing — clear everything and require fresh login
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
    setIsSilentLoading(false);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    clearSelectedSheet();
    setAvailableSheets([]);
  }, [clearSelectedSheet, setAvailableSheets]);

  const initializeGoogleLogin = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setIsConfigError(true);
      throw new Error('Google Client ID not configured. Please ask the administrator to set it up.');
    }

    await loadGoogleSDK();
    return clientId;
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    setIsLoading(true);

    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 120000);

    try {
      const clientId = await initializeGoogleLogin();

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google OAuth not loaded yet. Please wait a moment.');
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        error_callback: (err: { type: string; message?: string }) => {
          clearTimeout(timeout);
          setIsLoading(false);
          if (err.type !== 'popup_closed') {
            alert(`Authentication failed: ${err.message ?? err.type}`);
          }
        },
        callback: async (tokenResponse: TokenResponse) => {
          clearTimeout(timeout);

          try {
            if (tokenResponse.error) {
              console.error('OAuth error:', tokenResponse.error);
              alert(`Authentication failed: ${tokenResponse.error}`);
              setIsLoading(false);
              return;
            }

            if (tokenResponse.access_token) {
              const token = tokenResponse.access_token;
              setAccessToken(token);

              abortControllerRef.current = new AbortController();
              const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
                signal: abortControllerRef.current.signal,
              });

              if (!res.ok) throw new Error('Failed to fetch user info');

              const userInfo = await res.json();
              setUser(userInfo);

              const expiresIn = tokenResponse.expires_in ?? 3600;
              localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
              localStorage.setItem(TOKEN_KEY, token);
              localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000));

              setIsLoading(false);
            }
          } catch (err) {
            console.error('Error in OAuth callback:', err);
            alert(`Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setIsLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (error) {
      clearTimeout(timeout);
      console.error('Login initialization failed:', error);
      alert(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [initializeGoogleLogin]);

  return {
    accessToken,
    user,
    isLoading,
    isSilentLoading,
    isConfigError,
    login: handleGoogleLogin,
    logout,
  };
}
