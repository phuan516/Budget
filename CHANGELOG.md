# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-08-10

### Added

- Confirmation step before deleting a transaction, category, card, fixed expense, or saving goal. First click arms the delete button (red outline, "click again" tooltip); a second click within a few seconds confirms. Previously every delete fired instantly with no way to undo.
- Inline error message with a retry path when a save fails, or when the sheet list fails to load in the sheet picker. Both previously failed silently — a failed save looked identical to a successful one, and a failed sheet-list load looked identical to having zero sheets.
- Real search on the Wiki, filtering articles by title and summary as you type. Previously a fully-styled search box existed but wasn't wired to anything.
- "Edit this page" link on every wiki article, linking to the source file on GitHub.
- "Edited X ago" timestamp on each sheet tile in the sheet picker, so sheets with similar names (e.g. monthly copies) can be told apart at a glance.
- Jump-links to every section on the Privacy and Terms pages.
- Keyboard focus is now visible on every control in the sheet picker (tiles, filters, search, the create-sheet dialog) — previously the one screen in the app missing the focus ring used everywhere else.

### Fixed

- Income vs Spending chart (Everything tab) could undercount fixed expenses for months without an explicit override, disagreeing with the Fixed Expenses Over Time chart for the same months. Both now compute the monthly fixed-expense total the same way.
- Chart hover tooltips on the Everything tab's Charts view could render behind the next chart section when hovering near the bottom of a chart, since none of the four charts set an explicit stacking order.
- Disabled "Add"/"Save" buttons in Config rendered white text on a light gray background (1.7:1 contrast — effectively unreadable).
- Changelog's "New" and "Fixed" tag badges measured 2.2–2.6:1 text contrast against their tinted backgrounds.
- Low-contrast gray trust/legal copy on the landing page and the Privacy/Terms pages, most of it under WCAG AA at its rendered size.
- Landing page didn't handle a cancelled or failed Google sign-in — the page just sat there with no feedback either way.
- Landing page briefly flashed white for visitors using system dark mode: the root shell claimed dark-mode support that nothing underneath it actually implemented.
- A wiki article titled "Categories" was still living at the `/wiki/tracking/smart-parse` URL from an earlier rename; moved to `/wiki/tracking/categories`.

### Changed

- Fixed-expense chart lines (Everything tab) now use grayscale tones with dash patterns instead of a 10-color palette; the chart's Income bar changed from a near-invisible pale gray to a legible mid-gray.
- Selected-sheet indicator in the sheet picker changed from green to violet, matching the interactive-state color used everywhere else in the app.
- Wiki's active nav item, active table-of-contents entry, and inline article links changed from green to violet for the same reason.
- Header "Sign in" button on the landing page relabeled "Sign in with Google" to make clear it's the same action as the main button, not a separate sign-in method.
- Everything tab's inline transaction-edit form now uses the app's styled dropdown instead of a native `<select>`, matching the equivalent form in the Transactions tab.
- Removed the non-functional "Subscribe" form and its CSS from the changelog page. It had no backend and never collected anything.

## [1.3.0] - 2026-06-19

### Added

- Date picker for one-time income entries — both the add and edit forms in the Overview tab and the Monthly Config (Everything tab) now include a date field, constrained to dates within the target month. New entries default to today's date.

### Fixed

- Carry-over transactions were not being written into the current month when its tab already existed (pre-created by the auto-generation logic). The sync now always starts from the previous month so the carry-over is correctly written into the current month.
- Carry-over income calculation now includes one-time income entries, matching the leftover calculation in TransactionsTab.
- Leftover banner in the Transactions tab now accounts for one-time income entries in the income total.
- Setting monthly income to 0 in the Monthly Config now saves correctly — it was silently discarded due to a falsy-zero guard.

### Changed

- Ledger card in the Overview tab widened to match the progress bar width so the Cancel button fits alongside the Add button.
- All three inline-edit fields in the Monthly Config (amount, note, date) share equal width on mobile.
- Currency symbol ($) is now inside the amount input rather than a separate label.

---

## [1.2.0] - 2026-06-16

### Added

- Google Picker integration — sheet selection now uses the Google Picker API, letting you browse and select any spreadsheet in your Drive (including shared sheets) without granting broad Drive access.

### Changed

- OAuth scope narrowed from `drive.metadata.readonly` + `spreadsheets` to `drive.file`. `drive.file` limits access to sheets you explicitly open via the Picker or create within the app — no blanket access to your Drive. Existing users will be prompted to re-authorize once on next sign-in.

---

## [1.1.0] - 2026-06-13

### Added

- Shared sheet support — sheets shared with you by others now appear in the sheet selector alongside your own sheets.

### Changed

- OAuth scope updated from `drive.file` to `drive.metadata.readonly` + `spreadsheets`. `drive.metadata.readonly` allows listing all sheets in your Drive (including shared ones); `spreadsheets` allows reading and writing to any sheet you have access to. Existing users will be prompted to re-authorize once on next sign-in.

---

## [1.0.0] - 2026-06-07

Initial public release.

### Added

- Public changelog page at `/changelog` — reverse-chronological feed of releases with New / Improved / Fixed tags, version rail with scrollspy, and email subscribe.
- Docs wiki at `/wiki` — searchable reference covering setup, tracking, income, budgets, share cards, and export.
- Privacy policy at `/privacy` and terms of service at `/terms`.
- Google Sign-In authentication — no separate account or password needed.
- Google Sheets integration — Ledger reads and writes directly to a Google Sheet you own; nothing is stored on Ledger servers.
- Google OAuth scopes limited to `drive.metadata.readonly` (list Drive files) and `spreadsheets` (read/write sheets) — Ledger does not request access to Drive file content beyond your spreadsheets.
- Sheet selector — create a new budget spreadsheet from within the app. Switch between your Ledger sheets at any time from the header.
- Demo mode — explore the full app at `/demo` without signing in.
- Monthly overview with total committed spend vs. income progress bar, segmented by variable, fixed, and carry-over spend.
- Income ledger — set recurring monthly income, log one-time additions (bonuses, freelance payments), and override income for any specific month.
- Stat grid showing today's spend, this week's spend, daily average, projected end-of-month total, and remaining budget.
- Daily spend heatmap calendar shaded by spend intensity with per-day amount and entry-count tooltips.
- No-spend streak counter alongside biggest and cheapest spending day stats.
- Spending breakdown by category with percentage bars and saving goals progress tracker.
- Expense breakdown with per-item monthly override support.
- Add expenses and refunds with date, amount, category, card/payment method, and an optional note.
- Month navigation for browsing any past month's transactions.
- Search by keyword; filter by category or card; sort by date or amount.
- Inline edit and delete for any transaction — available in both the Transactions tab and the Everything tab.
- Expense / Refund toggle when adding or editing a transaction — negative amounts are displayed as refunds and reduce category totals.
- Leftover banner on closed months — see unspent budget and move it to a saving goal in one click.
- Share cards — export the current month as a styled image in five formats: Breakdown, Monthly, Streak, Year to Date, and Wrapped.
- Settings panel for managing categories, cards and payment methods, recurring fixed expenses, and saving goals.
- Expense entry accepts both a dollar amount and a percentage-of-income field that stay in sync.
- Saving goals with a target amount, optional starting balance, and progress tracking from categorized transactions.
- Everything tab with three sub-views: all-time transaction list (searchable, filterable by month, category, and card, with inline edit and delete); Charts; and Monthly Config.
- Monthly Config in the Everything tab — edit income, fixed expenses, and income entries for any past month without navigating to it individually. Supports adding, editing, and removing fixed expense line items per month.
- Charts: Income vs. Spending bar chart, Spending by Category, Fixed Expenses Over Time, and Monthly Spending Breakdown.
- Automatic carry-over — end-of-month overspend is written as a transaction into the following month and chains forward across all subsequent months.
- Per-month income overrides — set a different income amount for any specific month without changing the global default.
- Per-month fixed expense overrides — adjust a recurring fixed expense for a single month independently of the global amount.
- Saving goal claims — allocate leftover budget from a closed month directly to a saving goal.
- Skeleton loading states on every tab — shimmer placeholders on first load so the layout never flashes blank.
