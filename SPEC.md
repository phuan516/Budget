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
- **Authentication:** Google Identity Services (client-side implicit token flow)
- **Data Storage:** Google Sheets API v4 + Google Drive API v3
- **Session Management:** Access token stored in localStorage with expiry tracking; no server-side sessions

### Infrastructure
- **Hosting:** Vercel
- **Environment:** Node.js 18+
- **Version Control:** Git

---

## Features

### Authentication & Setup
- [x] Sign in with Google (GSI implicit token flow)
- [x] OAuth 2.0 consent with Sheets + Drive permissions
- [x] Sheet selection from user's Google Drive
- [x] Create new budget sheet from template (Config tab + month tabs)
- [x] Persist selected sheet across page reloads (Zustand persist → localStorage)
- [x] Token expiry tracking — expired tokens are cleared on page load
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
- [x] Set monthly income
- [x] All config stored in the Google Sheet (Config tab)

### Dashboard & Analytics
- [x] Monthly spending summary
- [x] Category breakdown
- [x] Fixed expenses card
- [x] Savings progress (goal vs. current)
- [x] Overspending carry-over for savings calculations (includes fixed expenses in overspend total)
- [ ] Spending trends (multi-month)
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
│  │  - Dashboard (Overview/Txns/Settings) │
│  │  - Sheet Selector                 │  │
│  │  - Landing / Sign-in              │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│  ┌───────────────▼───────────────────┐  │
│  │      State Management (Zustand)   │  │
│  │  - selectedSheet (persisted)      │  │
│  │  - config (categories, cards...)  │  │
│  │  - transactions                   │  │
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
         │  - OAuth 2.0 (GSI)  │
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

All user configuration in one tab, organized into labeled sections.

```
Row 1:  INCOME          (section header — bold)
Row 2:  Amount          (column header — bold)
Row 3:  <income value>  (e.g. 5000)
Row 4:  (blank)
Row 5:  SAVING GOALS    (section header — bold)
Row 6:  Name  Target  Initial  (column headers — bold)
Row 7+: <saving goal rows>
Row N:  (blank)
Row N+1: CATEGORIES     (section header — bold)
Row N+2: Name           (column header — bold)
Row N+3+: <category name rows>
...
        CARDS           (section header — bold)
        Name            (column header — bold)
        <card name rows>
...
        FIXED EXPENSES  (section header — bold)
        Name  Amount    (column headers — bold)
        <fixed expense rows>
```

Each section is separated by a blank row. The parser locates section headers by exact uppercase match.

### Tab: "MMM YYYY" (one per month, e.g. "Apr 2026")

Created automatically the first time a transaction is added for that month.

```
Row 1:  Fixed Expenses  (section header)
Row 2:  Name  Amount    (column headers)
Row 3+: <fixed expense rows, synced from Config>
Row N:  (blank)
Row N+1: Transactions   (section header)
Row N+2: Date  Amount  Category  Card  Note  (column headers)
Row N+3+: <transaction rows>
```

- **Date:** `YYYY-MM-DD`
- **Amount:** numeric (no currency symbol)
- **Category / Card:** must match names in Config
- **Note:** optional free text

---

## Authentication

Auth is handled entirely client-side via the Google Identity Services JavaScript SDK. There are no server-side OAuth callback routes or refresh tokens. The access token is requested via the implicit flow, stored in localStorage alongside the user profile and an expiry timestamp. On page load, expired tokens are detected and cleared.

Auth state is managed by the `useGoogleOAuth` hook (single source of truth for `accessToken` and `user`). Zustand manages app-level state (selected sheet, config, transactions). Logging out clears both.

All API routes accept an `Authorization: Bearer <token>` header. The token is used server-side to instantiate an OAuth2 client for Google API calls.

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
- Returns: `{ categories, cards, fixedExpenses, monthlyIncome, savingGoals }`

**POST /api/config/update**
- Adds, updates, or deletes a single config item
- Body: `{ sheetId, action: 'add' | 'update' | 'delete', type: 'category' | 'card' | 'fixed_expense' | 'saving_goal' | 'income', item?: {...}, rowIndex?: number }`

### Transactions

**GET /api/transactions**
- Fetches all transactions from all month tabs
- Query: `?sheetId=<id>`
- Returns: `Transaction[]`

**POST /api/transactions/add**
- Appends a transaction to the correct month tab (creates the tab if it doesn't exist)
- Body: `{ sheetId, date, amount, category, card, note }`
- Returns: `{ success: true, transaction }`

**DELETE /api/transactions/delete**
- Deletes a transaction row by row index
- Body: `{ sheetId, sheetName, rowIndex }`

---

## Data Models (TypeScript)

```typescript
// Auth (managed by useGoogleOAuth — not in Zustand)
interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

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

// Config
interface Config {
  categories: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  fixedExpenses: { id: string; name: string; amount: number }[];
  monthlyIncome: number;
  savingGoals: { id: string; name: string; amount: number; initialAmount: number }[];
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
  activeTab: 'overview' | 'transactions' | 'settings';
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
│       ├── sheets/list/route.ts
│       ├── sheets/create/route.ts
│       ├── sheets/select/route.ts
│       ├── transactions/route.ts
│       ├── transactions/add/route.ts
│       ├── transactions/delete/route.ts
│       ├── config/route.ts
│       └── config/update/route.ts
├── components/
│   ├── sheets/SheetSelector.tsx        # Sheet list + create form
│   └── dashboard/
│       ├── OverviewTab.tsx             # Spending summary, savings, fixed expenses
│       ├── TransactionsTab.tsx         # Transaction list + add form
│       └── SettingsTab.tsx             # All config management
└── lib/
    ├── google/sheets.ts                # SheetsService class
    ├── hooks/useGoogleOAuth.ts         # Auth hook
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

### Edit Config

```
Dashboard → Settings tab
  → Add / delete category / card / fixed expense / saving goal
    → POST /api/config/update
      → Optimistic update in Zustand
        → Refreshes from sheet on next load
```

---

## Implementation Phases

### Phase 1: Foundation
- [x] Next.js + TypeScript + Tailwind v4 setup
- [x] Google OAuth (client-side GSI)
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

### Phase 3: Dashboard
- [x] Monthly spending overview
- [x] Fixed expenses card
- [x] Category breakdown
- [x] Savings progress (with overspending carry-over)
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

# Required — Google OAuth client ID (Web application type)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

No server-side secret is needed. Auth uses the GSI implicit token flow.

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel --prod
```

**Checklist:**
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set in Vercel environment variables
- [ ] Production URL added to **Authorized JavaScript origins** in Google Cloud Console
- [ ] OAuth consent screen published (or app verified)

---

## Security Notes

- Access tokens are short-lived (1 hour) and stored in localStorage with an expiry check
- No server-side session storage — each API request re-authenticates with the bearer token
- User data stays in their own Google Sheet; the app never stores transactions server-side
- Minimal OAuth scopes requested: spreadsheets read/write + drive.readonly + userinfo
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
