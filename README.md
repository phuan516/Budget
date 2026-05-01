# Ledger

A mobile-first personal budget tracker that uses Google Sheets as a backend. Sign in with Google, connect a spreadsheet, and track spending across categories, payment methods, and fixed expenses — with your data staying entirely in your own Google account.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **State:** Zustand v5 (with `persist` middleware for selected sheet)
- **UI:** Headless UI v2, lucide-react, recharts
- **Date:** date-fns
- **APIs:** Google Sheets API v4, Google Drive API v3 (via `googleapis`)
- **Auth:** Google Identity Services (client-side implicit token flow — no server sessions)
- **Hosting:** Vercel

## Features

- Sign in with Google (OAuth 2.0, no password)
- Create or connect an existing Google Sheet as your budget database
- Add, view, and delete transactions (date, amount, category, card, note)
- Search, sort, and filter transactions by category, card, or keyword
- Dashboard with monthly spending summary, category breakdown, fixed expenses, and savings progress
- Manage categories, payment cards, fixed expenses, savings goals, and monthly income
- Transactions organized into monthly tabs (e.g. "Apr 2026") inside your sheet
- Mobile-first responsive design

## Getting Started

### 1. Google Cloud Setup

The app authenticates via Google and reads/writes your Google Sheet, so you need a Google Cloud project first.

**Create a project and enable APIs:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. "Ledger")
3. In the search bar, find and enable **Google Sheets API**
4. Do the same for **Google Drive API**

**Configure the OAuth consent screen:**

1. Go to **APIs & Services > OAuth consent screen**
2. Set **User type** to External, then fill in the app name and support email
3. Add these scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
4. Add your Google account as a **test user**

**Create OAuth credentials:**

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (development)
   - `https://your-app.vercel.app` (production, when ready)
5. Click **Create** and copy the **Client ID**

### 2. Install and Configure

```bash
# Clone the repo
git clone <repository-url>
cd Budget

# Install dependencies
npm install

# (Optional) Install graphify for AI-assisted codebase exploration in Claude Code
pip install graphifyy

# Set up environment
cp .env.example .env.local
```

Edit `.env.local` and paste your Client ID:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

This is the only required environment variable. The app uses client-side OAuth — there is no server secret.

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the Google account you added as a test user.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing / sign-in page
│   ├── dashboard/page.tsx          # Main dashboard (Overview, Transactions, Settings tabs)
│   ├── sheets/select/page.tsx      # Sheet selector
│   ├── globals.css                 # Tailwind v4 theme + global styles
│   └── api/
│       ├── sheets/
│       │   ├── list/route.ts       # GET  — list user's spreadsheets
│       │   ├── create/route.ts     # POST — create new budget sheet
│       │   └── select/route.ts     # POST — validate and select a sheet
│       ├── transactions/
│       │   ├── route.ts            # GET  — fetch transactions
│       │   ├── add/route.ts        # POST — add a transaction
│       │   └── delete/route.ts     # DELETE — delete a transaction
│       └── config/
│           ├── route.ts            # GET  — fetch config
│           └── update/route.ts     # POST — update config item
├── components/
│   ├── sheets/SheetSelector.tsx    # Sheet list + create form
│   └── dashboard/
│       ├── OverviewTab.tsx         # Monthly summary, savings, fixed expenses
│       ├── TransactionsTab.tsx     # Transaction list + add form
│       └── SettingsTab.tsx         # Categories, cards, expenses, goals, income
└── lib/
    ├── google/sheets.ts            # SheetsService class (all Google Sheets operations)
    ├── hooks/useGoogleOAuth.ts     # Auth state, sign-in/out, token expiry
    └── store/useStore.ts           # Zustand store
```

## Deployment (Vercel)

```bash
npm install -g vercel
vercel --prod
```

Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in your Vercel project's environment variables, and add your production URL (e.g. `https://your-app.vercel.app`) as an **Authorized JavaScript origin** in Google Cloud.

## License

MIT
