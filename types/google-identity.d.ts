interface TokenResponse {
  access_token: string;
  error?: string;
  error_description?: string;
  token_type?: string;
  expires_in?: number;
}

interface TokenClient {
  requestAccessToken(config?: { prompt?: string }): void;
}

interface GoogleIdentityOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message?: string }) => void;
  }): TokenClient;
}

interface GoogleIdentityAccounts {
  oauth2: GoogleIdentityOAuth2;
}

interface GoogleIdentity {
  accounts: GoogleIdentityAccounts;
}

interface Window {
  google?: {
    accounts: GoogleIdentityAccounts;
  };
}
