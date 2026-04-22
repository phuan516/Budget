# Budget Tracker App - Project Specification

## Project Overview

A mobile-first web application that uses Google Sheets as a backend database for personal budget tracking. Users authenticate with Google, select or create a spreadsheet, and use a modern interface to track spending with categories, payment methods, and fixed expenses.

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand or React Context
- **UI Components:** shadcn/ui (optional, for pre-built components)
- **Date Handling:** date-fns
- **Charts:** recharts or Chart.js
- **Icons:** lucide-react

### Backend
- **API:** Next.js API Routes
- **Authentication:** Google OAuth 2.0
- **Data Storage:** Google Sheets API v4
- **Session Management:** NextAuth.js or custom JWT

### Infrastructure
- **Hosting:** Vercel (recommended) or Netlify
- **Environment:** Node.js 18+
- **Version Control:** Git

---

## Core Features

### 1. Authentication & Setup
- [x] Sign in with Google
- [x] OAuth 2.0 consent with Sheets + Drive permissions
- [x] Sheet selection from user's Google Drive
- [x] Create new budget sheet from template
- [x] Switch between multiple sheets
- [x] Persist selected sheet (localStorage + optional backend)

### 2. Transaction Management
- [x] Add new transactions (mobile-optimized form)
- [x] View recent transactions (list view)
- [x] Edit existing transactions
- [x] Delete transactions
- [x] Search and filter transactions
- [x] Quick-add common expenses

### 3. Configuration
- [x] Manage spending categories
- [x] Manage payment cards/methods
- [x] Set up fixed expenses (rent, subscriptions, etc.)
- [x] All config stored in Google Sheet

### 4. Dashboard & Analytics
- [x] Current month spending overview
- [x] Category breakdown (chart)
- [x] Fixed expenses summary
- [x] Spending trends
- [x] Remaining budget indicators

### 5. Mobile Experience
- [x] Mobile-first responsive design
- [x] PWA support (optional)
- [x] Touch-optimized interactions
- [x] Offline capability (future enhancement)

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Next.js Application             │
│  ┌───────────────────────────────────┐  │
│  │     Pages/Components (React)      │  │
│  │  - Dashboard                      │  │
│  │  - Transaction Form               │  │
│  │  - Sheet Selector                 │  │
│  │  - Settings                       │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│  ┌───────────────▼───────────────────┐  │
│  │      State Management (Zustand)   │  │
│  │  - User session                   │  │
│  │  - Selected sheet                 │  │
│  │  - Config (categories, cards)     │  │
│  │  - Transactions cache             │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│  ┌───────────────▼───────────────────┐  │
│  │       API Routes (/api/*)         │  │
│  │  - /auth/google (OAuth)           │  │
│  │  - /auth/callback                 │  │
│  │  - /sheets/list                   │  │
│  │  - /sheets/create                 │  │
│  │  - /transactions/*                │  │
│  │  - /config/*                      │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼───────────────────────┘
                   │
                   │ HTTPS
                   ▼
         ┌─────────────────────┐
         │  Google APIs        │
         │  - OAuth 2.0        │
         │  - Sheets API v4    │
         │  - Drive API v3     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   Google Sheet      │
         │                     │
         │  Sheet 1: Config    │
         │  Sheet 2: Txns      │
         │  Sheet 3: Summary   │
         └─────────────────────┘
```

---

## Google Sheets Data Structure

### Sheet 1: "Config"

Stores all user configuration settings.

| Column A (Type) | Column B (Name) | Column C (Value) |
|-----------------|-----------------|------------------|
| category        | Groceries       |                  |
| category        | Dining          |                  |
| category        | Transport       |                  |
| category        | Entertainment   |                  |
| category        | Shopping        |                  |
| card            | Chase Sapphire  |                  |
| card            | Amex Gold       |                  |
| card            | Debit Card      |                  |
| card            | Cash            |                  |
| fixed_expense   | Rent            | 1500             |
| fixed_expense   | Internet        | 60               |
| fixed_expense   | Phone           | 45               |
| fixed_expense   | Gym             | 30               |

**Structure:**
- Row 1: Headers (`Type`, `Name`, `Value`)
- Rows 2+: Configuration items
- Type: `category`, `card`, or `fixed_expense`
- Name: Display name
- Value: Amount (for fixed expenses only)

### Sheet 2: "Transactions"

Stores all spending transactions.

| Column A (Date) | Column B (Amount) | Column C (Category) | Column D (Card) | Column E (Note) |
|-----------------|-------------------|---------------------|-----------------|-----------------|
| 2024-01-15      | 45.67             | Groceries           | Chase Sapphire  | Whole Foods     |
| 2024-01-16      | 23.50             | Dining              | Amex Gold       | Lunch downtown  |
| 2024-01-17      | 12.00             | Transport           | Debit Card      | Uber            |
| 2024-01-18      | 89.99             | Shopping            | Chase Sapphire  | Amazon order    |

**Structure:**
- Row 1: Headers (`Date`, `Amount`, `Category`, `Card`, `Note`)
- Rows 2+: Individual transactions
- Date: YYYY-MM-DD format
- Amount: Numeric value (no currency symbol)
- Category: Must match config
- Card: Must match config
- Note: Optional description

### Sheet 3: "Summary" (Optional - Future Enhancement)

Auto-calculated aggregations and formulas.

| Column A (Period) | Column B (Total) | Column C (Category) | Column D (Amount) |
|-------------------|------------------|---------------------|-------------------|
| 2024-01          | 2,345.67         | Groceries           | 450.23            |
| 2024-02          | 2,156.89         | Dining              | 345.67            |

---

## User Flows

### First-Time User Flow

```
1. Landing Page
   ↓
2. Click "Sign in with Google"
   ↓
3. Google OAuth Consent Screen
   - Request Sheets + Drive permissions
   ↓
4. Redirected to Sheet Selector
   - Display: "Create New Budget Sheet" (primary action)
   - Display: List of existing Google Sheets
   ↓
5a. User clicks "Create New"
    → App creates template sheet
    → Stores sheet ID
    → Redirects to Dashboard
    
5b. User selects existing sheet
    → Validates sheet structure
    → If invalid: Offer to fix or choose another
    → If valid: Store sheet ID
    → Redirects to Dashboard
```

### Returning User Flow

```
1. Landing Page
   ↓
2. Click "Sign in with Google"
   ↓
3. Google OAuth (seamless if already authorized)
   ↓
4. Sheet Selector
   - Highlight previously selected sheet
   - Show all available sheets
   - "Create New" option
   ↓
5. User selects sheet
   ↓
6. Dashboard
```

### Add Transaction Flow

```
1. Dashboard
   ↓
2. Click FAB (Floating Action Button) "+"
   ↓
3. Transaction Modal/Bottom Sheet Opens
   - Amount input (large, prominent)
   - Category selector (chips/buttons)
   - Card selector (dropdown)
   - Date picker (defaults to today)
   - Note field (optional)
   ↓
4. User fills form
   ↓
5. Click "Save"
   ↓
6. API call to append row to Transactions sheet
   ↓
7. Success: Close modal, refresh transaction list
   Error: Show error message, keep modal open
```

### Manage Categories Flow

```
1. Dashboard → Settings → Categories
   ↓
2. Display list of categories
   ↓
3. User actions:
   - Add new category: Input field → Save → Update Config sheet
   - Edit category: Inline edit → Save → Update Config sheet
   - Delete category: Confirm → Delete → Update Config sheet
   ↓
4. Real-time sync with Google Sheet
```

---

## API Endpoints

### Authentication

**POST /api/auth/google**
- Initiates OAuth flow
- Redirects to Google consent screen

**GET /api/auth/callback**
- Handles OAuth callback
- Exchanges code for access/refresh tokens
- Creates user session
- Redirects to sheet selector

**POST /api/auth/logout**
- Clears user session
- Revokes tokens (optional)

### Sheets

**GET /api/sheets/list**
- Lists user's Google Sheets
- Requires: Auth token
- Returns: Array of {id, name, modifiedTime, thumbnailLink}

**POST /api/sheets/create**
- Creates new budget sheet from template
- Requires: Auth token
- Returns: {spreadsheetId, spreadsheetUrl}

**POST /api/sheets/select**
- Validates and stores selected sheet
- Requires: sheetId, auth token
- Returns: {valid: boolean, config, error?}

**GET /api/sheets/validate/:sheetId**
- Validates sheet structure
- Returns: {valid: boolean, missing: string[], fixable: boolean}

### Config

**GET /api/config**
- Fetches all config from Config sheet
- Requires: sheetId, auth token
- Returns: {categories: [], cards: [], fixedExpenses: []}

**POST /api/config/category**
- Adds new category
- Body: {name: string}

**PUT /api/config/category/:id**
- Updates category
- Body: {name: string}

**DELETE /api/config/category/:id**
- Deletes category

**POST /api/config/card**
- Adds new payment card

**POST /api/config/fixed-expense**
- Adds new fixed expense
- Body: {name: string, amount: number}

### Transactions

**GET /api/transactions**
- Fetches transactions
- Query params: ?startDate, ?endDate, ?category, ?card, ?limit
- Returns: Array of transactions

**POST /api/transactions**
- Creates new transaction
- Body: {date, amount, category, card, note}

**PUT /api/transactions/:rowIndex**
- Updates transaction at specific row
- Body: {date, amount, category, card, note}

**DELETE /api/transactions/:rowIndex**
- Deletes transaction at row

**GET /api/transactions/summary**
- Returns aggregated data for dashboard
- Returns: {totalSpent, categoryBreakdown, cardBreakdown, monthlyTrend}

---

## Components Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/
│   │   └── callback/page.tsx       # OAuth callback handler
│   ├── sheets/
│   │   └── select/page.tsx         # Sheet selector
│   ├── dashboard/
│   │   └── page.tsx                # Main dashboard
│   ├── settings/
│   │   └── page.tsx                # Settings page
│   └── api/
│       ├── auth/
│       │   ├── google/route.ts
│       │   ├── callback/route.ts
│       │   └── logout/route.ts
│       ├── sheets/
│       │   ├── list/route.ts
│       │   ├── create/route.ts
│       │   ├── select/route.ts
│       │   └── validate/[id]/route.ts
│       ├── config/
│       │   ├── route.ts
│       │   ├── category/route.ts
│       │   ├── card/route.ts
│       │   └── fixed-expense/route.ts
│       └── transactions/
│           ├── route.ts
│           ├── [id]/route.ts
│           └── summary/route.ts
│
├── components/
│   ├── ui/                         # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── auth/
│   │   └── GoogleSignInButton.tsx
│   ├── sheets/
│   │   ├── SheetSelector.tsx
│   │   ├── SheetListItem.tsx
│   │   └── CreateSheetButton.tsx
│   ├── transactions/
│   │   ├── TransactionList.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── TransactionModal.tsx
│   │   └── QuickAddButtons.tsx
│   ├── dashboard/
│   │   ├── SpendingSummary.tsx
│   │   ├── CategoryChart.tsx
│   │   ├── RecentTransactions.tsx
│   │   └── FixedExpensesCard.tsx
│   ├── settings/
│   │   ├── CategoryManager.tsx
│   │   ├── CardManager.tsx
│   │   └── FixedExpenseManager.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── MobileNav.tsx
│       └── FAB.tsx
│
├── lib/
│   ├── google/
│   │   ├── auth.ts                 # OAuth helpers
│   │   ├── sheets.ts               # Sheets API wrapper
│   │   └── drive.ts                # Drive API wrapper
│   ├── services/
│   │   ├── SheetService.ts         # High-level sheet operations
│   │   ├── TransactionService.ts   # Transaction CRUD
│   │   └── ConfigService.ts        # Config CRUD
│   ├── store/
│   │   └── useStore.ts             # Zustand store
│   ├── utils/
│   │   ├── date.ts
│   │   ├── currency.ts
│   │   └── validation.ts
│   └── types/
│       └── index.ts                # TypeScript types
│
└── styles/
    └── globals.css                 # Tailwind + custom styles
```

---

## Data Models (TypeScript)

```typescript
// User & Auth
interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
}

// Sheets
interface Sheet {
  id: string;
  name: string;
  modifiedTime: string;
  thumbnailLink?: string;
}

interface SelectedSheet {
  id: string;
  name: string;
  url: string;
}

// Config
interface Category {
  id: string;
  name: string;
}

interface Card {
  id: string;
  name: string;
}

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

interface Config {
  categories: Category[];
  cards: Card[];
  fixedExpenses: FixedExpense[];
}

// Transactions
interface Transaction {
  id: string;               // Row index in sheet
  date: string;             // YYYY-MM-DD
  amount: number;
  category: string;
  card: string;
  note?: string;
}

interface TransactionInput {
  date: string;
  amount: number;
  category: string;
  card: string;
  note?: string;
}

// Dashboard
interface SpendingSummary {
  totalSpent: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  cardBreakdown: { card: string; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
  fixedExpensesTotal: number;
}
```

---

## UI/UX Design Specifications

### Design System (Wealthsimple-inspired)

**Color Palette:**
```css
/* Primary */
--primary: #5B3FFF;           /* Deep purple */
--primary-hover: #4A2FE8;
--primary-light: #E6E0FF;

/* Neutral */
--background: #FFFFFF;
--surface: #F8F9FA;
--border: #E5E7EB;
--text-primary: #1F2937;
--text-secondary: #6B7280;
--text-muted: #9CA3AF;

/* Semantic */
--success: #10B981;
--error: #EF4444;
--warning: #F59E0B;
--info: #3B82F6;
```

**Typography:**
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */

/* Money/Numbers */
font-weight: 600-700;
font-variant-numeric: tabular-nums;
```

**Spacing:**
```css
--spacing-1: 0.25rem;    /* 4px */
--spacing-2: 0.5rem;     /* 8px */
--spacing-3: 0.75rem;    /* 12px */
--spacing-4: 1rem;       /* 16px */
--spacing-6: 1.5rem;     /* 24px */
--spacing-8: 2rem;       /* 32px */
```

**Borders & Shadows:**
```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
```

### Key UI Components

**1. Dashboard Layout (Mobile)**
```
┌─────────────────────────────┐
│ ← Dashboard    [Avatar] ≡   │  ← Header (sticky)
├─────────────────────────────┤
│                             │
│  This Month                 │
│  $2,345.67                  │  ← Large, bold amount
│  of $3,000 budget           │
│                             │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░  78%      │  ← Progress bar
│                             │
├─────────────────────────────┤
│  Fixed Expenses             │
│  ┌───────────────────────┐ │
│  │ Rent         $1,500   │ │
│  │ Internet     $60      │ │  ← Card-based layout
│  │ Total:       $1,560   │ │
│  └───────────────────────┘ │
├─────────────────────────────┤
│  Spending by Category       │
│  [Pie/Donut Chart]          │  ← Visual breakdown
├─────────────────────────────┤
│  Recent Transactions        │
│  ┌───────────────────────┐ │
│  │ 🛒 Groceries          │ │
│  │    Whole Foods        │ │
│  │    Today  Chase  $45  │ │
│  └───────────────────────┘ │
│  ┌───────────────────────┐ │
│  │ 🍕 Dining             │ │
│  │    Pizza place        │ │
│  │    Yesterday  Cash... │ │
│  └───────────────────────┘ │
│                             │
└─────────────────────────────┘
                [+]  ← FAB (Floating Action Button)
```

**2. Add Transaction Modal (Bottom Sheet)**
```
┌─────────────────────────────┐
│         Add Expense      ✕  │
├─────────────────────────────┤
│                             │
│         $  0.00             │  ← Large input, auto-focus
│         ───────             │
│                             │
│  Category                   │
│  [🛒 Groceries] [🍕 Dining] │  ← Horizontal chips
│  [🚗 Transport] [🎬 Enter.] │
│  [+ Add Category]           │
│                             │
│  Card                       │
│  ┌───────────────────────┐ │
│  │ Chase Sapphire    ▼   │ │  ← Dropdown
│  └───────────────────────┘ │
│                             │
│  Date                       │
│  ┌───────────────────────┐ │
│  │ Today (Jan 15)    📅  │ │
│  └───────────────────────┘ │
│                             │
│  Note (optional)            │
│  ┌───────────────────────┐ │
│  │                       │ │
│  └───────────────────────┘ │
│                             │
│  ┌───────────────────────┐ │
│  │    Add Transaction    │ │  ← Primary button
│  └───────────────────────┘ │
│                             │
└─────────────────────────────┘
```

**3. Sheet Selector**
```
┌─────────────────────────────┐
│  Select Your Budget Sheet   │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐ │
│  │ ➕  Create New        │ │  ← Dashed border
│  │     Budget Sheet      │ │
│  └───────────────────────┘ │
│                             │
│  Your Sheets                │
│                             │
│  ┌───────────────────────┐ │
│  │ 📊 My Budget 2024  ✓  │ │  ← Previously selected
│  │ Modified 2 days ago   │ │
│  └───────────────────────┘ │
│                             │
│  ┌───────────────────────┐ │
│  │ 📊 Personal Finance   │ │
│  │ Modified 1 week ago  →│ │
│  └───────────────────────┘ │
│                             │
│  ┌───────────────────────┐ │
│  │ 📊 Budget Template    │ │
│  │ Modified 2 months ago │ │
│  └───────────────────────┘ │
│                             │
└─────────────────────────────┘
```

### Mobile Interactions

**Touch Targets:**
- Minimum 44x44px for all interactive elements
- Generous padding for list items (16px vertical)
- Swipe gestures for delete/edit (optional)

**Animations:**
- Page transitions: 200ms ease-in-out
- Modal appearance: Slide up from bottom (300ms)
- Button press: Scale(0.95) + shadow reduction
- Loading states: Skeleton screens, not spinners

**Accessibility:**
- High contrast ratios (WCAG AA minimum)
- Large, legible text (16px minimum)
- Clear focus indicators
- Semantic HTML
- ARIA labels where needed

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Basic auth and sheet connection

- [ ] Set up Next.js project with TypeScript + Tailwind
- [ ] Configure Google Cloud Project
  - Enable Sheets API, Drive API
  - Create OAuth 2.0 credentials
  - Set up authorized redirect URIs
- [ ] Implement Google OAuth flow
  - Sign in button
  - Callback handler
  - Session management
- [ ] Build sheet selector UI
  - List user's sheets
  - Select sheet functionality
  - Store sheet ID
- [ ] Create basic layout (header, mobile nav)

**Deliverable:** User can sign in and select a sheet

---

### Phase 2: Core Functionality (Week 2-3)
**Goal:** Read/write transactions

- [ ] Implement SheetsService wrapper
  - Read Config sheet
  - Read Transactions sheet
  - Append transaction
  - Update transaction
  - Delete transaction
- [ ] Build transaction modal
  - Amount input
  - Category selector
  - Card selector
  - Date picker
  - Note field
- [ ] Create transaction list view
- [ ] Implement config management
  - Add/edit/delete categories
  - Add/edit/delete cards
  - Manage fixed expenses
- [ ] Add error handling and validation

**Deliverable:** Fully functional CRUD for transactions and config

---

### Phase 3: Dashboard & Analytics (Week 4)
**Goal:** Visualize spending data

- [ ] Build dashboard layout
- [ ] Implement spending summary
  - Calculate total spent
  - Category breakdown
  - Card breakdown
- [ ] Add charts
  - Category pie/donut chart
  - Monthly trend line chart
- [ ] Fixed expenses card
- [ ] Budget progress indicator
- [ ] Recent transactions widget

**Deliverable:** Beautiful, informative dashboard

---

### Phase 4: Polish & UX (Week 5)
**Goal:** Refine experience

- [ ] Mobile optimization
  - Test on various devices
  - Fix responsive issues
  - Optimize touch interactions
- [ ] Loading states
  - Skeleton screens
  - Optimistic UI updates
- [ ] Empty states
  - No transactions yet
  - No categories configured
- [ ] Settings page
  - Switch sheets
  - Manage account
  - App preferences
- [ ] Performance optimization
  - Caching strategies
  - Debounced search
  - Lazy loading

**Deliverable:** Production-ready app

---

### Phase 5: Advanced Features (Future)
**Goal:** Extended functionality

- [ ] PWA support (offline capability)
- [ ] Receipt photo upload
- [ ] Recurring transaction templates
- [ ] Budget alerts/notifications
- [ ] Multi-currency support
- [ ] Export reports (PDF, CSV)
- [ ] Sharing and collaboration
- [ ] Integrations (Plaid for auto-import)

---

## Google Cloud Setup Checklist

1. **Create Google Cloud Project**
   - Go to console.cloud.google.com
   - Create new project: "Budget Tracker"

2. **Enable APIs**
   - Google Sheets API
   - Google Drive API

3. **Create OAuth 2.0 Credentials**
   - Application type: Web application
   - Name: "Budget Tracker Web"
   - Authorized redirect URIs:
     - http://localhost:3000/api/auth/callback (dev)
     - https://yourapp.vercel.app/api/auth/callback (prod)

4. **Configure OAuth Consent Screen**
   - User type: External
   - App name: "Budget Tracker"
   - User support email: your@email.com
   - Scopes:
     - .../auth/spreadsheets
     - .../auth/drive.readonly
   - Test users: Add your email

5. **Download Credentials**
   - Download client_secret.json
   - Extract CLIENT_ID and CLIENT_SECRET
   - Add to .env.local

---

## Environment Variables

```bash
# .env.local

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# NextAuth (for session encryption)
NEXTAUTH_SECRET=generate_random_string_here
NEXTAUTH_URL=http://localhost:3000

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment Checklist

### Pre-Deploy
- [ ] Environment variables configured in Vercel
- [ ] OAuth redirect URIs include production URL
- [ ] Google Cloud consent screen published
- [ ] Error tracking set up (Sentry, LogRocket)
- [ ] Analytics configured (optional)

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Post-Deploy
- [ ] Test OAuth flow on production URL
- [ ] Verify sheet creation works
- [ ] Test transaction CRUD
- [ ] Mobile testing on real devices
- [ ] Performance monitoring
- [ ] Set up custom domain (optional)

---

## Testing Strategy

### Unit Tests
- API route handlers
- SheetsService methods
- Utility functions
- Validation logic

### Integration Tests
- OAuth flow end-to-end
- Sheet creation and selection
- Transaction CRUD operations
- Config management

### E2E Tests (Playwright)
- User sign-in flow
- Create new budget sheet
- Add multiple transactions
- Edit and delete transactions
- Switch between sheets

### Manual Testing
- Cross-browser (Chrome, Safari, Firefox)
- Mobile devices (iOS, Android)
- Network conditions (slow 3G, offline)
- Error scenarios (invalid tokens, network failures)

---

## Security Considerations

1. **Token Management**
   - Store access/refresh tokens securely
   - Use httpOnly cookies for sessions
   - Implement token rotation
   - Never expose tokens to client

2. **API Security**
   - Validate all user inputs
   - Rate limiting on API routes
   - CORS configuration
   - CSRF protection

3. **OAuth Best Practices**
   - Use state parameter for CSRF
   - Validate redirect URIs
   - Request minimal scopes
   - Implement token revocation

4. **Data Privacy**
   - User owns their data (in their sheet)
   - No server-side persistence of transactions
   - Clear privacy policy
   - GDPR compliance (if applicable)

---

## Performance Targets

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Lighthouse Score:** > 90
- **API Response Time:** < 500ms (95th percentile)
- **Sheet Operations:** < 2s (append, update)

---

## Error Handling Strategy

### Client-Side
```typescript
try {
  await addTransaction(data);
  toast.success("Transaction added!");
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    toast.error("Please reconnect your Google account");
  } else if (error.code === 'NETWORK_ERROR') {
    toast.error("No internet connection");
  } else {
    toast.error("Something went wrong. Please try again.");
  }
}
```

### Server-Side
```typescript
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Validate input
    if (!validateTransaction(body)) {
      return Response.json({ error: 'Invalid data' }, { status: 400 });
    }
    
    // Perform operation
    const result = await sheetsService.addTransaction(body);
    return Response.json(result);
    
  } catch (error) {
    console.error('Transaction error:', error);
    
    // Log to error tracking service
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error);
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Future Enhancements

### Short Term
- Quick-add buttons for common expenses
- Transaction search and filtering
- Spending insights and trends
- Budget vs. actual comparisons

### Medium Term
- Recurring transaction templates
- Multi-month view and navigation
- Export to PDF/CSV
- Dark mode support

### Long Term
- Bank account integration (Plaid)
- Shared budgets (multi-user)
- AI-powered categorization
- Custom reporting and analytics
- Mobile native apps (React Native)

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Drive API](https://developers.google.com/drive/api)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools
- [shadcn/ui Components](https://ui.shadcn.com)
- [Vercel Deployment](https://vercel.com/docs)
- [Google Cloud Console](https://console.cloud.google.com)

### Design Inspiration
- [Wealthsimple](https://www.wealthsimple.com)
- [Mint](https://mint.intuit.com)
- [YNAB](https://www.youneedabudget.com)

---

## Support & Maintenance

### Monitoring
- Error rate tracking
- API latency monitoring
- User session analytics
- Sheet operation success rate

### Updates
- Monthly dependency updates
- Security patches (immediate)
- Feature releases (bi-weekly)
- Bug fixes (as needed)

### User Feedback
- In-app feedback form
- GitHub issues
- Feature request tracking
- User testing sessions

---

## License & Legal

- **License:** MIT (or your choice)
- **Privacy Policy:** Required (user data in their sheets)
- **Terms of Service:** Recommended
- **Google API Terms:** Must comply with Google's policies

---

## Project Metadata

- **Version:** 1.0.0
- **Author:** [Your Name]
- **Created:** April 2026
- **Last Updated:** April 2026
- **Status:** In Development

---

## Quick Start Commands

```bash
# Create project
npx create-next-app@latest budget-tracker --typescript --tailwind --app

# Install dependencies
npm install googleapis zustand date-fns recharts lucide-react

# Development
npm run dev

# Build
npm run build

# Deploy
vercel --prod
```

---

## Summary

This specification provides a complete roadmap for building a Google Sheets-based budget tracking app. The app focuses on:

1. **User Ownership:** Data lives in user's Google Sheet
2. **Simplicity:** Clean, focused feature set
3. **Mobile-First:** Optimized for on-the-go expense tracking
4. **Modern Design:** Fintech-inspired aesthetic
5. **Privacy:** No server-side data storage

Follow the implementation phases sequentially for best results. Start with Phase 1 to establish the foundation, then build upon it incrementally.

Good luck with your project! 🚀
