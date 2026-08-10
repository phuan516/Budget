# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone with a Google account who wants a personal budget tracker without handing their financial data to a third-party server. Not limited to an invite list by design — the product intends open sign-up. It is currently gated behind Google's OAuth "Testing" publishing status (an allowlist of test users / `ADMIN_EMAIL`), which is a development-stage constraint, not the intended long-term audience.

## Product Purpose

Ledger is a mobile-first personal budget tracker that uses the user's own Google Sheet as its database. Users sign in with Google, connect (or auto-create) a spreadsheet, and track spending by category, payment card, and fixed expenses, with savings goals and monthly income tracking. Success means users can see and control their spending without their financial data ever living on Ledger's own servers.

## Positioning

The mechanism a competing budget app (Mint, YNAB, etc.) could not truthfully copy: all financial data lives in the user's own Google Sheet, in their own Drive — nothing is stored on Ledger's servers. This is inspectable and exportable, not a marketing claim; the user can open the underlying spreadsheet at any time.

## Operating Context

- Sign-in via Google OAuth (NextAuth, PKCE), scoped to `drive.file` (only sheets the user creates or opens with the app)
- Users connect a new or existing Google Sheet as their budget database; data is organized into monthly tabs inside the sheet
- Dashboard has Overview, Transactions, Config, and Everything tabs
- Demo mode at `/demo`: fully interactive dashboard with sample data, no sign-in required
- Public changelog at `/changelog`; docs wiki at `/wiki`
- Currently gated by Google's OAuth "Testing" publishing status (test-user allowlist) — an in-progress constraint on the way to open sign-up, not a permanent product decision

## Capabilities and Constraints

- Next.js 16 (App Router) + TypeScript, Tailwind CSS v4, Zustand v5, NextAuth v4
- Google Sheets API v4 + Drive API v3 via `googleapis`
- Mobile-first responsive design
- Open sign-up requires moving the Google OAuth consent screen out of "Testing" (app verification) — undecided, not yet actioned

## Brand Commitments

- Product name: **Ledger**
- Landing page tagline: "Your money, your sheet."
- Accent color is drawn from the app's own `--color-saved` design token (`#0F9D58`) — a deliberate link between the brand moment and a savings/positive-money meaning, not an arbitrary accent

## Evidence on Hand

- A full interactive demo at `/demo` with sample data across all four dashboard tabs — real, working proof of the product, usable directly as landing-page evidence
- No existing screenshots, testimonials, press, or case studies on hand; future work must not fabricate these

## Product Principles

1. The user owns their data — nothing proprietary; everything is inspectable and exportable via their own Google Sheet.
2. No server storage of financial data — trust comes from architecture, not just a promise.
3. Mobile-first — the primary usage context is a phone, not a desktop.
4. Personal-tool feel over corporate SaaS — sparse and confident, not salesy.
5. Demo-first proof — let people use the real dashboard before asking for OAuth access, rather than just describing it.
