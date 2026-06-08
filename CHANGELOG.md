# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-07

Initial public release.

### Added

- Public changelog page at `/changelog` — reverse-chronological feed of releases with New / Improved / Fixed tags, version rail with scrollspy, and email subscribe.
- Google Sign-In authentication — no separate account or password needed.
- Google Sheets integration — connect any sheet you own; Ledger reads and writes directly to your spreadsheet with nothing stored on Ledger servers.
- Google OAuth scope limited to `drive.file` — Ledger only requests access to the specific sheets you select, not your entire Drive.
- Sheet selector — connect an existing spreadsheet or create a new one from within the app. Switch sheets at any time from the header.
- Demo mode — explore the full app at `/demo` without signing in.
- Monthly overview with total committed spend vs. income progress bar, segmented by variable, fixed, and carry-over spend.
- Income ledger — set recurring monthly income, log one-time additions (bonuses, freelance payments), and override income for any specific month.
- Stat grid showing today's spend, this week's spend, daily average, projected end-of-month total, and remaining budget.
- Daily spend heatmap calendar shaded by spend intensity with per-day amount and entry-count tooltips.
- No-spend streak counter alongside biggest and cheapest spending day stats.
- Spending breakdown by category with percentage bars and saving goals progress tracker.
- Fixed expense breakdown with per-item monthly override support.
- Add expenses and refunds with date, amount, category, card/payment method, and an optional note.
- Month navigation for browsing any past month's transactions.
- Search by keyword; filter by category or card; sort by date or amount.
- Inline edit and delete for any transaction.
- Leftover banner on closed months — see unspent budget and move it to a saving goal in one click.
- Share cards — export the current month as a styled image in five formats: Breakdown, Monthly Recap, Streak, Year to Date, and Wrapped.
- Settings panel for managing categories, cards and payment methods, recurring fixed expenses, and saving goals.
- Fixed expense entry accepts both a dollar amount and a percentage-of-income field that stay in sync.
- Saving goals with a target amount, optional starting balance, and progress tracking from categorized transactions.
- Everything tab with a searchable all-time transaction list, income vs. spending charts, and a per-month config editor.
- Charts: Income vs. Spending bar chart, Spending by Category, Fixed Expenses Over Time, and monthly Variable vs. Fixed breakdown.
- Automatic carry-over — end-of-month overspend is written as a transaction into the following month and chains forward across all subsequent months.
- Per-month income overrides — set a different income amount for any specific month without changing the global default.
- Per-month fixed expense overrides — adjust a recurring fixed expense for a single month independently of the global amount.
- Saving goal claims — allocate leftover budget from a closed month directly to a saving goal.
