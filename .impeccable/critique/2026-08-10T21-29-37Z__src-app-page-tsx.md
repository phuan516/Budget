---
target: landing page (src/app/page.tsx)
total_score: 22
max_score: 36
na_heuristics: 7
p0_count: 2
p1_count: 2
timestamp: 2026-08-10T21-29-37Z
slug: src-app-page-tsx
---
Method: dual-agent (A: general-purpose design-review agent · B: general-purpose detector/browser-evidence agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Header "Sign in" button only dims to `opacity-50` on click — no spinner, no `aria-live` — while the hero CTA correctly swaps in a spinner |
| 2 | Match System / Real World | 3 | Google icon + sheet metaphor read clearly; "Connect a Google Sheet" doesn't say whether it creates one or requires an existing template |
| 3 | User Control and Freedom | 3 | Demo link gives an escape hatch; logo isn't wrapped in a `<Link>` (dead click target) |
| 4 | Consistency and Standards | 2 | Landing page hardcodes hex colors and ignores the app's own `--color-*` token system and `dark:` shell — see dark-mode bug below |
| 5 | Error Prevention | 1 | No handling for a cancelled/failed OAuth flow; `isSigningIn` has no reset/catch path |
| 6 | Recognition Rather Than Recall | 4 | Trivially strong — one screen, nothing to remember |
| 7 | Flexibility and Efficiency | n/a | No power-user affordances are applicable to a single-CTA landing page |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, confident type, but sparse enough to under-inform rather than focus |
| 9 | Error Recovery | 1 | Zero error states or messaging anywhere on the page |
| 10 | Help and Documentation | 3 | Docs/Wiki/changelog links exist in the footer but are buried in 10-11px gray text (confirmed by detector as under the 11px legibility floor) |
| **Total** | | **22/36** | **Acceptable (61%)** |

Heuristic 7 scored `n/a`: a single-CTA landing page has no legitimate surface for keyboard shortcuts, bulk actions, or customization to apply to.

## Design Specificity Verdict

**LLM assessment**: The copy is genuinely product-specific — "Your money, your sheet." plays directly on the Google Sheets mechanic that differentiates this app, and the one accent color (`#0F9D58`) is pulled straight from the app's own `--color-saved` token, tying the single splash of color to a savings/money meaning. But the *form* is boilerplate 2024 SaaS-minimal: giant bold headline, one-line gray subhead, black pill CTA, tiny gray legal footer, acres of white space — this exact shape could carry almost any one-line value prop unchanged. There is zero visual evidence of the actual product (no screenshot of the dashboard, category breakdown, or savings tracking that exists behind login) on a page whose entire job is to earn enough trust for a Google Drive OAuth grant.

**Deterministic scan**: The static source scan (`detect.mjs` against `src/app/page.tsx`) came back clean — exit 0, zero findings. That's a source-level scan; it can't see computed styles or the real rendered DOM. The **live browser injection**, run against the actual page at `http://localhost:3000/`, found 11 anti-patterns across 5 rules:

- `low-contrast` ×3 — `#888888` on `#ffffff`, measured at **3.5:1** against a 4.5:1 requirement, on exactly the trust/legal copy ("We only request access to sheets you pick," footer legal line, and the "No server storage" trust line)
- `undersized-ui-text` ×4 — the footer nav links ("Privacy," "Terms," "What's new," "Docs") render at 10px, under the tool's 11px functional-text floor
- `tiny-text` ×3 — 10-11px body text in the same trust/footer copy
- `all-caps-body` ×2 — uppercase transform on 34 characters of body copy
- `overused-font` ×1 — Inter at 100% of text (expected and not actionable for a one-screen landing page; treat as noise, not a real finding)

This independently corroborates Assessment A's contrast reading (LLM estimated ~3.9:1 by eye; the detector measured 3.5:1 precisely) on the exact same trust-critical copy — two independent methods converging on the same P0.

The detector also surfaced something Assessment A's code read didn't catch: the headline, subcopy, CTA button, and all four footer links each appear **twice** in the accessibility tree. Whether this is duplicate markup for a responsive variant or an actual bug wasn't isolated in this run, but it's worth a follow-up look — duplicated nodes can mean a screen reader announces the headline and every footer link twice.

Assessment B also caught the mechanism behind Assessment A's dark-mode finding: the live page's `document.body` computed to `rgb(10, 10, 10)` with `prefers-color-scheme: dark` true (matching `layout.tsx`'s `dark:bg-zinc-950` on the shell), while the screenshot rendered fully light. That's because `page.tsx`'s own root div hardcodes `bg-white` and opaquely paints over the dark shell underneath — confirming, at the DOM level, that this is a real rendering contradiction and not a cosmetic nitpick.

**Visual overlays**: Browser injection succeeded and a live overlay banner ("11 anti-patterns found") with orange highlight boxes was rendered directly on the page during the session, but the live-server used to serve `detect.js` was stopped at the end of the run per protocol — so there is no persistent overlay left open in your browser to review. The console output above is the full record.

## Overall Impression

The landing page is confident and restrained where confidence and restraint are earned — the headline and color choice are genuinely authored for this product. But it asks a first-time visitor to grant Google Drive access to a personal finance tool while showing them literally nothing about what they're getting, and the one piece of copy that should reassure them about their financial data ("No server storage · End-to-end with your Drive") is the smallest, lowest-contrast text on the page. The biggest opportunity: this page currently sells restraint, not trust — and trust is the actual currency a budgeting app needs to spend on a stranger's first visit.

## What's Working

- **Copy-color coupling**: the "sheet." highlight and headline accent both use `#0F9D58`, the exact token the app uses elsewhere for `--color-saved` — a deliberate link between the brand moment and "money/growth," not an arbitrary accent choice.
- **Working focus-visible ring**: `:focus-visible { outline: 2px solid #5B3FFF }` is implemented and verified functional on both the header and hero CTA under keyboard navigation — a real accessibility win most landing pages skip entirely.
- **Mobile CTA placement**: the primary button sits at the bottom of the mobile flex column, landing in the thumb zone — a good ergonomic instinct that several of the issues below undercut.

## Priority Issues

**[P0] No product evidence anywhere on the page**
- **Why it matters**: A finance tool is asking for real Google Drive/Sheets access with zero visual proof of what the user gets — no dashboard screenshot, no "how it works" strip, nothing. That's the highest-friction possible ask for the lowest possible trust payoff.
- **Fix**: Add one real (or demo) screenshot of the dashboard/category breakdown above or beside the CTA, or a short 3-step visual walkthrough.
- **Suggested command**: `/impeccable shape`

**[P0] The one piece of data-safety copy is the least visible text on the page**
- **Why it matters**: "No server storage · End-to-end with your Drive" is 11px `#888` at the bottom edge, measured at 3.5:1 contrast — below WCAG AA's 4.5:1 floor for body text — and confirmed independently by both the design review (by eye) and the detector (measured). For a budgeting app, this is the single most important trust claim on the page, styled like disposable legal fine print.
- **Fix**: Promote it near the CTA at readable size/contrast (13px+, `#555` or darker), or turn it into a short visible trust badge.
- **Suggested command**: `/impeccable audit`

**[P1] Duplicate loading state with no feedback on the header CTA**
- **Why it matters**: The header "Sign in" button only dims to `opacity-50` while `isSigningIn` is true — no spinner, no `aria-live` — while the hero CTA correctly shows a spinner and label swap. A user who clicks the header button sees what looks like a dead, frozen button during the OAuth redirect, and a screen-reader user gets no announcement either way.
- **Fix**: Reuse the hero CTA's spinner/label-swap pattern on the header button, or drop the header button and make the hero CTA the single canonical entry point.
- **Suggested command**: `/impeccable harden`

**[P1] Dark-mode rendering contradiction**
- **Why it matters**: `layout.tsx` puts `dark:bg-zinc-950 dark:text-zinc-100` on the shell body, and the live DOM confirms the body actually resolves to near-black with `prefers-color-scheme: dark` true — but `page.tsx`'s own root div hardcodes `bg-white text-[#1a1a1a]` with no dark variant, opaquely painting over the dark shell. A system-dark-mode visitor gets a jarring pure-white landing page inside an app shell that's otherwise dark-aware.
- **Fix**: Either add real dark-mode styling to the landing page, or explicitly scope it as light-only and stop advertising dark support at the shell level.
- **Suggested command**: `/impeccable adapt`

**[P2] Two buttons, one identical action, different labels**
- **Why it matters**: "Sign in" (header) and "Continue with Google" (hero) both call the same `handleLogin`/`signIn`, with no distinction between new and returning users. It introduces a small, needless decision exactly where simplicity matters most.
- **Fix**: Relabel the header button to match the hero CTA, or drop it — the hero CTA is already visible without scrolling.
- **Suggested command**: `/impeccable clarify`

## Persona Red Flags

**Jordan (Confused First-Timer)**: "Connect a Google Sheet" never clarifies whether it creates a new sheet or requires an existing budget template (the product can auto-create one, per the README — not stated on the page). No pricing or cost signal appears before the OAuth consent screen. The two differently-labeled sign-in buttons make Jordan pause on which one is "the right one" to click.

**Sam (Accessibility-Dependent User)**: The loading spinner has no `role="status"` or text alternative, so a screen-reader user gets zero announcement that sign-in is in progress. The header button's only state change (`opacity-50`) is invisible to a screen reader too. The body/footer text at `#888` fails AA contrast (confirmed at 3.5:1 by the detector) on exactly the trust-critical lines. And the detector's duplicate-node finding, if it's a real bug and not a responsive-variant artifact, means Sam's screen reader may announce the headline and every footer link twice.

**Casey (Distracted Mobile User)**: The footer crams four links plus two lines of legal copy into 10-11px text (confirmed under the detector's 11px floor) with tight spacing — tap targets well under the 44px guideline. The "or try the demo" link sits only ~10px below the primary CTA on mobile, small and underlined, inviting a mis-tap that routes a distracted thumb away from conversion entirely.

## Minor Observations

- Header logo/wordmark isn't wrapped in a `<Link>` — a dead click target.
- The app's `--color-primary-*` (violet) token scale is used nowhere on the landing page except the focus ring; the page's real palette (black/green/gray) is disconnected from the app's declared "primary" brand color.
- The "Continue with Google" button is a custom black pill with a full-color G, departing from Google's official sign-in button branding guidance — defensible stylistically, but worth a conscious call-out rather than an accident.
- Header "Sign in" button's border (`#d8d8d8` on white, ~1.5:1) is under the 3:1 non-text contrast minimum for interactive component boundaries.
- The detector's own summary line ("11 anti-patterns found") didn't match its 13 enumerated log lines in this run — a tooling discrepancy worth knowing about, not a page defect.
- Viewport resize during testing didn't land on the exact requested dimensions (e.g., 1440×900 requested read back as 1408×682) — an artifact of the testing environment, not a claim about the page's actual responsive behavior.

## Questions to Consider

- If a first-time visitor can't see what the product actually looks like before granting Google Drive access, why would they trust it with their spending data over any other budgeting app making the same pitch?
- The design tokens define a whole violet "primary" scale and dark-mode variables that this page ignores entirely — was the landing page ever in scope when the design system was built, or was it bolted on afterward?
- With two buttons calling the identical `signIn()`, is the header "Sign in" solving a real returning-user need, or is it just there because every SaaS template has one?
