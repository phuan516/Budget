# Handoff: Income Controls — Expanded Ledger

## Overview
This is the income-editing control for the "Spent this month" hero on the budget-tracker dashboard. It replaces a confusing two-icon control (a pencil that "overrode" income + a plus that "added" income) with a single **expandable, receipt-style ledger**.

**The conceptual model it makes visible:**

```
Total income  =  Recurring monthly income   +   Σ one-off entries this month
  $600.00      =        $300.00 (auto)        +     $300.00 (Jun 3)
```

- **Recurring monthly income** is a baseline figure (e.g. salary) that **auto-fills every month**.
- **One-off entries** are ad-hoc deposits for the current month only (bonus, refund, side gig). A typical month has 0–3.
- **Total income** is always the *computed sum*. The user never edits the total directly — they edit its parts, and the ledger shows the sum honestly. This is the fix for the original bug, where the displayed number ($600) and the editable field ($300) disagreed.

The control appears in two layouts: **desktop (web)** and **mobile**, documented separately below.

## About the Design Files
The files in `reference/` are **design references created in HTML** — a mid-fidelity prototype showing layout, hierarchy, copy, and intended behavior. They are **not production code to copy directly**.

Recreate this control in the target codebase's existing environment (React + Tailwind, Vue, SwiftUI, native, etc.) using its established components, tokens, and patterns. If no codebase exists yet, choose the most appropriate framework (for web, Next.js App Router is a fine default).

Open `reference/Budget Tracker Wireframes.html` in a browser to see both layouts side by side on a pan/zoom canvas. Click an artboard's ⤢ control to focus it.

## Fidelity
**Mid-fidelity.** Structure, hierarchy, copy, spacing relationships, and the interaction model are intentional and should be followed closely. The palette is grayscale plus a single accent green (used to mark the *recurring* income line and the "left to spend" figure) and one amber used for the progress bar. Apply the target app's real design system for final polish.

---

## Screen · Desktop (web)

Reference component: `IncomeE` in `reference/wireframes/income-controls.jsx`. Reference artboard size 980 × 600.

### Purpose
Let the user see exactly what makes up their monthly income and edit any part of it inline, without ever confusing "set my recurring income" with "add a one-off this month."

### Layout (top to bottom)
Container padding: `34px 40px`.

1. **Hero block**
   - Eyebrow: "SPENT THIS MONTH" — 11px, uppercase, weight 600, color `#888`, letter-spacing 0.4, margin-bottom 8.
   - Number row — flex, `align-items: flex-end`, gap 22:
     - **$100.00** — 76px / 600, letter-spacing -2.4, line-height 0.85 (this is *spent*, not income).
     - **Income toggle** (a `<button>`, baseline-aligned, padding-bottom 8): the text "of **$600.00** income" (16px, "of/income" in `#888`, "$600.00" in `#1a1a1a` weight 600), followed by a caret control — a 6px-radius box, `1px solid #d8d8d8`, padding 3, containing a chevron. **Chevron points up when the ledger is open, down when closed.**

2. **Ledger card** (visible only when expanded) — `max-width: 460px`, `border: 1px solid #d8d8d8`, border-radius 10, `overflow: hidden`, margin-bottom 22. Four stacked rows:

   - **Recurring monthly** — flex space-between, padding `11px 14px`, background `#fafafa`.
     - Left: an 8×8 rounded-2px **green** square (`oklch(0.65 0.13 150)`) + "Recurring monthly" (13px) + the word "auto" (11px, green).
     - Right: "$300.00" (weight 600, tabular-nums) + a pencil icon (13px stroke).
   - **One-off entry row** (one per entry) — padding `11px 14px`, border-top `1px solid #ececec`, 13px.
     - Left: "Jun 3 · Freelance invoice" in `#444` (date · optional note).
     - Right: "+$300.00" (weight 600, tabular-nums) + pencil icon + close (×) icon, gap 12.
   - **Add row** — padding `9px 14px`, border-top `1px solid #ececec`. A dashed-border chip button: "+ Add one-off income" (`1px dashed #d8d8d8`, pill radius).
   - **Total row** — flex space-between, `align-items: baseline`, padding `11px 14px`, border-top `1.5px solid #d8d8d8`, background `#fafafa`.
     - "Total income" (13px, weight 700) + "$600.00" (17px, weight 700, tabular-nums). **Read-only** — this is the sum.

3. **Progress bar** — track height 5px, `background: #ececec`, border-radius 3, max-width 560, margin-bottom 24. Fill = amber `oklch(0.72 0.12 55)` at `width: spent / total` (16.7% here). Legend below (margin-top 8, 12px, `#444`): a 9×9 amber square + "Monthly · $100.00 of $600.00".

4. **Stat row** — CSS grid, 5 equal columns, gap 24. Each cell: eyebrow (10px, uppercase, 600, `#888`, letter-spacing 0.4, margin-bottom 6) + value (19px / 600, letter-spacing -0.5). Stats: Today `$0.00` · This week `$0.00` · Daily avg `$0.00` · Projected `$0.00` · **Left to spend `$500.00`** (value in accent green).

### Collapsed state
When collapsed, the ledger card is hidden and the chevron points **down**. The hero reads "of **$600.00** income ▾". The progress bar and stat row sit directly under the hero.

---

## Screen · Mobile

Reference component: `IncomeEMobile` in `reference/wireframes/income-controls.jsx`. Reference frame 375 × 760 (content area starts 28px below the top status bar).

### Layout (top to bottom)

1. **Hero** — padding `20px 18px 0`.
   - Eyebrow "SPENT THIS MONTH" — 10px, uppercase, 600, `#888`, letter-spacing 0.4, margin-bottom 6.
   - **$100.00** — 52px / 600, letter-spacing -1.8, line-height 0.9.
   - **Income toggle** (button, margin-top 8): "of **$600.00** income" (13px, "$600.00" bold `#1a1a1a`) + caret box (padding 3, `1px solid #d8d8d8`, radius 6, chevron up when open).

2. **Ledger card** — padding wrapper `14px 18px 0`; card `border: 1px solid #d8d8d8`, border-radius 12, `overflow: hidden`. Same four rows as desktop, slightly roomier padding:
   - **Recurring monthly** — padding `12px 14px`, background `#fafafa`. Green 8×8 square + "Recurring monthly" (13px) + "AUTO" (10px, green, weight 600). Right: "$300.00" (600) + pencil (13px).
   - **One-off entry** — padding `12px 14px`, border-top `1px #ececec`, 13px. "Jun 3 · Freelance" (`#444`) | "+$300.00" (600) + pencil + ×.
   - **Add row** — padding `10px 14px`, border-top `1px #ececec`. **Full-width** dashed chip, centered, padding 9: "+ Add one-off income".
   - **Total row** — padding `13px 14px`, border-top `1.5px #d8d8d8`, background `#fafafa`. "Total income" (14px / 700) | "$600.00" (19px / 700, tabular-nums).

3. **Progress bar** — wrapper margin-top 16, padding `14px 18px 0`. Track height 5, `#ececec`, radius 3; fill amber at 16.7%. Legend (margin-top 7, 11px, `#444`): 8×8 amber square + "$100.00 of $600.00".

4. **Stat grid** — 2 columns, gap `16px 24px`, padding `18px 18px 0`. Cells: Daily avg `$0.00` · Projected `$0.00` · **Left to spend `$500.00`** (green). Eyebrow 9px, value 20px / 600. (Today/This week are dropped on mobile to keep the grid even; include them as a 2×3 grid if you prefer parity with desktop.)

### Collapsed state
Same as desktop: ledger hidden, chevron down, hero reads "of $600.00 income ▾", progress + stats slide up under the hero.

---

## Interactions & Behavior

| Trigger | Result |
|---|---|
| Tap the income toggle (text or caret) | Expand/collapse the ledger. Animate height + chevron rotation, ~160ms ease. Persist open/closed per user (e.g. localStorage). |
| Tap pencil on **Recurring monthly** | Inline-edit the recurring amount. **The field is prefilled with the recurring value ($300), and the row label still says "Recurring monthly · auto-fills each month"** so it's unambiguous you're editing the baseline, not the total. Save → recurring updates, total row recomputes. |
| Tap pencil on a **one-off entry** | Inline-edit that entry's amount (and optional note). Save → entry + total recompute. |
| Tap × on a one-off entry | Remove that entry (confirm if amount is large, optional). Total recomputes immediately. |
| Tap "+ Add one-off income" | Reveal an inline amount field (focused) + optional note field + Add/Cancel. On Add, append the entry dated today and recompute the total. |
| **Total income row** | Never editable. Always renders `recurring + Σ entries`. |

**Recurring auto-fill:** at the start of each month, the recurring amount is carried forward automatically and one-off entries reset to empty for the new month. Editing the recurring value changes it for the current and future months (define whether past months are retroactively affected — recommended: no, only current/future).

**Progress bar color:** fill is accent-green normally; shift to amber `oklch(0.72 0.12 55)` above 90% of total income spent, and red `oklch(0.58 0.18 25)` above 100%. (The reference shows amber.)

**Empty state (no recurring, no entries):** show "of $0.00 income" with the ledger collapsible; inside, Recurring shows "$0.00 · set it" as a call to action, the one-off section shows just the "+ Add one-off income" row, and Total reads $0.00.

**Inline-edit field styling** (see `MoneyInput` in the reference): bordered box, `1.5px solid` (border darkens to `#1a1a1a` on focus), radius 8, padding `7px 9px`, a `$` prefix in `#888`, the value at 15px / 600 tabular-nums, and a stepper (up/down chevrons) on the right.

## State Management

```ts
interface IncomeState {
  recurringMonthly: number;          // auto-fills each month; e.g. 300
  oneOffEntries: {                   // current month only; typically 0–3
    id: string;
    date: string;                    // ISO; displayed as "Jun 3"
    amount: number;                  // positive deposit
    note?: string;                   // optional, e.g. "Freelance invoice"
  }[];
  ledgerExpanded: boolean;           // UI; persist per user
}

// derived — never stored, never directly edited:
const totalIncome = recurringMonthly + oneOffEntries.reduce((s, e) => s + e.amount, 0);
const leftToSpend = totalIncome - spentThisMonth;
```

State transitions: edit-recurring → updates `recurringMonthly`; add/edit/delete entry → mutates `oneOffEntries`; toggle → flips `ledgerExpanded`. Every mutation triggers recomputation of `totalIncome` and `leftToSpend` and re-renders the hero, total row, progress bar, and "Left to spend" stat.

### Data source
Values come from the connected Google Sheet (same pattern as the rest of the app): recurring income from the hidden `_config` tab; one-off entries as income-typed rows in the current month's range. Recompute aggregates client-side and cache (React Query / SWR), invalidating on any write.

## Design Tokens

### Colors
| Token | Value | Usage |
|---|---|---|
| `--ink` | `#1a1a1a` | primary text, total, recurring/one-off amounts |
| `--ink-2` | `#444` | entry date·note, progress legend |
| `--ink-3` | `#888` | eyebrows, "of … income" framing, icons (default) |
| `--line` | `#d8d8d8` | card border, total-row divider (1.5px), caret box, chip border |
| `--line-2` | `#ececec` | inner row dividers, progress track |
| `--bg` | `#ffffff` | page / card background |
| `--bg-2` | `#fafafa` | recurring row + total row backgrounds |
| `--accent` | `oklch(0.65 0.13 150)` | recurring marker square + "auto" label, "left to spend" value |
| `--warn` | `oklch(0.72 0.12 55)` | progress bar fill (shown), and >90% state |
| `--danger` | `oklch(0.58 0.18 25)` | progress bar fill >100% |

### Typography
Font family **Inter** (weights 400, 600, 700). Use `font-variant-numeric: tabular-nums` on every dollar amount.

| Role | Desktop | Mobile |
|---|---|---|
| Hero number (spent) | 76 / 600 / -2.4 / 0.85 | 52 / 600 / -1.8 / 0.9 |
| "of $X income" framing | 16 / (600 on the number) | 13 / (600 on the number) |
| Eyebrow (uppercase) | 11 / 600 / 0.4 | 9–10 / 600 / 0.4 |
| Ledger row label | 13 / 400 | 13 / 400 |
| Ledger amount | 13–15 / 600 tabular | 13–15 / 600 tabular |
| Total label / amount | 13·700 / 17·700 | 14·700 / 19·700 |
| Stat value | 19 / 600 / -0.5 | 20 / 600 |
| "auto" / "AUTO" tag | 11 / (green) | 10 / 600 (green) |

### Spacing scale
4px base. Used: 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 34, 40.

### Radii
- Card: 10 (desktop) / 12 (mobile)
- Caret box: 6
- Inline-edit field: 8
- Chip / pill: 999px
- Marker square / progress track: 2–3

### Icons (1.4–1.5px stroke, round caps)
Pencil (edit), Plus (add), Close ✕ (delete entry), Chevron (caret toggle + stepper). All inline SVG in the reference (`IcoPencil`, `IcoPlus`, `IcoClose`, `IcoCaret`, `Spinner`) — substitute your icon library, matching the ~1.5px stroke weight.

## Assets
No raster assets. All icons are inline SVG. The accent green is the same `--accent` used elsewhere in the app.

## Responsive Behavior
- **≥ 768px** — desktop layout. Ledger card max-width 460; 5-column stat row.
- **< 768px** — mobile layout. Full-width-ish ledger card; full-width "Add" chip; 2-column (or 2×3) stat grid; hero number scales down to ~52px.

## Files in this bundle
| Path | Contents |
|---|---|
| `reference/Budget Tracker Wireframes.html` | Entry point — renders the desktop + mobile ledger on a pan/zoom canvas. |
| `reference/wireframes/income-controls.jsx` | **The canonical design.** `IncomeE` = desktop, `IncomeEMobile` = mobile. Also contains the four other explored directions (A–D) for context. |
| `reference/wireframes/shared.jsx` | Shared primitives + the `WF` design tokens, `DesktopFrame`, `PhoneFrame`, `StatusBar`. |
| `reference/design-canvas.jsx` | Pan/zoom/focus canvas used only to display the mocks — not part of the app. |

## Implementation Checklist
1. Hero: eyebrow + big "spent" number + "of $TOTAL income" toggle with chevron.
2. Expand/collapse ledger (animated, persisted).
3. Ledger rows: Recurring (green marker + "auto"), one or more one-off entries (date·note + amount + edit + delete), dashed "Add one-off income" row, read-only Total row.
4. Inline edit for recurring — **prefilled with the recurring value, clearly labeled as the baseline.**
5. Inline edit / delete / add for one-off entries; total recomputes live.
6. Total income is always `recurring + Σ entries`, never directly editable.
7. Progress bar with green→amber→red thresholds; "Left to spend" stat in green.
8. Recurring auto-fills each month; one-offs reset monthly.
9. Empty state.
10. Responsive desktop ↔ mobile.
