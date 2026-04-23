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
- **Authentication:** Google OAuth 2.0 (Client-side)
- **Data Storage:** Google Sheets API v4

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
# Google OAuth (required)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

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
│   │   ├── sheets/       # Sheet management endpoints
│   │   └── ...           # Other API routes
│   ├── dashboard/        # Main dashboard page
│   ├── sheets/           # Sheet selector page
│   └── ...               # Other pages
├── components/           # React components
│   ├── sheets/          # Sheet selector components
│   ├── transactions/    # Transaction components
│   ├── dashboard/       # Dashboard components
│   └── ...              # Other components
├── lib/                 # Library code
│   ├── google/          # Google API wrappers
│   ├── hooks/           # React hooks
│   ├── store/           # Zustand state store
│   └── ...              # Other utilities
└── styles/
    └── globals.css      # Global styles
```

## Google Cloud Setup

1. Create a Google Cloud Project
2. Enable Google Sheets API and Google Drive API
3. Create OAuth 2.0 credentials
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourapp.vercel.app` (production)

See `GOOGLE_SETUP.md` for full setup instructions.

## Deployment

This project can be deployed to Vercel:

```bash
npm install -g vercel
vercel --prod
```

## License

MIT
