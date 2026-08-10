---
name: Ledger
description: A mobile-first personal budget tracker that uses your own Google Sheet as its database
colors:
  ink-primary: "#1a1a1a"
  ink-secondary: "#888888"
  ink-secondary-readable: "#5c5c5c"
  ink-tertiary: "#aaaaaa"
  surface-0: "#ffffff"
  surface-1: "#fafafa"
  surface-2: "#f5f5f5"
  border-subtle: "#e8e8e8"
  border-strong: "#c8c8c8"
  accent-interactive: "#5B3FFF"
  saved: "#0F9D58"
  saved-bg: "#e8f5e9"
  success: "oklch(0.65 0.13 150)"
  success-strong: "oklch(0.55 0.13 150)"
  success-text: "oklch(0.42 0.13 150)"
  success-bg: "oklch(0.97 0.03 150)"
  danger: "oklch(0.58 0.18 25)"
  danger-bg: "oklch(0.97 0.03 25)"
  danger-text: "#c0392b"
  warn: "oklch(0.72 0.12 55)"
  warn-text: "oklch(0.45 0.12 55)"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(48px, 7vw, 88px)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-2.5px"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.5px"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.3px"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontWeight: 500
    fontFeature: "tabular-nums"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  control: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink-primary}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "#333333"
  button-primary-disabled:
    backgroundColor: "{colors.border-strong}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "9px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    padding: "5px 8px"
  input:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "9px 11px"
  card:
    backgroundColor: "{colors.surface-1}"
    rounded: "{rounded.lg}"
    padding: "18px 20px"
  modal:
    backgroundColor: "{colors.surface-0}"
    rounded: "{rounded.lg}"
    padding: "28px 24px 24px"
---

# Design System: Ledger

## Overview

**Creative North Star: "The Quiet Ledger"**

Ledger looks like what it is: a precise, personal financial record, not a SaaS product performing enthusiasm. The system is grayscale-first — ink, surface, and border tones do almost all of the work — with exactly two colors allowed to speak: an electric violet (`#5B3FFF`) reserved for interactive/focus states, and a settled green (`#0F9D58`) reserved for savings and positive money. Every other surface stays black, white, and gray on purpose. Money itself gets the one typographic flourish in the system — tabular monospace numerals — while everything else stays in a plain, restrained sans-serif.

The system did not arrive fully tokenized: dashboard components (`src/components/dashboard/*`, `src/components/sheets/*`) are built with CSS Modules that consistently reference the `globals.css` custom properties (with hex fallbacks), while the app shell and marketing surfaces (`src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/demo/page.tsx`) use Tailwind utilities plus inline `style={}` objects with hand-typed hex values that happen to match the same palette. Both are legitimate, coexisting conventions in this codebase — treat them as two dialects of the same language, not a system to unify in one pass.

**Key Characteristics:**
- Grayscale-dominant surface; color is earned, not decorative
- Black pill buttons and underline tabs, not filled/rounded-rect tabs
- One purple accent for all interactive/focus states; one green accent for savings/positive money
- Tabular monospace numerals for money; plain sans-serif for everything else
- Flat by default; shadows appear only on things that float above the page (modals)
- No icon library in use — every icon is a hand-authored inline SVG

## Colors

The palette reads as ink-on-paper: near-black text, white-to-light-gray surfaces, gray borders doing the separating work color would do elsewhere. Two accents are allowed to break the grayscale, and each has exactly one job.

### Primary
- **Interactive Violet** (`#5B3FFF`): The single accent for anything interactive — focus rings (`outline: 2px solid #5B3FFF`), input focus borders, and focus box-shadows (`0 0 0 3px rgba(91, 63, 255, 0.18)`). This value is already `--color-primary-600` in the `@theme inline` block in `globals.css`, but nearly every usage in the codebase hardcodes the hex directly instead of referencing the token. Treat `#5B3FFF` as the canonical interactive accent going forward, and prefer wiring new code to `--color-primary-600` rather than retyping the hex. The fuller `--color-primary-50..950` violet ramp exists in `globals.css` but is not otherwise used anywhere in the product — it's available for future expansion (e.g. hover/active states of the accent), not a signal to introduce more violet UI today.

### Secondary
- **Savings Green** (`#0F9D58`): Reserved for money that's working in the user's favor — the landing page's "your sheet." highlight, savings-goal progress. Backed by `--color-saved-bg: #e8f5e9` for tinted fills.

### Neutral
- **Ink Primary** (`#1a1a1a`): Primary text, primary button fills, headline color.
- **Ink Secondary** (`#888888`): Secondary/meta text, inactive tab labels, placeholder-style copy. Below 4.5:1 contrast on white at any regular weight/size — WCAG's "large text" exception only kicks in at ~19px+ (or ~14px bold), not 14px regular. Use it only above that size, or for genuinely decorative meta text where misreading has no consequence; use `ink-secondary-readable` for everything else.
- **Ink Secondary Readable** (`#5c5c5c`): The AA-safe alternative for small (<14px) secondary/meta text that still needs to be read reliably — trust copy, legal links, form labels, timestamps. ~6.9:1 on white. Use this instead of Ink Secondary whenever the text is under 14px and someone actually needs to read it.
- **Ink Tertiary** (`#aaaaaa`): Rarely-used tertiary text; lowest priority of the three ink steps.
- **Surface 0 / 1 / 2** (`#ffffff` / `#fafafa` / `#f5f5f5`): Page background, recessed panel background, and hover/pressed surface, in ascending density.
- **Border Subtle** (`#e8e8e8`): Quiet, recessed container edges (cards, dividers).
- **Border Strong** (`#c8c8c8`) / **`#d8d8d8`**: Interactive/selectable container edges (inputs, outline buttons, selectable tiles). Note both hexes are in live use for essentially the same role — treat `#c8c8c8`/`--color-border-strong` as canonical and `#d8d8d8` as the value to converge toward it.

### Semantic States
- **Danger** (`--color-danger: oklch(0.58 0.18 25)`, text form `#c0392b`): Error/destructive text and borders. Error *text* is now converged on `#c0392b` / `--color-danger-text` everywhere (was split with `#e53e3e` in `SheetSelector.tsx`, fixed).
- **Success** (`--color-success: oklch(0.65 0.13 150)`, text form `--color-success-text: oklch(0.42 0.13 150)`): Distinct from Savings Green — used for success/confirmation states (e.g. the Changelog's "New" tag) rather than the money-specific savings meaning. Don't conflate the two; Savings Green is a brand color, Success is a system-feedback color, even though they're visually close. The base `--color-success` tone fails AA as text on `--color-success-bg`/tinted chips (2.6:1) — use `--color-success-text` for any text rendered on a tinted success surface.
- **Warn** (`--color-warn: oklch(0.72 0.12 55)`, text form `--color-warn-text: oklch(0.45 0.12 55)`): Warning state, e.g. the Changelog's "Fixed" tag. Same rule as Success: the base `--color-warn` tone fails AA as text on a tinted warn surface (2.2:1) — use `--color-warn-text` instead.

### Named Rules
**The Two-Color Rule.** Only violet and green are allowed to be color in an otherwise grayscale interface. Violet means "you can interact with this / this has focus." Green means "this is savings, or money working for you." A new feature that wants a third UI color should be treated as a decision, not a default.

## Typography

**Body/Display Font:** Inter (`var(--font-inter)`, with `system-ui, sans-serif` fallback)
**Numeric/Money Font:** JetBrains Mono (`var(--font-jetbrains-mono)`), weight 500, `font-variant-numeric: tabular-nums`

**Character:** Inter carries every word in the product — headlines, labels, body, navigation — at a small, disciplined size range (11–17px for UI, one large display size for hero moments). JetBrains Mono is reserved specifically for money: it never appears in prose, only in amounts, so that numbers visually announce themselves as data.

### Hierarchy
- **Display** (600, `clamp(48px, 7vw, 88px)`, line-height 0.95, tracking -2.5px): Hero numerals (Overview tab's "spent this month" figure) and the landing page headline. The one place the system allows itself to be loud.
- **Headline** (600, 28px desktop / 22px mobile, tracking -0.5px): Page-level section headings (e.g. the sheet picker's page title).
- **Title** (600, 15–16px): Modal titles, card headings.
- **Body** (400–500, 13px): The dominant UI text size — row labels, buttons, form values. This is the system's true "default" text size, not 16px.
- **Label** (500, 11px, uppercase, tracking 0.3–0.6px): Eyebrows, stat labels, section labels. Always paired with `ink-secondary` or darker — never the sole content on a line without a visible sibling for context.

Secondary/meta text sits at 12px, one step below Body — a consistent 11 / 12 / 13px micro-scale carries almost all UI text, with headline/display sizes reserved for genuinely large moments.

### Named Rules
**The Mono-Money Rule.** Any rendered monetary amount uses `var(--font-jetbrains-mono)` with `tabular-nums`. Never render a dollar figure in Inter — the monospace switch is what makes numbers scannable and columns align.

## Layout

Spacing is loosely rooted in a 4px unit rather than a strict 8pt grid: `4 / 8 / 12 / 16 / 24 / 32` px recur as block/section spacing, while a distinct, tighter `9–11px` range is reserved specifically for button and input internal padding (not a layout value — a control-density value). There is no declared `--spacing-*` token today; this is an observed, consistently-applied convention, not a formalized scale, so treat the numbers above as the de facto rhythm to match rather than a hard token to import.

Dashboard content is generally capped at a readable max-width (e.g. `520px` for the ledger card) rather than stretching full-bleed; the landing page instead uses a wider `900px` hero column with generous surrounding white space. Both are intentional per-surface choices: dashboard = dense/functional, landing/marketing = spacious/confident.

Responsive behavior is handled with a single breakpoint at `640px` (Tailwind's `sm:`), below which layouts collapse to a single column and font sizes step down one notch (e.g. headline 28px → 22px, display clamp floor 88px → 52px).

## Elevation & Depth

Flat by default. Cards, panels, inputs, and buttons are distinguished by **border and background**, not shadow — `border: 1px solid var(--color-border-subtle)` or `var(--color-border-strong)` is the primary depth cue at rest. Shadows are reserved for things that visually float above the page: modals only.

### Shadow Vocabulary
- **`--shadow-sm`** (`0 4px 14px rgba(0,0,0,0.18)`): Available in tokens; not currently exercised by a cataloged component — reserved for small floating elements (tooltips, popovers) if introduced.
- **`--shadow-md`** (`0 8px 24px rgba(0,0,0,0.09)`): Dropdown/listbox panels (`CustomSelect`).
- **`--shadow-lg`** (`0 16px 48px rgba(0,0,0,0.16)`): Modal panels (`ShareModal`, `SheetSelector`'s name-entry dialog — both now reference the token).

### Named Rules
**The Overlay-Only Shadow Rule.** A shadow means "this is not part of the page flow — it's floating above it." Anything still in normal document flow (cards, buttons, inputs, tiles) stays flat and uses border + background for separation instead.

## Shapes

Two radius families, used by role rather than by size:
- **Pill (`999px` / `--radius-pill`)**: All buttons and toggle/segmented controls. A button is never a rounded rectangle in this system — it's either a pill or (rare, small inline-form actions) a `6–8px` rectangle.
- **Rounded rectangle (`8px` small / `10–12px` large / `--radius-md` / `--radius-lg`)**: Cards, panels, inputs, modals, dropdown panels. Smaller radius for compact/dense containers (stat tiles, inputs), larger radius for roomier containers (forms, modals, the ledger card).

Borders are consistently `1px` (occasionally `1.5px` to signal a selected/emphasized state, e.g. a selected sheet tile) — never thicker, never used decoratively as a colored left/right accent bar.

## Components

Every control in this system is plain and bordered rather than filled-and-shadowed. Confidence comes from restraint: precise borders, exact grays, and one accent color doing focus duty — not gradients or decorative depth.

### Buttons
- **Shape:** Pill (`border-radius: 999px`) for primary/secondary CTAs and toggles; `6–8px` rounded rectangle for small inline-form actions (save/cancel inside an edit row).
- **Primary:** `background: #1a1a1a; color: #fff; padding: 9px 18px; font-size: 13px; font-weight: 500;`. Hover darkens to `#333`. Disabled swaps fill to `--color-border-strong` (`#c8c8c8`) rather than reducing opacity — prefer this pattern over `opacity: 0.5` for solid buttons; reserve opacity-based disabled state for outline/ghost buttons where a fill swap isn't available.
- **Secondary (outline):** `border: 1.5px solid #d8d8d8; background: transparent; color: #1a1a1a; padding: 9px 16px;`, same pill radius.
- **Ghost:** `border: none; background: none; color: var(--color-ink-secondary); padding: 5px 8px;` — for low-emphasis actions (Cancel inside inline forms) and icon-only edit/delete affordances (default `#ccc`, darkening to `ink-primary` on hover).
- **Destructive:** No canonical solid destructive button exists in the product today. Delete affordances are ghost icon buttons that mostly hover to the same neutral `ink-primary` as edit buttons; only one instance (`EverythingTab`) hovers to red (`#ef4444`). If a real destructive action needs a stronger warning, use `--color-danger` rather than inventing a new red, and do it consistently rather than per-component.

### Cards / Containers
- **Corner Style:** `10–12px` radius (`--radius-lg` for roomier containers, `8–10px` for compact tiles).
- **Background:** `--color-surface-1` (`#fafafa`) for form/edit panels; `--color-surface-0` (white) for list/selection cards.
- **Shadow Strategy:** None at rest (see Elevation & Depth) — borders only.
- **Border:** `1px solid var(--color-border-subtle)` for quiet containers, `1px solid var(--color-border-strong)` (thickening to `1.5px` when selected) for interactive/selectable containers.
- **Internal Padding:** `14–20px` for form/edit panels, `10–14px` for compact stat/goal tiles.

### Inputs / Fields
- **Style:** `border: 1px solid var(--color-border-strong); border-radius: 8px; padding: 9px 11px; font-size: 13px; background: var(--color-surface-0);`. `CustomSelect` reuses this exact styling — there is no native `<select>` left anywhere in the app (the last two, in `EverythingTab.tsx`, were converted); inputs and the dropdown trigger are visually one family.
- **Focus:** `border-color: #5B3FFF; box-shadow: 0 0 0 3px rgba(91, 63, 255, 0.18);` (or an inset variant, `inset 0 0 0 2px #5B3FFF`, where a parent clips outset box-shadow, e.g. `SheetSelector`'s pill-segmented filter) — applied to every input, select, and money-amount field in the app, including `SheetSelector.tsx` (previously the one gap; now fixed). This is the most consistently-implemented pattern in the whole codebase; match it exactly for any new field.
- **Error / Disabled:** Error borders/text now consistently use `--color-danger-border`/`--color-danger-text` (`#c0392b`). Destructive actions (delete buttons) use the shared `ConfirmDeleteButton` (`src/components/ui/ConfirmDeleteButton.tsx`) — first click arms it (danger-red ring + "click again" label), second click confirms. Use it for any new delete affordance instead of firing on a single click.

### Navigation
- **Style:** Underline tabs, not filled/pill tabs. `border-bottom: 2px solid transparent` at rest, `2px solid #1a1a1a` when active; label goes from `#888`/weight 400 to `#1a1a1a`/weight 600 on activation. `14px 0` vertical padding, `24–28px` right margin between tabs. This pattern is intentionally reused at two levels (top-level dashboard tabs and the "Everything" tab's internal sub-nav) — keep any new tab-like navigation on this same underline convention rather than introducing a filled/pill tab style.
- **Semantics:** Real tab navigation (the dashboard's 4-tab bar, the Everything sub-nav) uses `role="tablist"`/`role="tab"`/`aria-selected`, with the dashboard additionally wiring `aria-controls`/`role="tabpanel"` since it swaps one panel. Give any new tab-like control the same roles — a row of plain buttons announces as nothing to a screen reader.
- **Segmented toggle (different from tabs):** A separate pill-shaped, no-gap segmented control (e.g. transaction type, sheet-owner filter) where the active segment gets a solid fill (black, or green for a "refund"/positive variant) and white text — use this specifically for binary/ternary filters, not for primary navigation.

### Modals
- **Style:** `position: fixed` overlay (`rgba(0,0,0,0.4)` scrim) behind a panel with `border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); background: var(--color-surface-0); padding: 28px 24px 24px;`.
- **Motion:** Overlay fades in (`opacity 0 → 1`); panel enters with `{ opacity: 0, scale: 0.97, y: 8 } → { opacity: 1, scale: 1, y: 0 }`, `duration: 0.2, ease: [0.16, 1, 0.3, 1]` (matches `--ease-out`). Framer Motion's `AnimatePresence`, not Headless UI's `Dialog` — despite `@headlessui/react` being installed, it isn't used anywhere; the hand-rolled overlay + `AnimatePresence` pattern is the de facto standard.
- **Dismiss:** Click on the overlay itself (not the panel) closes the modal, via `if (e.target === e.currentTarget) onClose()`.

### Icons
No icon library is in active use (`lucide-react` is installed but never imported). Every icon is a hand-authored inline SVG: `strokeWidth="1.5"` (occasionally `1.6`), `strokeLinecap="round"`, `strokeLinejoin="round"`, `fill="none"` for line icons, sized contextually (10–22px, no shared size token). Treat this as the real, working icon convention — match stroke width and cap/join style for any new icon rather than introducing `lucide-react` mid-system without a deliberate decision to migrate everything.

## Do's and Don'ts

### Do:
- **Do** keep color to exactly two jobs: violet (`#5B3FFF`) for interactive/focus, green (`#0F9D58`) for savings/positive money. Everything else is grayscale.
- **Do** render every monetary amount in `var(--font-jetbrains-mono)` with `tabular-nums`.
- **Do** use pill radius (`999px`) for buttons and toggles, `8–12px` rounded rectangles for cards/inputs/modals — never a plain rectangle button, never a heavily-rounded (`16px`+) card.
- **Do** use borders and background, not shadows, for depth on anything still in page flow. Reserve shadow for modals and dropdown panels only.
- **Do** use underline tabs (`2px` bottom border) for primary navigation; reserve filled/pill segments for binary/ternary filters, not navigation.
- **Do** match the established focus treatment exactly (`border-color: #5B3FFF; box-shadow: 0 0 0 3px rgba(91,63,255,0.18)`) on any new interactive control.
- **Do** follow whichever authoring convention the surrounding code already uses — CSS Modules + custom properties inside `src/components/dashboard/*` and `src/components/sheets/*`; Tailwind + inline styles inside `src/app/page.tsx`-style shell/marketing surfaces. Both are legitimate; don't introduce a third pattern.

### Don't:
- **Don't** introduce a third UI color without treating it as a deliberate decision — the two-accent rule is load-bearing for how restrained this product feels.
- **Don't** use `#888`/`ink-secondary` for small (<14px) must-read text — it fails contrast at that size. Use `ink-secondary-readable` (`#5c5c5c`) or darker for small trust/legal/error copy and form labels.
- **Don't** add a drop shadow to a card, button, or tile that's still in normal page flow — that visual language is reserved for things that float above the page.
- **Don't** invent a new destructive-red — the system has `--color-danger` / `--color-danger-text` (`#c0392b`) already; converge on it instead of introducing another hex.
- **Don't** hardcode `#5B3FFF` as a fresh literal in new files if it can reference `--color-primary-600` instead — the token exists, most usages just don't point at it yet.
- **Don't** add `lucide-react` icons alongside hand-authored SVGs without deciding to migrate the whole icon set — right now hand-authored SVG (1.5px stroke, round caps) is the only convention in use, even though an icon library is installed.
- **Don't** use `@headlessui/react` for a new modal — despite being installed, it's unused; the established modal pattern is a hand-rolled overlay + Framer Motion `AnimatePresence`.
