---
target: sheet selector (src/components/sheets/SheetSelector.tsx)
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-10T22-33-50Z
slug: src-components-sheets-sheetselector-tsx
---
Method: dual-agent (A: general-purpose design-review agent, source-only · B: general-purpose detector agent, source-only)

⚠️ **No live browser evidence for this target.** `/sheets/select` requires an active Google OAuth session; none exists in this environment, sign-in was correctly not attempted, and there is no unauthenticated demo equivalent (demo mode skips sheet selection entirely). Both assessments are source-code-only. Treat findings below as high-confidence on code-level facts (colors, ARIA, structure) and lower-confidence on anything that depends on rendered layout/spacing.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | `loadSheets()` failures are only `console.error`'d — an API outage looks identical to "you have zero sheets" |
| 2 | Match System / Real World | 3 | Sheet-icon, mini-grid preview, and spreadsheet-specific copy read clearly |
| 3 | User Control and Freedom | 3 | Cancel/Esc/backdrop-dismiss all present; no undo once "Create sheet" is clicked |
| 4 | Consistency and Standards | 2 | Multiple DESIGN.md drifts — see below |
| 5 | Error Prevention | 2 | Good two-step select-then-confirm, undercut by two silent-failure paths on the exact screen meant to prevent wrong-data mistakes |
| 6 | Recognition Rather Than Recall | 2 | Every tile shows an identical decorative mock preview; the real `modifiedTime` and `thumbnailLink` are fetched but never shown |
| 7 | Flexibility and Efficiency | 3 | Owner-filter choice persists via localStorage; no keyboard shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained, on-brand layout |
| 9 | Error Recovery | 2 | Good specific copy for the Config-tab/401 cases; zero copy for list-load or picker-token failures |
| 10 | Help and Documentation | 2 | No explanation of why some sheets need "Open from Drive" vs. appearing directly, no reassurance about what creating a sheet does |
| **Total** | | **24/40** | **Acceptable (60%)** |

## Design Specificity Verdict

**LLM assessment:** Partially authored for the job — the hand-drawn `MiniSheetPreview` mock-grid glyph and the "Ledger — " naming convention signal "this is specifically about picking a spreadsheet." But the surrounding chrome (search + three-way owner filter + generic tile grid + dashed "add new" tile) is the exact shape of a generic Drive-style file picker, and the one thing that makes this screen's stakes unique — a wrong pick means editing someone else's real financial data — gets zero bespoke treatment: no visual distinction between an owned and a shared sheet before commit, and a `thumbnailLink` already being fetched from the Drive API (`sheets.ts:96`) that's discarded in favor of an identical mock grid on every tile.

**Deterministic scan:** 27 findings, all `design-system-color` (advisory/quality), zero `design-system-font-size` or `design-system-radius` findings in this file pair — meaning the radius rule didn't fire on the modal's `borderRadius: 14` drift that Assessment A caught by reading the code (a gap in the detector's coverage, not a false positive). By value: `#d8d8d8` × 20 (`SheetSelector.tsx` lines 164–603, `page.tsx` lines 111/170), `#444` × 2 (`page.tsx:112,129`), `#e53e3e` × 2 (`SheetSelector.tsx:571,591`), plus two one-off modal-overlay rgba values. This independently confirms, at full coverage, what Assessment A sampled qualitatively — the `#d8d8d8`-vs-canonical-`#c8c8c8` and `#e53e3e`-vs-canonical-`#c0392b` drift DESIGN.md already flagged as open issues.

**Visual overlays:** Not applicable — no browser evidence was collected for this target (see banner above).

## Overall Impression

The two-step select-then-confirm pattern is a genuinely good, trust-preserving design decision for a screen whose whole job is "don't let the user land in the wrong financial data." But the screen undercuts its own stakes in two ways: it's the one place in the entire product where the system's signature focus-ring pattern is completely absent, and it gives an owned sheet and a shared sheet the identical one-click commit despite the review's own premise that picking wrong here is uniquely costly.

## What's Working

- **Two-step select-then-confirm** (`SheetSelector.tsx:240,338`): clicking a tile only stages a `pendingId`; a separate "Use this sheet →" commits — directly mitigates the fat-finger wrong-sheet risk.
- **`MiniSheetPreview`** (`SheetSelector.tsx:29-41`): a small, hand-authored fake-grid glyph rather than a generic file icon — genuinely bespoke, not template-shaped.
- **Config-tab server validation** ("This sheet is missing a Config tab — it may not be a Ledger budget sheet.", `page.tsx:60`): catches the worst outcome (a random non-Ledger spreadsheet) with tailored copy instead of a raw API error.

## Priority Issues

**[P0] Silent failure on sheet-list load** — `loadSheets()` (`SheetSelector.tsx:79-94`) only `console.error`'s API/network failures; the UI shows an empty grid indistinguishable from "you truly have zero sheets." On the one screen where wrong-data mistakes are catastrophic, a user can't tell "API is down" from "create a new one, there's nothing here" — and may create an unwanted duplicate. *Fix:* reuse the page-level error banner (`page.tsx:169-174`) with a retry tied to `loadSheets`. → `/impeccable harden`

**[P0] No focus-visible styling anywhere in this file** — sheet tiles, filter pills, search inputs, and the modal's name input all omit the app's documented violet focus ring; relies entirely on browser UA default. This is the highest-traffic decision gate in the product (every session, every user) and the one place the system's flagship accessibility pattern is missing outright. *Fix:* add `:focus-visible { box-shadow: 0 0 0 3px rgba(91,63,255,0.18) }` matching the input/select convention used everywhere else. → `/impeccable audit`

**[P1] Selection state uses Savings Green instead of Interactive Violet** — `ACCENT = 'oklch(0.65 0.13 150)'` (`SheetSelector.tsx:43`) drives the "● Selected" badge. DESIGN.md's Two-Color Rule reserves green for savings/positive money only; a user could momentarily read the dot as "this sheet has savings data" rather than "this is what you picked." *Fix:* recolor to `#5B3FFF`. → `/impeccable colorize`

**[P1] Tiles carry no differentiating information beyond name** — `MiniSheetPreview` renders an identical mock grid on every tile; `modifiedTime` is fetched (`sheets.ts:8,101`) but never rendered. For a user with several similarly-named sheets (monthly copies, an accidental duplicate), name is the *only* signal in a flow whose entire premise is preventing wrong-data mistakes. *Fix:* surface `modifiedTime` ("Edited 3 days ago") on each tile. → `/impeccable clarify`

**[P2] Mobile search placeholder overpromises scope** — desktop reads "Search sheets…", mobile reads "Search your Drive…" (`SheetSelector.tsx:202,390`), but both are an identical client-side filter over an already-loaded, prefix-restricted list — neither searches Drive live. Mobile copy sets an expectation the mechanism can't fulfill. *Fix:* use identical, scope-accurate copy on both breakpoints. → `/impeccable clarify`

## Persona Red Flags

**Sam (Accessibility-Dependent):** Filter pills have no `aria-pressed`; a screen reader announces three identical "button"s with no indication which owner filter is active. The name-entry modal has no `role="dialog"`/`aria-modal`/`aria-labelledby`. Search inputs rely solely on placeholder text (disappears once typed, no `<label>`). Mobile "selected" state is a bare `●` glyph with no `aria-pressed` on the tile. Plus the P0 focus-ring gap above.

**Riley (Stress Tester):** Zero explicit empty-state copy for 0 sheets — just the two dashed CTA tiles with no explanation. A shared (not-owned) sheet gets shown its owner's name but the identical one-click confirm as an owned sheet — no extra friction despite the stated stakes. Name-collision check (`handleCreateConfirm`, lines 151-161) only checks the client's already-loaded list — a stale list lets an actual duplicate get created server-side with no second, authoritative check.

**Jordan (First-Timer):** "Where should we write?" presumes the user already understands "a Google Sheet as your database" — no restatement on this specific screen. The "All / Mine / Shared" filter assumes familiarity with Google Drive's sharing model. The split between the auto-populated grid (prefix-restricted, already-authorized) and "Open from Drive" (reaches further via Picker) is never explained.

## Minor Observations

- `ownerFilter` initial state diverges between SSR (`'all'`) and client-with-no-stored-preference (`'mine'`) — a hydration mismatch for any first-time visitor.
- `LEDGER_PREFIX = 'Ledger — '` hardcodes an em dash; a sheet renamed directly in Google Sheets (dropping the prefix) silently vanishes from the picker with no explanation.
- Refresh button has a `title` tooltip but no `aria-label`, and no confirmation once refresh completes.
- Mobile header drops the "Ledger" breadcrumb segment the desktop version shows — losing orientation context on the platform the product calls primary.

## Questions to Consider

- If the Drive API call fails, what does a user actually see today — has anyone tried it, or is the empty grid assumed to be silently fine?
- Why does picking a sheet someone else shared with you get the exact same one-click confirm as picking your own, given this screen's entire stated purpose is preventing wrong-data mistakes?
- The system's one "most consistently implemented" pattern — the violet focus ring — is completely absent from the one screen every user hits every session. Deliberate scoping, or did this component just predate the convention?
