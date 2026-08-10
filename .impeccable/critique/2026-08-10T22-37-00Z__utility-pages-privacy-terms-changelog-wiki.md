---
target: utility pages (privacy, terms, changelog, wiki)
total_score: 22
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 4
timestamp: 2026-08-10T22-37-00Z
slug: utility-pages-privacy-terms-changelog-wiki
---
Method: dual-agent (A: general-purpose design-review agent · B: general-purpose detector/browser-evidence agent)

This critique covers four public, unauthenticated pages together as one combined surface: Privacy, Terms, Changelog, and Wiki. Both assessments had full live browser access (no sign-in required for any of these). Assessment B's session was also intermittently affected by the same cross-session tab interference noted in the Dashboard critique run concurrently — data was re-verified before being reported, per B's own methodology note; it does not affect the findings below.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Changelog's "archive ↓" button has no `onClick` — a dead control that gives no feedback |
| 2 | Match System / Real World | 3 | Legal copy is plain-English and specific; no jargon walls |
| 3 | User Control and Freedom | 3 | Standard back-nav present; no global "Home" affordance from deep wiki articles beyond the small header logo |
| 4 | Consistency and Standards | 2 | Landmark, aria-label, and color-token drift between Changelog/Wiki vs. Privacy/Terms — see below |
| 5 | Error Prevention | 3 | Low error surface (read-only); Changelog's Subscribe form accepts any string with no real validation |
| 6 | Recognition Rather Than Recall | 3 | Breadcrumbs + sticky TOC on Wiki are strong; Changelog's version rail is clear |
| 7 | Flexibility and Efficiency | 1 | Driven by Wiki: a fully-styled search box exists in CSS but is never wired up — the one efficiency aid this page-type could offer doesn't work |
| 8 | Aesthetic and Minimalist Design | 3 | Generally restrained; the Changelog's tag-color proliferation is the exception |
| 9 | Error Recovery | n/a | No user-generated errors are possible on these read-only surfaces |
| 10 | Help and Documentation | 2 | Wiki *is* the help system but has no working search; Privacy/Terms give no plain-language TL;DR before the legal prose |
| **Total** | | **22/36** | **Acceptable (61%)** |

Heuristic 9 scored n/a: there is no user input on any of these four pages that could produce an error to recover from. Heuristic 7 varies sharply by page (n/a for pure-reading Privacy/Terms, 2/4 for Changelog's working filter chips, 1/4 for Wiki's broken search) — the combined score of 1 reflects the weakest real instance rather than an average, since a broken feature is a worse outcome than no feature.

## Design Specificity Verdict

**LLM assessment:** Privacy and Terms read as genuinely product-specific — they name the real OAuth scopes (Sheets read/write, Drive read-only file list), explain the no-server-storage model, and link to Google's own data policy, well above generic liability-covering boilerplate. Changelog and Wiki are the standouts: real, dated release notes referencing actual bugs (the carry-over sync fix appears multiple times) and a docs wiki with product-accurate detail. But the visual shell of all four is thinner than the content — Inter-on-white-with-gray-borders is correct per DESIGN.md but generic enough that, stripped of the wordmark, these could belong to any indie SaaS. None of the dashboard's tabular-mono money treatment or hand-drawn-icon distinctiveness carries into these pages.

**Deterministic scan:** 96 static findings — `design-system-font-size` ×44, `design-system-color` ×43, `design-system-radius` ×9 — concentrated in `wiki.module.css` (55) and `changelog/page.module.css` (24), with Privacy/Terms contributing only 4 each (matching Assessment A's read that Privacy/Terms are the more disciplined siblings). The color findings independently confirm Assessment A's Two-Color Rule violations: `ChangelogClient.tsx:12,14` and `wiki.module.css:156,293,303` all hardcode the exact `--color-warn` (`oklch(0.72 0.12 55)`) and `--color-success` (`oklch(0.65 0.13 150)`) values Assessment A flagged from reading the code — used for changelog tags and, more concerningly, wiki active-nav/TOC state, where DESIGN.md's own rule reserves that role for violet.

**Visual overlays:** Injection succeeded on all five URLs tested (four pages plus one wiki article). The most severe live finding by far: Changelog's "New" and "Fixed" tag pills measure **2.6:1** and **2.2:1** contrast respectively (need 4.5:1) — roughly half the required ratio, the worst live number found across every page critiqued so far. Every page also repeat-fires `low-contrast 3.5:1` on `#888`-colored secondary text (nav labels, article ledes, the Privacy/Terms "Last updated" date), and Changelog additionally reports 3 `clipped-overflow-container` warnings — a positioned child being clipped by an ancestor, worth a follow-up look since clipped content can silently hide information.

## Overall Impression

The writing across all four pages is better than the shell it's presented in — Privacy/Terms do real trust-building work with specific, accurate scope explanations, and Changelog/Wiki have genuinely useful content. But three separate signs of "shipped before finished" (a search box with no search, a subscribe form that goes nowhere, feedback links that don't render despite the data existing) undercut the "quiet, precise" impression the rest of the product works hard to earn, and the Changelog's tag colors are a real, severely-failing accessibility problem, not just a token-drift nitpick.

## What's Working

- **Privacy/Terms content specificity**: naming the exact three Google OAuth scopes with plain-language justification for each is unusually good for a finance-app legal page — real trust-building, not just liability boilerplate.
- **Wiki's three-pane IA + scrollspy TOC**: nav tree, breadcrumb, article, and a live-highlighting "on this page" TOC is genuinely good documentation UX, comparable to how the best docs sites structure long-form reference content.
- **Changelog's tag taxonomy (New/Improved/Fixed)** and filter-chip interaction model is well thought through as a mechanism — the problem is purely the color execution, not the concept.

## Priority Issues

**[P1] Changelog tag pills fail contrast severely — live-measured 2.2:1 and 2.6:1** — `ChangelogClient.tsx:12-15`'s `TAG_CONFIG` repurposes `--color-warn` and `--color-success` for "Fixed"/"New" tags; live testing measured 2.2:1 and 2.6:1 against a 4.5:1 requirement — the worst contrast numbers found in any critique so far, on labels meant to be scanned quickly. This is also the same defect as the Two-Color Rule violation: these colors aren't in DESIGN.md's palette for this role at all. *Fix:* either darken the tag text to meet AA at the current tint backgrounds, or treat this as a deliberate three-color exception and document it in DESIGN.md rather than leaving it as silent drift. → `/impeccable audit`

**[P1] Three fully-styled features shipped but never wired up** — a search box (`wiki.module.css:79-117`), a subscribe form (`page.module.css:213-297`, `ChangelogClient.tsx:49-69`), and article feedback/edit links (`wiki.module.css:428-475`, despite `editUrl` being populated in every article's frontmatter) all exist in CSS/markup but are never rendered or functional. A docs wiki with no working search hurts findability for exactly the visitor who has a specific question rather than browsing intent. *Fix:* wire up real search over the already-available article list, or remove the dead CSS/markup so the codebase doesn't overstate its own feature set. → `/impeccable harden`

**[P1] No `<main>` landmark on Changelog or Wiki** — confirmed via DOM query: zero `<main>`, zero `<nav>` elements on `/wiki`, while Privacy/Terms correctly wrap content in `<main>`. Screen-reader users rely on landmark navigation to jump straight to content; this fails outright on two of the four pages while working on the other two. *Fix:* wrap the timeline/article content in `<main>` to match the Privacy/Terms pattern. → `/impeccable audit`

**[P1] The one line a skeptical first-timer most needs to read clearly fails contrast, with no way to skip to it** — Privacy/Terms' "Last updated" date is `#888` at 13px (~3.9:1, below AA) — DESIGN.md itself already names this exact pattern as forbidden — and neither page has a table of contents or jump-links across its nine H2 sections, forcing a first-timer specifically trying to evaluate "do you sell my data" before signing in to scroll-and-scan the whole document. *Fix:* darken the date per DESIGN.md's own documented `#5c5c5c` pattern, and add lightweight jump-links to the two or three sections a trust-evaluating visitor actually needs. → `/impeccable clarify`

**[P2] Wiki content/URL mismatch** — `/wiki/tracking/smart-parse` renders with breadcrumb and H1 "Categories" — the file's frontmatter title changed but its slug didn't. Confusing for bookmarking/sharing and signals an incomplete rename pass. *Fix:* rename the file/slug to `categories`, or add a redirect if the old URL is already shared. → `/impeccable clarify`

## Persona Red Flags

**Jordan (First-Timer, evaluating trust before signing up):** No TOC/jump-links on Privacy/Terms means scrolling through "Acceptance of Terms" and "Description of Service" before reaching "Data Storage" — the section that actually answers the question that matters. The trust-critical "Last updated" date is also the lowest-contrast text on the page.

**Sam (Accessibility-Dependent):** No `<main>` landmark on two of four pages (P1 above); zero "skip to content" links across all four (confirmed via grep); icon-only back links have `aria-label="Back"` on Changelog (`ChangelogClient.tsx:185`) but no label at all on the equivalent Wiki icons (`WikiClient.tsx:286,322`) — same pattern, same author, inconsistent execution.

**Riley (Stress Tester):** The Categories/smart-parse slug mismatch is exactly the kind of drift this persona would surface first. The dead "archive ↓" button on Changelog is a genuine dead-end — it looks clickable, does nothing, and no older releases are reachable at all beyond the four shown.

## Minor Observations

- Privacy/Terms' `<Section>` component is duplicated verbatim across both files — fine at two pages, but a shared component would prevent silent divergence later.
- Changelog's `.tag` labels are 10px uppercase on tinted OKLCH backgrounds — already flagged above as a severe live contrast failure, worth double-checking after any fix since OKLCH lightness deltas can look tighter than they read in hex.
- 3 `clipped-overflow-container` warnings on Changelog — a positioned child being clipped by an ancestor container; worth a manual look to confirm nothing is silently hidden.
- Wiki's mobile back button uses inline `style={}` while the rest of the file uses the CSS module — a small in-file authoring inconsistency.
- Footer copyright text at `#888`/11px is likely fine under DESIGN.md's own decorative-text carve-out, unlike the Last-Updated date above.

## Questions to Consider

- If Privacy and Terms carry the most "financial-app trust" weight of any page in the product, why do they get the least navigational scaffolding (no TOC, no jump-links) of all four Read-mode pages?
- The Wiki ships CSS for search, feedback, and edit links that never render — was this cut for time or is it mid-build? Either way, should a finance app's public docs page look unfinished to anyone who inspects the DOM?
- Is the Changelog's Subscribe form ever going to be populated, or should the affordance — and its dead CSS — be removed so the page doesn't imply a capability it doesn't have?
