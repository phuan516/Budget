# Handoff: Wiki / Help & Docs

## Overview
The help-documentation surface for the Ledger budget-tracking app — a three-pane docs reader in the GitBook / Stripe-docs lineage. A grouped nav tree on the left, a single readable article column in the middle, and an "on this page" table of contents on the right. The surface is public (reachable from the marketing site) and linked from the in-app "Help" affordance in the top nav.

Three responsive forms are specified:
- **Desktop article** (1200 × 800 reference) — three-pane: nav tree · article · on-this-page TOC
- **Mobile index** (375 × 760 reference) — search + grouped, tappable list of articles (the nav tree as a full screen)
- **Mobile article** (375 × 760 reference) — back/breadcrumb bar + single-column article, no side rails

## About the Design Files
The HTML files in this bundle are **design references** — mid-fidelity wireframes showing layout, hierarchy, and intended behavior. They are **not production code to copy directly**.

Recreate the design in the target codebase's existing environment (React + Tailwind, Remix, plain React, etc.) using its established patterns and design tokens. If no codebase exists yet, use Next.js App Router. Article bodies are a natural fit for MDX.

## Fidelity
**Mid-fidelity.** Structure, hierarchy, copy, and spacing relationships are intentional. Palette is grayscale plus a single accent green used sparingly (active nav item, active TOC marker, callout, the inline category token in the example block). The faux grey paragraph bars (`TextLines`) and dashed `screenshot · …` boxes are **placeholders for real content**, not design elements.

---

## Screen · Wiki / Docs

### Purpose
1. "Where is the thing I need?" — grouped nav tree + search.
2. "Read one topic, top to bottom" — a comfortable, single-column article with headings, callouts, examples, and inline screenshots.
3. "Jump around within a long article" — the on-this-page TOC with scrollspy.
4. "Was this useful?" — per-article helpfulness feedback.

### Route
`/help` (index) · `/help/:section/:slug` (article) — e.g. `/help/tracking/smart-parse`. Public; also reached from the in-app "Help" nav item and from contextual "Learn more" links.

---

### Layout — Desktop article (1200 × 800 reference)

Three columns inside a plain white frame (no top-nav chrome in the reference — drop it onto whatever shell the surface already has). Outer flex row, full height.

1. **Nav tree (left)** — `width: 230px`, border-right `1px solid #ececec`, `padding: 24px 18px`, `overflow: hidden`, `flex-shrink: 0`
   - **Search field** (margin-bottom 22): `border: 1px solid #d8d8d8`, border-radius 8, padding `7px 10px`, flex row gap 8 — search glyph (13px, 1.5 stroke) + "Search docs" (12 / `#888`) + a `/` keyboard hint (`.wf-kbd`: JetBrains Mono 10, bordered, pushed right with `margin-left: auto`).
   - **Groups** — each `margin-bottom: 18`:
     - Group eyebrow (10 / uppercase / `#888` / letter-spacing 0.4 / margin-bottom 8) — e.g. "Getting started", "Tracking", "Money", "Sharing".
     - Items — column, gap 2. Each item: 13px, padding `5px 8px`, border-radius 6.
       - **Inactive**: `#444` / 400, transparent bg, `border-left: 2px solid transparent`.
       - **Active**: `#1a1a1a` / 600, `background: --accent-soft`, `border-left: 2px solid --accent`.

2. **Article (center)** — `flex: 1`, `padding: 34px 52px`, overflow hidden. Content column capped at **max-width 540** throughout.
   - **Breadcrumb** (11 / `#888`, flex gap 6, margin-bottom 14): `Section › Article` — the trailing article crumb is `#444`.
   - **H1** — 30 / 600 / letter-spacing -0.6, margin-bottom 10.
   - **Lede** — 14 / `#888` / line-height 1.5, margin-bottom 24, max-width 540.
   - **H2 section heading** — 16 / 600, margin-bottom 12. (Repeats per section.)
   - **Body paragraphs** — real prose in production (placeholdered as grey bars here).
   - **Callout / Tip** — flex row gap 12, `background: --accent-soft`, `border: 1px solid oklch(0.85 0.06 150)`, border-radius 10, padding `14px 16px`, margin `20px 0`, max-width 540. Leading 16×16 accent-green dot (`margin-top: 1`, `flex-shrink: 0`), then a label "Tip" (12 / 600 / margin-bottom 5) over body copy. Supports variants (Tip / Note / Warning) — see Behavior.
   - **Example / code block** — `border: 1px solid #d8d8d8`, border-radius 10, `overflow: hidden`, max-width 540, margin-bottom 24:
     - Header bar: padding `8px 14px`, border-bottom `1px solid #ececec`, JetBrains Mono 10 / `#888`, space-between — left label ("example"), right action ("copy").
     - Body: padding 14, JetBrains Mono 12 / `#444` / line-height 1.8. Lines use a dim `#888` gutter token (`in` / `out`); the inline category ("Food") is rendered in **accent green**.
   - **Inline screenshot** — dashed `Placeholder` (`screenshot · rule editor`), height 120, max-width 540.
   - **Helpful footer** — flex row gap 10, margin-top 28, padding-top 18, `border-top: 1px solid #ececec`, max-width 540: "Was this helpful?" (12 / `#888`), two `.wf-chip` buttons (👍 Yes / 👎 No), then "Edit on GitHub ↗" pushed right (11 / `#888`).

3. **On-this-page TOC (right)** — `width: 188px`, border-left `1px solid #ececec`, `padding: 34px 22px`, `flex-shrink: 0`
   - Eyebrow "On this page" (10 / uppercase / `#888` / letter-spacing 0.4 / margin-bottom 12).
   - Items — column, gap 9, each `padding-left: 10`, line-height 1.3.
     - **Active** (current section): `#1a1a1a` / 600, `border-left: 2px solid --accent`.
     - **Inactive**: `#888` / 400, `border-left: 2px solid #ececec`.

### Layout — Mobile index (375 × 760 reference)

Phone frame (status bar + 375-wide body).

1. **Header** — `padding: 16px 20px 14px`, border-bottom `1px solid #ececec`
   - Title "Help & docs" (20 / 600 / letter-spacing -0.4, margin-bottom 12).
   - Search field — same treatment as desktop (border, radius 8, padding `9px 11px`, glyph + "Search docs" 13 / `#888`), full width, no `/` hint.

2. **Scroll body** — absolute below header (`inset: 92px 0 0`), `padding: 6px 20px 0`, overflow scroll
   - One block per group, `border-bottom: 1px solid #ececec`, `padding: 14px 0`:
     - Group eyebrow (10 / uppercase / `#888` / 0.4 / margin-bottom 10).
     - Items — column gap 1. Each is a full-width tappable row: `padding: 9px 0`, 14px text in a `flex: 1` span, trailing chevron (14px, 1.5 stroke, `#888`).

### Layout — Mobile article (375 × 760 reference)

Phone frame.

1. **Sticky bar** — `padding: 14px 18px`, border-bottom `1px solid #ececec`, flex row gap 12, white bg: back chevron (16px, 1.6 stroke), section crumb ("Tracking", 12 / `#888`), and an overflow "⋯" (three dots, 1.5 stroke) pushed right via `margin-left: auto`.

2. **Scroll body** — absolute below bar (`inset: 79px 0 0`), `padding: 20px 20px 0`, overflow scroll. Full-width column (no 540 cap):
   - H1 — 23 / 600 / letter-spacing -0.4, margin-bottom 8.
   - Lede — 13 / `#888` / line-height 1.5, margin-bottom 20.
   - Section heading — 15 / 600, margin-bottom 10 (note: a plain styled div here, not an `<h2>` — use a real heading in production for a11y).
   - Callout, example block, and inline screenshot — same components as desktop, full-width (no max-width), slightly tighter padding (callout `13px 14px`, code body 12, screenshot height 110).

---

### Behavior

- **Nav tree** — clicking an item routes to that article and marks it active (accent-soft pill + green left border). On desktop the tree persists across articles; current article stays highlighted. Collapsible groups are optional — the reference shows them all expanded.
- **Search** — `/` focuses the search field (desktop hint shown). Opens a command-palette-style overlay or inline results list; full-text over article titles + bodies. Mobile: tapping the field opens the same search.
- **On-this-page TOC** — generated from the article's H2/H3 headings. Click scrolls to that heading; the active marker tracks scroll position via `IntersectionObserver` (scrollspy). Do **not** use `scrollIntoView` if it disrupts the host app — use container `scrollTo`.
- **Callout variants** — `tip` (accent green, as drawn), `note` (neutral grey), `warning` (amber, reuse `--warn` / `oklch(0.95 0.03 55)`). Authoring picks the variant; the dot + border + label color shift accordingly.
- **Example block "copy"** — copies the raw example text to the clipboard; show a transient "Copied" state on the action label.
- **Helpful feedback** — 👍 / 👎 posts to a feedback endpoint with the article slug; replace the buttons with a short "Thanks" acknowledgement after submit. "Edit on GitHub" deep-links to the source MDX file.
- **Mobile flow** — index (grouped list) → tap row → article. The sticky bar's back chevron returns to the index; the section crumb is tappable back to the group. "⋯" opens share / copy-link / feedback.
- **Deep-linking** — headings carry slug `id`s; `/help/tracking/smart-parse#teaching-it-rules` scrolls to and highlights that section.

### State

```ts
interface NavItem {
  title: string;        // "Smart parse & categories"
  slug: string;         // "smart-parse"
  section: string;      // "Tracking"
}

interface NavGroup {
  group: string;        // "Tracking"
  items: NavItem[];
}

interface TocEntry {
  label: string;        // "How it works"
  id: string;           // "how-it-works"
  level: 2 | 3;
}

interface Article {
  title: string;
  section: string;
  slug: string;
  lede: string;
  bodyMdx: string;      // rendered to headings / paragraphs / callouts / code / images
  toc: TocEntry[];      // derived from headings
  editUrl: string;      // "Edit on GitHub" target
}

// client-only UI state
interface WikiUI {
  activeSlug: string;
  activeTocId: string;  // driven by scrollspy
  searchOpen: boolean;
  searchQuery: string;
}
```

### Data sources
- Articles authored as **MDX** (or a CMS) under a section taxonomy; the nav tree is built from frontmatter (`section`, `order`, `title`). The whole docs set can be statically generated and revalidated on publish.
- TOC is derived at build time from each article's headings.
- Search index generated at build time (e.g. a static FlexSearch/Pagefind index) — no server round-trip needed for typeahead.
- Helpfulness votes POST to an analytics/feedback endpoint keyed by article slug.

---

## Design Tokens

### Colors
| Token | Hex / oklch | Usage |
|---|---|---|
| `--ink` | `#1a1a1a` | H1/H2, active nav + TOC label |
| `--ink-2` | `#444` | body copy, nav items, code body, trailing breadcrumb crumb |
| `--ink-3` | `#888` | eyebrows, lede, breadcrumb, search placeholder, inactive nav/TOC, code gutter |
| `--line` | `#d8d8d8` | search/card/code borders |
| `--line-2` | `#ececec` | column dividers, header/footer rules, inactive TOC marker, faux text-line bars |
| `--bg` | `#ffffff` | page fill |
| `--bg-2` | `#fafafa` | dashed-placeholder fill |
| `--accent` | `oklch(0.65 0.13 150)` | active nav border, active TOC marker, callout dot, inline category token |
| `--accent-soft` | `oklch(0.94 0.04 150)` | active nav bg, callout bg |
| `--accent-border` | `oklch(0.85 0.06 150)` | callout border |
| `--warn` / `--warn-soft` | `oklch(0.72 0.12 55)` / `oklch(0.95 0.03 55)` | warning-variant callout |

### Typography
- Family: **Inter** (400 / 500 / 600). Code/example blocks and the `/` hint use **JetBrains Mono** (400/500).

| Role | Size / weight / letter-spacing / line-height |
|---|---|
| H1 (desktop) | 30 / 600 / -0.6 |
| H1 (mobile article) | 23 / 600 / -0.4 |
| Mobile index / changelog-style screen title | 20 / 600 / -0.4 |
| H2 section heading | 16 / 600 (desktop) · 15 / 600 (mobile) |
| Lede | 14 / 400 / 1.5 (desktop) · 13 (mobile) |
| Nav item | 13 / 400 (active 600) |
| Mobile index row | 14 / 400 |
| TOC item | 12 / 400 (active 600) / 1.3 |
| Breadcrumb / eyebrow / search placeholder | 10–12 / `#888` |
| Code / example | 12 / 1.8 (desktop) · 11.5–12 (mobile), JetBrains Mono |
| `/` hint (`.wf-kbd`) | 10, JetBrains Mono, bordered |

### Spacing scale
4px base. Used: 1, 2, 5, 6, 7, 8, 9, 10, 12, 14, 18, 20, 22, 24, 28, 34, 52.

### Radii
- Search field / callout / code block / cards: `8–10px`
- Nav item: `6px`
- Pills / chips: `999px`
- Callout & TOC markers: 2px left border (not a radius)

### Layout widths
- Nav tree `230` · on-this-page TOC `188` · article content cap `540` (centered within the flexible middle column).

---

## Responsive Behavior
- **≥ 1024px** — three-pane as drawn (nav tree · article · TOC).
- **768–1023px (tablet)** — drop the right-hand TOC (or float it as a collapsible "On this page" disclosure at the top of the article); keep the nav tree, or collapse it behind a "Docs" menu button. Article keeps its 540 cap.
- **< 768px (mobile)** — no side rails. Index screen is the grouped, tappable list; article screen is single-column with the sticky back/breadcrumb bar. Search moves into the header.

## Assets
- No raster assets. All icons (search glyph, chevrons, back chevron, "⋯") are inline SVG at **1.5–1.6px stroke** — swap for your icon library, matching stroke weight.
- The faux paragraph bars (`TextLines`) and dashed `screenshot · …` boxes are placeholders for real copy and real screenshots — not design elements.

## Files in this bundle
| Path | Contents |
|---|---|
| `reference/Budget Tracker Wireframes.html` | Entry point — renders the wiki desktop article + mobile index + mobile article artboards on the canvas. |
| `reference/design-canvas.jsx` | Supporting canvas component (pan/zoom/focus). Not part of the app. |
| `reference/wireframes/shared.jsx` | Shared primitives (`DesktopFrame`, `PhoneFrame`, `Placeholder`, `WF` tokens, `StatusBar`). |
| `reference/wireframes/docs.jsx` | **The canonical wiki design** — `WikiA` (desktop), `WikiMobileIndex`, `WikiMobileArticle`, plus the `TextLines` placeholder helper. Also contains the Changelog components, which are not part of this handoff. |

## Implementation Checklist
1. Three-pane desktop layout: nav tree · article (540 cap) · on-this-page TOC
2. Grouped nav tree with active-item styling (accent-soft pill + green left border)
3. Search field with `/` focus shortcut + typeahead/command-palette results
4. Article primitives: breadcrumb, H1, lede, H2 sections, body, callout (tip/note/warning variants), example/code block with copy, inline screenshot
5. On-this-page TOC generated from headings + scrollspy (active marker tracks scroll)
6. Helpful (👍/👎) feedback footer + "Edit on GitHub" deep link
7. Mobile index: search + grouped tappable list with chevrons
8. Mobile article: sticky back/breadcrumb bar + single-column body, no rails
9. Heading-level deep-link anchors (`#teaching-it-rules`)
10. Responsive breakpoints (tablet TOC/tree collapse + mobile index↔article flow)
