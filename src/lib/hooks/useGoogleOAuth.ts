'use client';

import { useState, useEffect, useCallback } from 'react';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export function useGoogleOAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigError, setIsConfigError] = useState(false);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('budget_user');
    const storedToken = localStorage.getItem('budget_access_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
      } catch (e) {
        localStorage.removeItem('budget_user');
        localStorage.removeItem('budget_access_token');
      }
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('budget_user');
    localStorage.removeItem('budget_access_token');
  }, []);

  const initializeGoogleLogin = useCallback(async () => {
    // Check if Google Client ID is configured
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setIsConfigError(true);
      throw new Error('Google Client ID not configured. Please ask the administrator to set it up.');
    }

    // Load Google Identity Services script if not already loaded
    if (!window.google) {
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

    return clientId;
  }, []);

  const handleGoogleLogin = useCallback(async () => {
  setIsLoading(true);
  
  // Auto-reset loading after 2 minutes if no response
  const timeout = setTimeout(() => {
    setIsLoading(false);
  }, 120000); // 2 minutes

  try {
    const clientId = await initializeGoogleLogin();

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google OAuth not loaded yet. Please wait a moment.');
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (tokenResponse: any) => {
        clearTimeout(timeout); // Clear timeout when callback fires
        
        try {
          if (tokenResponse.error) {
            console.error('OAuth error:', tokenResponse.error);
            alert(`Authentication failed: ${tokenResponse.error}`);
            setIsLoading(false);
            return;
          }

          if (tokenResponse && tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            setAccessToken(token);

            const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
              throw new Error('Failed to fetch user info');
            }

            const userInfo = await res.json();
            setUser(userInfo);
            localStorage.setItem('budget_user', JSON.stringify(userInfo));
            localStorage.setItem('budget_access_token', token);
            
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
    isConfigError,
    login: handleGoogleLogin,
    logout
  };
}
