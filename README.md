# Budget Tracker App

A mobile-first web application that uses Google Sheets as a backend database for personal budget tracking. Users authenticate with Google, select or create a spreadsheet, and use a modern interface to track spending with categories, payment methods, and fixed expenses.

## Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **UI Components:** shadcn/ui (optional)
- **Date Handling:** date-fns
- **Charts:** recharts
- **Icons:** lucide-react

### Backend
- **API:** Next.js API Routes
- **Authentication:** Google OAuth 2.0
- **Data Storage:** Google Sheets API v4
- **Session Management:** NextAuth.js

## Features

- **Authentication:** Sign in with Google
- **Sheet Selection:** Select or create budget sheets from Google Drive
- **Transaction Management:** Add, edit, delete transactions
- **Configuration:** Manage categories, payment cards, and fixed expenses
- **Dashboard:** View spending overview, category breakdown, and trends
- **Mobile-First:** Responsive design optimized for mobile devices

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud Project with Sheets API and Drive API enabled

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Budget
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# NextAuth
NEXTAUTH_SECRET=generate_random_string_here
NEXTAUTH_URL=http://localhost:3000

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # Google OAuth endpoints
│   │   ├── sheets/       # Sheet management endpoints
│   │   ├── config/       # Configuration endpoints
│   │   └── transactions/ # Transaction endpoints
│   ├── dashboard/        # Main dashboard page
│   ├── sheets/           # Sheet selector page
│   └── settings/         # Settings page
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── sheets/          # Sheet selector components
│   ├── transactions/    # Transaction components
│   ├── dashboard/       # Dashboard components
│   ├── settings/        # Settings components
│   └── layout/          # Layout components
├── lib/                 # Library code
│   ├── google/          # Google API wrappers
│   ├── services/        # Business logic services
│   ├── store/           # Zustand state store
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript types
└── styles/
    └── globals.css      # Global styles
```

## Google Cloud Setup

1. Create a Google Cloud Project
2. Enable Google Sheets API and Google Drive API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback` (development)
   - `https://yourapp.vercel.app/api/auth/callback` (production)

See `SPEC.md` for full setup instructions.

## Deployment

This project can be deployed to Vercel:

```bash
npm install -g vercel
vercel --prod
```

## License

MIT
