# Google OAuth Setup Guide

Follow these steps to enable Google authentication for your Budget Tracker app.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** in the top navigation bar
3. Click **New Project**
4. Enter "Budget Tracker" as the project name
5. Click **Create**

## Step 2: Enable Required APIs

1. In the search bar at the top, type "Sheets API" and select **Google Sheets API**
2. Click **Enable**
3. Search for "Drive API" and select **Google Drive API**
4. Click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. In the left sidebar, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - **Application type**: Web application
   - **Name**: Budget Tracker
   - **User support email**: Your email
   - **Scopes**: Add these scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click **Save and Continue**
4. Back on the Credentials page:
   - **Application type**: Web application
   - **Name**: Budget Tracker Web Client
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
6. Click **Create**

## Step 4: Copy Your Client ID

1. After creating the credentials, click on your OAuth 2.0 Client ID
2. Copy the **Client ID**
3. Open `.env.local` in your project
4. Replace `your_google_client_id_here` with your actual Client ID:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc123xyz789.apps.googleusercontent.com
   ```
5. Save the file

## Step 5: Configure OAuth Consent Screen (if not done)

1. Go to **APIs & Services** > **OAuth consent screen**
2. Fill in the required fields:
   - **Application name**: Budget Tracker
   - **User support email**: Your email
   - **Application logo** (optional)
3. Add scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
4. Add test users (your email address)
5. Click **Save and Continue** through the remaining steps
6. Click **Back to Dashboard**

## Step 6: Restart Your Dev Server

After adding the environment variable:

```bash
# Stop the dev server (Ctrl+C if running)
# Then restart:
npm run dev
```

## Testing

1. Open `http://localhost:3000`
2. Click "Sign in with Google"
3. You should be prompted to allow access
4. After signing in, you'll be redirected to select a sheet

## For Production (Vercel Deployment)

1. Go to your Vercel project settings
2. Add the following environment variable:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your client ID
3. Add your production URL to authorized origins in Google Cloud:
   - `https://your-app.vercel.app`
