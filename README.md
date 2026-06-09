# Ledger

A mobile-first personal budget tracker that uses Google Sheets as a backend. Sign in with Google, connect a spreadsheet, and track spending across categories, payment methods, and fixed expenses — with your data staying entirely in your own Google account.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **State:** Zustand v5 (with `persist` middleware for selected sheet)
- **UI:** Headless UI v2, lucide-react, recharts, framer-motion
- **Date:** date-fns
- **APIs:** Google Sheets API v4, Google Drive API v3 (via `googleapis`)
- **Auth:** NextAuth.js v4 (Google provider, server-side OAuth 2.0 + PKCE)
- **Email:** Resend (access-request notifications)
- **Hosting:** Vercel

## Features

- Sign in with Google (OAuth 2.0, no password)
- Create a new Google Sheet as your budget database — all data lives in your own Drive
- Add, edit, and delete transactions (date, amount, category, card, note)
- Search, sort, and filter transactions by category, card, or keyword
- Dashboard with monthly spending summary, category breakdown, fixed expenses, and savings progress
- Manage categories, payment cards, fixed expenses, savings goals, and monthly income
- **Income entries:** log one-time income additions (bonuses, freelance) alongside the base monthly amount
- Transactions organized into monthly tabs (e.g. "Jun 2026") inside your sheet
- **Per-month config:** each month tab stores its own income and fixed expense amounts, initialized from config defaults at creation time
- **Self-contained past months:** completed months are locked — their income and fixed expenses are frozen in the sheet; only adding/editing/removing transactions can change them
- **Auto-generated months:** missing months between the last recorded month and today are created automatically with current defaults
- **Per-month overrides:** income and fixed expenses can be customized per month; changes write directly to that month's tab
- **Everything tab:** searchable/filterable view of all transactions across all months, plus income vs. spending, category, and fixed expense charts — carry-over transactions are excluded from list totals and all charts
- **Share cards:** shareable image cards (Monthly, Wrapped, Year to Date, Breakdown, Streak) — all spending figures exclude carry-over transactions
- Overspend carry-over: excess spending in a month is carried to the next month as a transaction
- Demo mode at `/demo` — explore the full dashboard without signing in
- Public changelog at `/changelog`
- Docs wiki at `/wiki`
- Mobile-first responsive design

## Getting Started

### 1. Google Cloud Setup

The app uses NextAuth.js server-side OAuth, so you need a Google Cloud project with a Web application OAuth client.

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
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
4. Add your Google account as a **test user**

**Create OAuth credentials:**

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-app.vercel.app/api/auth/callback/google` (production, when ready)
5. Click **Create** and copy the **Client ID** and **Client Secret**

### 2. Install and Configure

```bash
# Clone the repo
git clone <repository-url>
cd Budget

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Google OAuth (Web application client from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret   # generate: openssl rand -base64 32

# Access control — only this email can sign in
ADMIN_EMAIL=your@email.com

# Resend — for access-request notification emails (optional)
RESEND_API_KEY=re_...
```

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
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Landing / sign-in page
│   ├── dashboard/page.tsx              # Main dashboard (Overview, Transactions, Config, Everything tabs)
│   ├── demo/page.tsx                   # Demo mode — full dashboard with sample data, no sign-in
│   ├── sheets/select/page.tsx          # Sheet selector
│   ├── changelog/                      # Public changelog page
│   ├── wiki/                           # Docs wiki (MDX-driven)
│   ├── privacy/                        # Privacy policy
│   ├── terms/                          # Terms of service
│   ├── globals.css                     # Tailwind v4 theme + global styles
│   └── api/
│       ├── auth/[...nextauth]/route.ts # NextAuth catch-all handler
│       ├── request-access/route.ts     # POST — send access-request email via Resend
│       ├── sheets/
│       │   ├── list/route.ts           # GET  — list user's spreadsheets
│       │   ├── create/route.ts         # POST — create new budget sheet
│       │   ├── select/route.ts         # POST — validate and select a sheet
│       │   └── details/route.ts        # GET  — fetch sheet name (for header sync)
│       ├── transactions/
│       │   ├── route.ts                # GET  — fetch all transactions + per-month configs
│       │   ├── add/route.ts            # POST — add a transaction
│       │   ├── update/route.ts         # POST — edit a transaction in place
│       │   └── delete/route.ts         # POST — delete a transaction
│       └── config/
│           ├── route.ts                # GET  — fetch config (defaults)
│           ├── items/route.ts          # POST/PATCH/DELETE — manage categories, cards, expenses, goals
│           ├── income/
│           │   ├── route.ts            # POST — update default monthly income
│           │   ├── override/route.ts   # POST/DELETE — per-month income override
│           │   └── entries/route.ts    # POST/PATCH/DELETE — one-time income entries
│           └── fixed-expense/
│               ├── override/route.ts   # POST/DELETE — per-month fixed expense override
│               └── month-list/route.ts # POST — write full fixed expense list for a month
├── components/
│   ├── sheets/SheetSelector.tsx        # Sheet list + create form
│   └── dashboard/
│       ├── OverviewTab.tsx             # Current month summary, savings, fixed expenses
│       ├── TransactionsTab.tsx         # Transaction list + add/edit form
│       ├── SettingsTab.tsx             # Categories, cards, expenses, goals, income (Config tab)
│       └── EverythingTab.tsx           # All-time transaction list + charts
├── context/
│   └── AuthContext.tsx                 # AuthProvider + useAuth() — wraps NextAuth SessionProvider
├── types/
│   └── next-auth.d.ts                  # Extends Session + JWT to include accessToken
└── lib/
    ├── auth.ts                         # NextAuth authOptions (GoogleProvider config)
    ├── api/auth.ts                     # buildSheetsService — reads session via getServerSession
    ├── google/sheets.ts                # SheetsService class (all Google Sheets operations)
    ├── wiki.ts                         # MDX parser + nav builder for /wiki
    └── store/useStore.ts               # Zustand store
```

## Deployment (Vercel)

```bash
npm install -g vercel
vercel --prod
```

Add the following environment variables in your Vercel project settings:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Your OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your OAuth client secret |
| `NEXTAUTH_URL` | Your production URL (e.g. `https://your-app.vercel.app`) |
| `NEXTAUTH_SECRET` | A strong random value (`openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Email allowed to sign in |
| `RESEND_API_KEY` | Resend API key (optional, for access-request emails) |

Also add your production callback URL (`https://your-app.vercel.app/api/auth/callback/google`) to the **Authorized redirect URIs** in Google Cloud Console.

## License

MIT
