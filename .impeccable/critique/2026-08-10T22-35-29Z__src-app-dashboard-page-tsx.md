---
target: dashboard (src/app/dashboard/page.tsx)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-10T22-35-29Z
slug: src-app-dashboard-page-tsx
---
Method: dual-agent (A: general-purpose design-review agent · B: general-purpose detector/browser-evidence agent)

Live browser evidence for both assessments came from `http://localhost:3000/demo`, not `/dashboard` — no active login session exists in this environment, sign-in was correctly not attempted, and `/demo` renders the identical dashboard components (Overview/Transactions/Config/Everything) with sample data and no auth required. Source-code evidence is from the actual `src/app/dashboard/` and `src/components/dashboard/` files. Both agents also independently hit the same environmental issue: the shared browser session was intermittently redirected to unrelated routes (`/wiki`, `/privacy`, `/changelog`) by activity neither agent initiated — confirmed (by code search) not to be app behavior, consistent with multiple concurrent automation sessions sharing one Chrome instance during this run. This limited narrow-viewport and some computed-style capture; it does not affect the source-code or console-output findings below.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good loading skeletons, but silent background refreshes and failed writes surface nothing beyond `console.error` |
| 2 | Match System / Real World | 3 | Plain money/date formatting; raw claim-tag syntax `[←2026-05]` leaks into user-facing notes (`TransactionsTab.tsx:39`) |
| 3 | User Control and Freedom | 2 | Escape cancels inline edits; zero undo anywhere; every destructive action fires immediately |
| 4 | Consistency and Standards | 2 | Two different select components for the same job, three different greens, a 10-color chart, `#d8d8d8` vs. `#c8c8c8` — see below |
| 5 | Error Prevention | 1 | No confirm dialog on any delete; live-confirmed 1.7:1 contrast on a disabled primary button |
| 6 | Recognition Rather Than Recall | 3 | Config-driven dropdowns are recognition-friendly; no recent/frequent-category suggestions |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no multi-select/bulk delete, no bulk import |
| 8 | Aesthetic and Minimalist Design | 3 | Chrome is genuinely minimal; the rainbow chart and 5-tile stat grid undercut it locally |
| 9 | Error Recovery | 2 | Inline validation text is fine and on-token; failed API writes are swallowed silently |
| 10 | Help and Documentation | 3 | `/wiki` and `/changelog` are one click away; no inline help for the genuinely non-obvious carry-over/claim mechanic |
| **Total** | | **23/40** | **Acceptable (57.5%)** |

## Design Specificity Verdict

**LLM assessment:** Closer to "authored" than a generic template, but authored in two registers that disagree. The grayscale-plus-two-accent chrome, tabular-mono money, underline tabs, and pill buttons give the shell real point of view — it doesn't read as a stock admin kit. The genuinely novel ideas (carry-over debt tracking, "claim to savings," the collapsible income ledger) are the strongest evidence of specificity and aren't things a generic dashboard template would bother building. But the moment you leave the chrome for data visualization, it reverts to exactly the kind of undifferentiated dashboard this product's own design system rejects.

**Deterministic scan:** 149 findings — `design-system-font-size` ×76, `design-system-color` ×50, `design-system-radius` ×20, plus 3 `layout-transition` warnings (a step up in severity from the rest, all `transition: width` in `OverviewTab.module.css:353,643,830` — animating `width` triggers layout thrash, a real performance anti-pattern the LLM review didn't examine). The font-size and radius volume (96 findings between them) is new information beyond what Assessment A sampled — this dashboard has drifted off DESIGN.md's type ramp and radius scale far more than the landing page or sheet selector did, concentrated in `OverviewTab.module.css` (48 findings) and `EverythingTab.module.css` (36).

Color findings directly corroborate Assessment A's independent read: `EverythingTab.module.css:257` and `TransactionsTab.module.css:402` both hardcode `#16a34a` — the exact "third, uncatalogued green" Assessment A flagged from reading the code, now confirmed at both of its locations. `EverythingTab.tsx:616`'s `#d8d8d8` is an exact-line match to Assessment A's finding. `EverythingTab.module.css:624,642` (`#6366f1`, `#ef4444`) are two more of the ten chart-line colors Assessment A called out as violating the Two-Color Rule. Two independent methods converged on the same defects.

**Visual overlays:** Injection succeeded on all four tabs; the live-server was stopped afterward per protocol, so nothing persists in your browser. The most severe live finding: `low-contrast 1.7:1 (need 4.5:1) — text #ffffff on #c8c8c8` on the Config tab's disabled "Add" button (`SettingsTab.module.css` `.btnPrimaryDisabled`) — that's not a borderline AA miss, the label is very close to invisible against its own background. The same tab also repeat-fires `low-contrast 3.5:1` on every `.sectionTitle` label ("MONTHLY INCOME," "CATEGORIES," "CARDS & PAYMENT METHODS") — confirming live the exact anti-pattern DESIGN.md's own Don'ts list already names.

One notable cross-agent corroboration: Assessment A reported the Everything tab's "Income vs Spending" chart rendering with all bars compressed to a sliver near $0 despite real data existing elsewhere in the app. Assessment B, working independently and without seeing Assessment A's findings, separately observed the "Charts" sub-view rendering as a blank/empty content area in one of its screenshots. Two different agents, two different observation methods, both saw something broken in the same chart view — this raises confidence it's a real bug, not a one-off rendering glitch.

## Overall Impression

The parts of this dashboard that are genuinely novel — the income ledger, the carry-over mechanic — are well executed and worth protecting. But the product's own stated pitch ("trust the numbers are right") is undercut by real gaps: every write happens optimistically with no failure signal, every delete is instant with no undo, and the one page most likely to be used for serious financial review (Everything → Charts) may be showing broken data. The visual drift (149 detector findings) is real but secondary to those functional risks.

## What's Working

- **The income ledger drawer** (`OverviewTab.tsx:337-493`): collapsed by default, remembers its state per-browser, turns "monthly income" into an auditable list of overrides and one-off entries — exactly the kind of feature a spreadsheet-native tool should have that a generic dashboard wouldn't build.
- **`CustomSelect`** (`src/components/ui/CustomSelect.tsx`): full listbox ARIA (`role="listbox"`, `aria-activedescendant`, keyboard support) and matches the input family exactly as DESIGN.md prescribes — the single best-executed component in the codebase.
- **Focus-state consistency**: verified live across every input/select/money field tested — identical `border-color: #5B3FFF; box-shadow: 0 0 0 3px rgba(91,63,255,0.18)` ring everywhere. In a codebase with this much other drift, this one pattern held perfectly.

## Priority Issues

**[P0] No confirmation on any destructive action** — Clicking the `×` on a transaction, category, card, fixed expense, or saving goal deletes immediately (`TransactionsTab.tsx:670-678`, `SettingsTab.tsx:70-76`). This is a real financial record; one mis-tap on a ~16px touch target permanently destroys data with zero recovery. *Fix:* two-step confirm or an inline "Undo" toast with a short window. → `/impeccable harden`

**[P0] Silent write failures** — Every mutating handler in `dashboard/page.tsx` optimistically updates local state, fires the API call, and does nothing visible on failure (`handleConfigAdd` at line 138 doesn't even check `res.ok`). For a tool whose entire pitch is trustworthy numbers, a transaction can appear to save and silently fail to persist to the user's actual Google Sheet. *Fix:* surface a toast/banner on write failure and roll back the optimistic state. → `/impeccable harden`

**[P1] Severe, live-confirmed contrast failure on the Config tab** — The disabled "Add" button renders at **1.7:1** contrast (`#ffffff` on `#c8c8c8`, `SettingsTab.module.css` `.btnPrimaryDisabled`), and every section label ("CATEGORIES," etc.) repeat-fires at 3.5:1 — both confirmed live, both exactly the `#888`-on-small-text anti-pattern DESIGN.md's own Don'ts already call out. This is the worst contrast number found across all four critiques so far. *Fix:* use a visibly-disabled treatment that doesn't rely on near-white-on-light-gray text (e.g. keep text dark, reduce opacity of the whole control instead), and bump `.sectionTitle` off `#888` per the established `#5c5c5c` pattern. → `/impeccable audit`

**[P1] Two-Color Rule violated wholesale by the Everything tab's charts** — `LINE_COLORS` (`EverythingTab.tsx:52`) is a 10-hue rainbow palette, live-confirmed on-page (`#6366f1`, `#ef4444` among others), plus a third, uncatalogued green (`#16a34a`, `EverythingTab.module.css:257` and `TransactionsTab.module.css:402`) distinct from both `--color-saved` and `--color-success`. This is the most conspicuous system-rule violation in the product, on the tab most likely used for serious financial review. *Fix:* one ink-based line with varying dash/weight, or restrict to grayscale + the two system accents. → `/impeccable colorize`

**[P1] "Income vs Spending" chart may be genuinely broken** — Independently observed by both assessments: bars compressed to near-zero despite real underlying data (Assessment A), and a blank/empty Charts sub-view in a separate screenshot (Assessment B). Given the changelog's own history of repeated carry-over-sync fixes, a single outlier month could plausibly be skewing the Y-axis for every other month. *Fix:* verify by reproducing directly, then clip/cap the axis domain or filter outliers; add a regression test against the carry-over sync logic (`dashboard/page.tsx:335-407`). → `/impeccable audit`

## Persona Red Flags

**Sam (Accessibility-Dependent):** Tab bar (`dashboard/page.tsx:621-640`, and the Everything sub-nav) uses plain `<button>`s with no `role="tablist"/"tab"`, no `aria-selected` — a screen reader hears an unlabeled row of buttons instead of "tab 2 of 4, selected." `SettingsTab`'s edit/delete buttons use generic `aria-label="Edit"`/`"Remove"` with no item name — six categories announce as six indistinguishable "button, Edit"s (compare `OverviewTab.tsx:759`'s `aria-label={\`Override ${item.name}...\`}`, which does it right two files away). Plus the P1 contrast failures above hit Sam directly, not just screen-reader users.

**Casey (Distracted Mobile):** A fixed circular "What's new" button visually overlapped the month-navigation row on the Transactions tab in live testing at narrow width. Edit/delete icon buttons on transaction rows are ~13-16px with minimal padding — well under the 44px touch-target guideline, directly under a thumb reaching from the bottom of the screen. Reaching the actual transaction list on mobile means scrolling past a full 5-field add form, month nav, search, and three stacked filter dropdowns first.

**Alex (Power User):** No bulk actions anywhere — deleting 10 miscategorized transactions is 10 separate clicks. No keyboard shortcuts beyond Enter-to-save/Escape-to-cancel inside individual forms. Every add/edit is a full form reveal with no recent-category quick-pick for someone entering the same 2-3 categories daily.

## Minor Observations

- `TransactionsTab.tsx:614`'s edit-form amount input is missing the `.inputMono` class the add-form equivalent has (line 334) — money isn't rendered in JetBrains Mono while being edited, breaking the Mono-Money Rule at the exact moment precision matters most.
- `EverythingTab.tsx:596-608` uses a bare native `<select>` for Category/Card in its inline edit form, while the visually identical edit form in `TransactionsTab.tsx:617-621` uses the styled, fully-accessible `CustomSelect` — same affordance, two different control families in the same app.
- 76 font-size and 20 border-radius findings off DESIGN.md's documented scale, concentrated in `OverviewTab.module.css` and `EverythingTab.module.css` — not urgent individually, but the volume suggests these two files predate DESIGN.md's ramp rather than drifted from it deliberately.
- Three `transition: width` declarations (`OverviewTab.module.css:353,643,830`, likely progress-bar fills) animate a layout-affecting CSS property — prefer `transform: scaleX()` to avoid layout thrash.
- `ShareModal`'s style-picker swatches (`#4a9e5c`, `#1e3a8a`, etc.) are a separate, more expressive palette for exportable social cards — reasonable as an intentional exception, but worth documenting in DESIGN.md as a named carve-out rather than an unstated one.

## Questions to Consider

- If the whole pitch is "trust the numbers are right," why does every write happen optimistically with no failure signal — what happens to that trust the first time a transaction silently doesn't save?
- The chrome is disciplined enough to have a documented Two-Color Rule — how did a 10-color categorical chart palette ship on the tab most likely to be used for serious financial review?
- Deleting a transaction, category, or saving goal takes exactly one click with no confirmation — deliberate bet that speed matters more than safety, or an oversight nobody's stress-tested yet?
