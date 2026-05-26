# Ledger — Project Specification

## Overview

A mobile-first web application that uses Google Sheets as a backend database for personal budget tracking. Users sign in with Google, select or create a spreadsheet, and use a modern interface to track spending with categories, payment methods, fixed expenses, and savings goals. All data lives in the user's own Google account — no server-side persistence.

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand v5 (with `persist` middleware for selected sheet)
- **UI Components:** Headless UI v2
- **Date Handling:** date-fns
- **Charts:** recharts
- **Icons:** lucide-react

### Backend
- **API:** Next.js API Routes
- **Authentication:** NextAuth.js v4 with Google provider (server-side OAuth 2.0 authorization code flow + PKCE)
- **Data Storage:** Google Sheets API v4 + Google Drive API v3
- **Session Management:** Access token stored in NextAuth's encrypted JWT (httpOnly cookie); no localStorage

### Infrastructure
- **Hosting:** Vercel
- **Environment:** Node.js 18+
- **Version Control:** Git

---

## Features

### Authentication & Setup
- [x] Sign in with Google (NextAuth.js server-side OAuth 2.0 + PKCE)
- [x] OAuth 2.0 consent with Sheets + Drive permissions
- [x] Sheet selection from user's Google Drive
- [x] Create new budget sheet from template (Config tab + month tabs)
- [x] Persist selected sheet across page reloads (Zustand persist → localStorage)
- [x] Session management via NextAuth JWT (httpOnly cookie, no manual expiry tracking)
- [x] Auto sign-in and auto sheet selection on return visits
- [ ] Switch between multiple sheets (UI not yet built)

### Transaction Management
- [x] Add new transactions (date, amount, category, card, note)
- [x] View transactions (list view, current month)
- [x] Delete transactions
- [ ] Edit existing transactions
- [x] Search transactions by category, note, or card
- [x] Filter transactions by category and card
- [x] Sort transactions by date or amount (ascending/descending)

### Configuration
- [x] Manage spending categories
- [x] Manage payment cards/methods
- [x] Manage fixed expenses (name + amount)
- [x] Manage savings goals (name + target + initial amount)
- [x] Set monthly income (default for new months)
- [x] All config stored in the Google Sheet (Config tab) as defaults
- [x] Per-month income override with optional note
- [x] Per-month fixed expense amount override with optional note

### Per-Month Config (Self-Contained Months)
- [x] Each month tab stores its own copy of income and fixed expenses at creation time
- [x] Config tab serves as defaults only — past months are never retroactively changed
- [x] Missing past month tabs (between latest existing tab and today) are auto-generated with current defaults
- [x] Completed months are locked — only adding/removing transactions can change them
- [x] Overriding income or a fixed expense for a month writes directly to that month's tab

### Dashboard & Analytics
- [x] Monthly spending summary
- [x] Category breakdown
- [x] Fixed expenses card (per-month amounts, with override support)
- [x] Savings progress (goal vs. current)
- [x] Overspending carry-over for savings calculations (excess spending carried to next month)
- [x] Past-month leftover banner in Transactions tab — shows remaining or overspent amount for past months; leftover can be allocated to a savings goal
- [x] Everything tab — searchable/filterable view of all transactions across all months
- [x] Everything tab — income vs. spending chart (per month)
- [x] Everything tab — category breakdown chart (all time)
- [x] Everything tab — fixed expense chart (per month)
- [ ] Budget vs. actual comparisons

### Mobile Experience
- [x] Mobile-first responsive design
- [x] Touch-optimized UI
- [ ] PWA / offline support

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Next.js Application             │
│  ┌───────────────────────────────────┐  │
│  │     Pages/Components (React)      │  │
│  │  - Dashboard (Overview/Txns/      │  │
│  │    Settings/Everything)           │  │
│  │  - Sheet Selector                 │  │
│  │  - Landing / Sign-in              │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│  ┌───────────────▼───────────────────┐  │
│  │      State Management (Zustand)   │  │
│  │  - selectedSheet (persisted)      │  │
│  │  - config (categories, cards...)  │  │
│  │  - transactions                   │  │
│  │  - monthTabKeys, monthConfigs     │  │
│  │  - activeTab, isSidebarOpen       │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│  ┌───────────────▼───────────────────┐  │
│  │       API Routes (/api/*)         │  │
│  │  - /sheets/list                   │  │
│  │  - /sheets/create                 │  │
│  │  - /sheets/select                 │  │
│  │  - /transactions (GET/POST/DELETE)│  │
│  │  - /config (GET/POST update)      │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼───────────────────────┘
                   │ HTTPS + Bearer token
                   ▼
         ┌─────────────────────┐
         │  Google APIs        │
         │  - OAuth 2.0        │
         │    (NextAuth/PKCE)  │
         │  - Sheets API v4    │
         │  - Drive API v3     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   Google Sheet      │
         │                     │
         │  Tab: Config        │
         │  Tab: Jan 2026      │
         │  Tab: Feb 2026      │
         │  Tab: Apr 2026      │
         │  ...                │
         └─────────────────────┘
```

---

## Google Sheets Data Structure

### Tab: "Config"

All user configuration defaults in one tab, organized into labeled sections. This tab is the source of truth for **defaults only** — past month tabs are never retroactively changed when config is updated.

```
Row 1:  INCOME                  (section header — bold)
Row 2:  Amount                  (column header — bold)
Row 3:  <income value>          (e.g. 5000)
Row 4:  (blank)
Row 5:  INCOME OVERRIDES        (section header — bold)
Row 6:  Month  Amount  Note     (column headers — bold)
Row 7+: <monthKey, overrideAmount, optional note>  (e.g. "2026-03", 4500, "part-time month")
Row N:  (blank)
Row N+1: FIXED EXPENSE OVERRIDES  (section header — bold, added lazily)
Row N+2: Month  Name  Amount  Note  (column headers — bold)
Row N+3+: <monthKey, expenseName, overrideAmount, optional note>
...
        SAVING GOALS            (section header — bold)
        Name  Target  Initial   (column headers — bold)
        <saving goal rows>
...
        CATEGORIES              (section header — bold)
        Name                    (column header — bold)
        <category name rows>
...
        CARDS                   (section header — bold)
        Name                    (column header — bold)
        <card name rows>
...
        FIXED EXPENSES          (section header — bold)
        Name  Amount            (column headers — bold)
        <fixed expense rows>
```

Each section is separated by a blank row. The parser locates section headers by exact uppercase match.

**Override storage:** `INCOME OVERRIDES` is present in the initial sheet template. `FIXED EXPENSE OVERRIDES` is added lazily. Both sections are read by `readConfig` and returned by `GET /api/config`. The primary write path for overrides is the month tab itself (`setMonthTabIncome`, `setMonthTabFixedExpenseAmount`) — the Config tab sections serve as a secondary index for old-format tabs that predate the self-contained month tab structure.

### Tab: "MMM YYYY" (one per month, e.g. "Apr 2026")

Created automatically when a transaction is added for a new month, or auto-generated for any gap between the latest existing tab and the current month. Each tab is **self-contained** — it stores its own income and fixed expense amounts, initialized from Config defaults at creation time.

```
Row 1:  [Month] Budget  (title — bold, e.g. "Apr 2026 Budget")
Row 2:  (blank)
Row 3:  INCOME          (section header — bold)
Row 4:  Amount  Note    (column headers — bold)
Row 5:  <income value>  <optional note>
Row 6:  (blank)
Row 7:  FIXED EXPENSES  (section header — bold)
Row 8:  Name  Amount  Note  (column headers — bold)
Row 9+: <fixed expense rows with amounts and optional notes>
Row N:  (blank)
Row N+1: TRANSACTIONS   (section header — bold)
Row N+2: Date  Amount  Category  Card  Note  (column headers — bold)
Row N+3+: <transaction rows>
```

- **Date:** `YYYY-MM-DD`
- **Amount:** numeric (no currency symbol)
- **Category / Card:** must match names in Config
- **Note:** optional free text
- Past month tabs are locked — only adding or removing transactions can change them (income and fixed expenses reflect what was stored at creation or override time)

---

## Authentication

Auth is handled server-side via **NextAuth.js v4** with the Google provider. The flow uses the OAuth 2.0 authorization code flow with PKCE — there is no client-side token handling or localStorage involvement.

- **Callback route:** `GET/POST /api/auth/[...nextauth]` — NextAuth's catch-all handler
- **Config:** `src/lib/auth.ts` — GoogleProvider with `access_type: offline`, `prompt: select_account`, and scopes for spreadsheets + drive.readonly
- **Session:** The access token is stored in NextAuth's encrypted JWT (httpOnly cookie). The JWT callback saves `account.access_token` into the token; the session callback exposes it as `session.accessToken`.
- **Client auth state:** `src/context/AuthContext.tsx` — wraps `SessionProvider` and exposes a `useAuth()` hook with `{ user, loading, signIn, signOut }`. `signIn` calls `nextSignIn('google', { callbackUrl })` and `signOut` redirects to `/`.
- **Server auth:** `src/lib/api/auth.ts` — `buildSheetsService()` calls `getServerSession(authOptions)` to retrieve the token, then instantiates an `OAuth2Client` for Google API calls. No `Authorization` header is read from requests.
- **TypeScript:** `src/types/next-auth.d.ts` extends the `Session` and `JWT` types to include `accessToken?: string`.

Zustand manages app-level state (selected sheet, config, transactions). Logging out via `useAuth().signOut()` clears the NextAuth session and redirects to `/`.

---

## API Endpoints

### Sheets

**GET /api/sheets/list**
- Lists user's Google Sheets via Drive API
- Requires: `Authorization` header
- Returns: `SheetMetadata[]` — `{ id, name, modifiedTime, thumbnailLink, ownedByMe }`

**POST /api/sheets/create**
- Creates a new budget sheet with Config tab and section structure
- Body: `{ name: string }`
- Returns: `{ id, url, name }`

**POST /api/sheets/select**
- Validates that the chosen sheet has a Config tab
- Body: `{ sheetId: string }`
- Returns: `{ valid: true, sheet: { id, name, url } }` or `{ valid: false, error: string }`

### Config

**GET /api/config**
- Reads the Config tab and parses all sections
- Query: `?sheetId=<id>`
- Returns: `{ categories, cards, fixedExpenses, monthlyIncome, monthlyIncomeOverrides, monthlyIncomeOverrideNotes, fixedExpenseOverrides, fixedExpenseOverrideNotes, savingGoals }`

**POST /api/config/items**
- Adds a config item (category, card, fixed_expense, saving_goal)
- Body: `{ sheetId, type, name, value?, extra? }`

**PATCH /api/config/items**
- Edits a config item by row index
- Body: `{ sheetId, type, rowIndex, name, value?, extra? }`

**DELETE /api/config/items**
- Removes a config item by row index
- Body: `{ sheetId, type, rowIndex }`

When the `type` is `fixed_expense`, all three endpoints sync the change to the current month tab and all future month tabs; past month tabs are left unchanged.

**POST /api/config/income**
- Updates the default monthly income in the Config tab and syncs the current month tab
- Body: `{ sheetId, income: number }`

**POST /api/config/income/override**
- Writes an income override to a specific month tab
- Body: `{ sheetId, monthKey, income: number, note? }`

**DELETE /api/config/income/override**
- Resets a month tab income to the current Config default
- Body: `{ sheetId, monthKey }`

**POST /api/config/fixed-expense/override**
- Writes a fixed expense amount override to a specific month tab
- Body: `{ sheetId, monthKey, expenseName, income: number, note? }`

**DELETE /api/config/fixed-expense/override**
- Resets a month tab fixed expense to the current Config default
- Body: `{ sheetId, monthKey, expenseName }`

### Transactions

**GET /api/transactions**
- Reads all month tabs; auto-generates any missing past month tabs; reads per-month income and fixed expenses from each tab
- Query: `?sheetId=<id>`
- Returns: `{ transactions: Transaction[], monthTabKeys: string[], monthConfigs: Record<string, MonthConfig> }`

**POST /api/transactions/add**
- Appends a transaction to the correct month tab (creates the tab with current Config defaults if it doesn't exist)
- Body: `{ sheetId, date, amount, category, card, note }`
- Returns: `{ success: true, transaction }`

**DELETE /api/transactions/delete**
- Deletes a transaction row by row index
- Body: `{ sheetId, sheetName, rowIndex }`

---

## Data Models (TypeScript)

```typescript
// Auth (managed by NextAuth + AuthContext — not in Zustand)
// Session shape (extended in src/types/next-auth.d.ts):
// session.user: { name, email, image } | null
// session.accessToken: string | undefined

// Sheet references
interface SheetMetadata {
  id: string;
  name: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  ownedByMe?: boolean;
}

interface SelectedSheet {
  id: string;
  name: string;
  url: string;
}

// Config (defaults + override maps — stored in Config tab)
interface Config {
  categories: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  fixedExpenses: { id: string; name: string; amount: number }[];
  monthlyIncome: number;
  monthlyIncomeOverrides: { [monthKey: string]: number };
  monthlyIncomeOverrideNotes: { [monthKey: string]: string };
  fixedExpenseOverrides: { [monthKey: string]: { [expenseName: string]: number } };
  fixedExpenseOverrideNotes: { [monthKey: string]: { [expenseName: string]: string } };
  savingGoals: { id: string; name: string; amount: number; initialAmount: number }[];
}

// Per-month config (stored in each month tab, returned alongside transactions)
interface MonthConfig {
  income?: number;
  incomeNote?: string;
  fixedExpenses: { name: string; amount: number; note?: string }[];
}

// Transactions
interface Transaction {
  id: string;       // row index within the month sheet (used for deletion)
  date: string;     // YYYY-MM-DD
  amount: number;
  category: string;
  card: string;
  note: string;
}
```

### Zustand Store (persisted key: `budget-store`)

Only `selectedSheet` is persisted to localStorage. All other state is re-fetched on load.

```typescript
interface BudgetStore {
  selectedSheet: SelectedSheet | null;
  availableSheets: SheetMetadata[];
  config: Config;
  transactions: Transaction[];
  monthTabKeys: string[];                        // keys of all existing month tabs (e.g. "2026-04")
  monthConfigs: Record<string, MonthConfig>;     // per-month income + fixed expenses, keyed by "YYYY-MM"
  activeTab: 'overview' | 'transactions' | 'settings' | 'everything';
  isSidebarOpen: boolean;
}
```

---

## Components

```
src/
├── app/
│   ├── page.tsx                        # Landing / sign-in
│   ├── dashboard/page.tsx              # Dashboard with tab nav
│   ├── sheets/select/page.tsx          # Sheet selector
│   ├── globals.css                     # Tailwind v4 theme + global styles
│   └── api/
│       ├── auth/[...nextauth]/route.ts # NextAuth catch-all handler
│       ├── sheets/list/route.ts
│       ├── sheets/create/route.ts
│       ├── sheets/select/route.ts
│       ├── transactions/route.ts       # GET — returns transactions + monthTabKeys + monthConfigs
│       ├── transactions/add/route.ts
│       ├── transactions/delete/route.ts
│       ├── config/route.ts
│       ├── config/items/route.ts
│       ├── config/income/route.ts
│       ├── config/income/override/route.ts
│       └── config/fixed-expense/override/route.ts
├── components/
│   ├── sheets/SheetSelector.tsx        # Sheet list + create form
│   └── dashboard/
│       ├── OverviewTab.tsx             # Spending summary, savings, fixed expenses (per-month config)
│       ├── TransactionsTab.tsx         # Transaction list + add form
│       ├── SettingsTab.tsx             # All config management (defaults)
│       └── EverythingTab.tsx           # All-time transaction list + income/category/fixed expense charts
├── context/
│   └── AuthContext.tsx                 # AuthProvider + useAuth() — wraps NextAuth SessionProvider
├── types/
│   └── next-auth.d.ts                  # Extends Session + JWT to include accessToken
└── lib/
    ├── auth.ts                         # NextAuth authOptions (GoogleProvider config)
    ├── api/auth.ts                     # buildSheetsService — reads session via getServerSession
    ├── google/sheets.ts                # SheetsService class + exported helpers (monthKeyToLabel, etc.)
    └── store/useStore.ts               # Zustand store
```

---

## UI/UX Design

### Design System (Wealthsimple-inspired)

**Primary Color Scale (defined in `globals.css`):**
```css
--color-primary-50:  #f4f3ff;
--color-primary-100: #ece9fe;
--color-primary-200: #ddd6fd;
--color-primary-300: #c4b5fc;
--color-primary-400: #a387fa;
--color-primary-500: #7c56f8;
--color-primary-600: #5B3FFF;   /* main brand */
--color-primary-700: #4A2FE8;   /* hover */
--color-primary-800: #3b21c4;
--color-primary-900: #2d1899;
--color-primary-950: #1c0f63;
```

**Semantic Colors:**
```css
--success: #10B981;
--error:   #EF4444;
--warning: #F59E0B;
--info:    #3B82F6;
```

**Typography:**
- Body: Inter
- Monospace/numbers: JetBrains Mono
- Minimum body font size: 16px

**Mobile Interactions:**
- Minimum touch target: 44×44px
- Modal appearance: slide up from bottom (300ms)
- Button press: `scale(0.95)` + shadow reduction
- Loading states: skeleton screens

---

## User Flows

### First-Time User

```
Landing page
  → Sign in with Google
    → Google OAuth consent (Sheets + Drive scopes)
      → Sheet selector
        → Create new sheet OR select existing sheet
          → Dashboard
```

### Returning User

```
Landing page
  → Auto sign-in (if token still valid)
    → Auto-select last used sheet
      → Dashboard
```

### Add Transaction

```
Dashboard → Transactions tab
  → Fill form (date, amount, category, card, note)
    → POST /api/transactions/add
      → Success: form clears, list refreshes
      → Error: message shown, form stays open
```

### Edit Config (Defaults)

```
Dashboard → Settings tab
  → Add / delete category / card / fixed expense / saving goal
    → POST / PATCH / DELETE /api/config/items
      → Optimistic update in Zustand
        → Refreshes from sheet on next load
        → Fixed expense changes synced to current + future month tabs only
```

### Override Income or Fixed Expense for a Month

```
Dashboard → Overview tab
  → Edit income or fixed expense for current month
    → POST /api/config/income/override or POST /api/config/fixed-expense/override
      → Written directly to that month's tab in the sheet
      → Past months unaffected; change visible immediately
```

---

## Implementation Phases

### Phase 1: Foundation
- [x] Next.js + TypeScript + Tailwind v4 setup
- [x] Google OAuth (NextAuth.js server-side, migrated from client-side GSI)
- [x] Sheet selector UI (list + create)
- [x] Sheet creation with Config template
- [x] Sheet validation on select
- [x] Persist selected sheet across reloads

### Phase 2: Core Functionality
- [x] SheetsService (read/write Config and transactions)
- [x] Monthly sheet tabs (auto-created per month)
- [x] Transaction list view
- [x] Add transaction form
- [x] Delete transaction
- [x] Config management (categories, cards, fixed expenses)
- [x] Savings goals + monthly income configuration

### Phase 3: Dashboard & Analytics
- [x] Monthly spending overview
- [x] Fixed expenses card
- [x] Category breakdown
- [x] Savings progress (with overspending carry-over)
- [x] Everything tab (all-time transaction list + charts)
- [x] Per-month config (self-contained month tabs, income + fixed expense overrides)
- [x] Auto-generation of missing past month tabs
- [ ] Multi-month trend chart

### Phase 4: Polish
- [x] Mobile-responsive layout
- [ ] Skeleton loading states
- [ ] Empty state screens
- [ ] Switch sheets from dashboard

### Phase 5: Future
- [ ] PWA / offline support
- [ ] Receipt photo upload
- [ ] Recurring transaction templates
- [ ] Budget vs. actual alerts
- [ ] Multi-currency
- [ ] Export to PDF/CSV
- [ ] Bank import (Plaid)

---

## Environment Variables

```bash
# .env.local

# Google OAuth credentials (Web application type in Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000          # set to your production URL in Vercel
NEXTAUTH_SECRET=your_random_secret          # generate with: openssl rand -base64 32

# Access control
ADMIN_EMAIL=your@email.com                  # email allowed to sign in
```

**Google Cloud Console setup:**
- OAuth client type must be **Web application**
- Add `http://localhost:3000/api/auth/callback/google` to **Authorized redirect URIs**
- Add your production URL's callback to redirect URIs before deploying

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel --prod
```

**Checklist:**
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` set in Vercel environment variables
- [ ] Production callback URL (`https://yourdomain.com/api/auth/callback/google`) added to **Authorized redirect URIs** in Google Cloud Console
- [ ] OAuth consent screen published (or app verified for sensitive scopes)

---

## Security Notes

- Access tokens are stored in NextAuth's encrypted JWT (httpOnly cookie, not localStorage) — not accessible to client-side JS
- Server-side session lookup via `getServerSession` on each API request; no bearer token passed from client
- `NEXTAUTH_SECRET` must be a strong random value — used to sign/encrypt the JWT cookie
- User data stays in their own Google Sheet; the app never stores transactions server-side
- Minimal OAuth scopes requested: spreadsheets read/write + drive.readonly + userinfo + openid
- All user input is passed through the Google Sheets API which handles its own injection protection; no direct SQL or shell execution

---

## Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse score: > 90
- Google Sheets API round-trip: < 2s

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Drive API](https://developers.google.com/drive/api)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

## Project Metadata

- **Version:** 1.0.0
- **Created:** April 2026
- **Status:** Active development (Phase 1–3 complete)
