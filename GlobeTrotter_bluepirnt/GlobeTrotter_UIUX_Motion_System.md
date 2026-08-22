# GlobeTrotter — Production UI/UX & Motion System
### Companion to the Master Blueprint — design system, animation choreography, responsive rules, zero-defect QA

> This file assumes `GlobeTrotter_Master_Blueprint.md` (features, data model, phases) already exists. That file says *what* to build; this one says *exactly how it should look, move, and behave* so the result reads as a shipped product, not a hackathon prototype.

---

## 1. Design Philosophy

Three rules govern every decision below:

1. **One signature, everything else quiet.** Pick a single memorable visual/motion idea (Section 2) and spend the "boldness budget" there. Every other screen stays disciplined, consistent, and gets out of the content's way.
2. **Nothing generic.** Avoid the three looks every AI-assisted build defaults to: (a) warm cream background + high-contrast serif + terracotta accent, (b) near-black background + single neon accent, (c) broadsheet hairline-rule newspaper layout. GlobeTrotter's identity (Section 2) is deliberately built from the product's own subject matter — travel, routes, journals — not a generic template.
3. **Zero UI errors is a feature, not a QA afterthought.** Every component in Section 5 is specified with *all* of its states — not just the happy path — and Section 8 is a literal checklist to run before calling any screen "done."

---

## 2. Visual Identity — "Atlas & Ink"

**Concept:** a polished travel-journal / cartography aesthetic — the feeling of a well-kept explorer's notebook, not a generic SaaS dashboard. This also honors the hand-drawn wireframe sketches you started from, evolved from sketch to shipped product rather than discarded.

**Signature element:** a **route thread** — a thin animated dotted/curved line that draws itself to connect sequential items: itinerary day-blocks, calendar trip spans, and the dashboard's "previous trips" rail. It's the one motion idea that repeats everywhere and is the thing a user would describe GlobeTrotter by.

### Color system (dark-first)

| Token | Hex | Use |
|---|---|---|
| `ink-950` | `#0E1420` | App background (dark mode default) |
| `ink-900` | `#141C2C` | Surface / card background |
| `ink-800` | `#1E2A3F` | Elevated surface / hover surface |
| `parchment-50` | `#F6F1E4` | Light-mode background, and text-on-dark at reduced opacity for a "paper" warmth |
| `brass-500` | `#C9973F` | Primary accent — buttons, links, active tab, route thread |
| `brass-400` | `#DDB35F` | Primary hover/lighter accent |
| `coral-500` | `#E8674A` | Secondary accent — used *only* for overbudget alerts, destructive actions, "live/ongoing" badge |
| `sage-500` | `#7FA687` | Success — "completed" badge, saved confirmation, budget-under-target |
| `slate-300` | `#B7C0CE` | Secondary text on dark |
| `slate-500` | `#7C8798` | Placeholder / disabled text |

Light mode (opt-in via Profile toggle) inverts to `parchment-50` background, `ink-950` text, same accent hues at slightly deepened saturation for contrast.

### Typography

| Role | Face | Notes |
|---|---|---|
| Display (H1/H2, trip names, screen titles) | **Fraunces** (variable, optical size + soft weight axis) | Warm serif with a travel-journal character; use at 500–600 weight, never default 400 — thin serif reads generic. |
| Body / UI | **Inter** or **General Sans** | Workhorse; used for all form fields, buttons, body copy. |
| Data / utility (dates, budgets, coordinates-style meta) | **JetBrains Mono** or **IBM Plex Mono** | Used specifically for currency figures and date ranges — gives a "logbook" precision feel and makes numbers scannable. |

Fluid type scale (`clamp()`), base 16px:
```
--text-xs:   clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)
--text-sm:   clamp(0.875rem, 0.83rem + 0.2vw, 0.9375rem)
--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)
--text-lg:   clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem)
--text-xl:   clamp(1.375rem, 1.25rem + 0.6vw, 1.75rem)
--text-2xl:  clamp(1.75rem, 1.5rem + 1.2vw, 2.5rem)
--text-3xl:  clamp(2.25rem, 1.9rem + 1.8vw, 3.25rem)
```

### Spacing, radius, elevation

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px — no arbitrary values in component code.
- Radius: `--radius-sm: 8px` (inputs, chips), `--radius-md: 14px` (cards), `--radius-lg: 24px` (modals, hero banner) — rounded but not pill-shaped everywhere, matching the wireframes' rounded-rect cards.
- Elevation via soft, warm-tinted shadows (not default gray) — e.g. `box-shadow: 0 8px 24px -8px rgba(20,28,44,0.45)` on `ink` surfaces, `rgba(30,20,10,0.12)` on parchment.

### Iconography

Lucide icons (already available in this environment via `lucide-react`) at a consistent 1.5px stroke; no mixed icon sets. Trip-status badges get a small custom glyph set (compass = draft, plane = ongoing, checkmark-stamp = completed) rather than generic dots — a cheap way to reinforce the journal identity without extra animation cost.

---

## 3. Motion Tokens

```
--ease-standard: cubic-bezier(0.16, 1, 0.3, 1);     /* the one easing curve, used everywhere */
--duration-instant: 100ms;   /* toggle states, checkbox */
--duration-fast:    160ms;   /* button/icon hover */
--duration-base:    240ms;   /* card hover, tab switch */
--duration-slow:    420ms;   /* modal open, route-thread draw segment */
--duration-page:    520ms;   /* full route/page transition */
```

**Global rule:** every animation must be wrapped so it's skipped or reduced to a simple opacity fade when `prefers-reduced-motion: reduce` is set. This is not optional per screen — bake it into the shared `motion` wrapper components once, in Phase 0, so nothing downstream forgets it.

**Performance rule:** animate only `transform` and `opacity` (GPU-friendly). Anything animating `width`/`height`/`top`/`left` needs a specific justification comment in code, or it gets rewritten.

---

## 4. Animation & Library Stack (best-in-class, not generic)

| Purpose | Library | Where it's used |
|---|---|---|
| Core UI motion, shared-layout transitions, drag-reorder | **Framer Motion** (`motion/react`) | Card hover/tap, `layoutId` transitions (city card → search result → itinerary), `<Reorder>` for itinerary sections |
| Scroll-driven & timeline animation | **GSAP + ScrollTrigger** | Dashboard hero banner parallax, route-thread "drawing itself" as the user scrolls the itinerary view |
| Buttery smooth scrolling | **Lenis** | Wraps the Dashboard and Community feed for inertia scroll that makes the scroll-triggered GSAP work feel intentional, not janky |
| Vector micro-animations / empty states | **Lottie via `dotlottie-react`** | Empty-state illustrations (no trips yet, no search results), success confirmation (trip published) |
| Accessible primitives with built-in motion hooks | **Radix UI** (via shadcn/ui) | Dialog, Dropdown, Tabs, Tooltip, Popover — gives correct focus-trap + enter/exit animation for free, don't hand-roll these |
| Mobile bottom-sheet drawer | **Vaul** | Filter/Sort controls and "Add to Trip" actions on mobile, where a modal would feel wrong on a small screen |
| Toasts | **Sonner** | All success/error/loading toasts — has a built-in stacking + swipe-to-dismiss model, don't build a custom one |
| Command palette (power-user polish) | **cmdk** | Optional `⌘K` quick "jump to trip / search city" — a small, high-perceived-craft addition for the demo |
| Charts with animated entry | **Tremor** or **Recharts** (`isAnimationActive`) | Budget Summary pie/bar, Admin trend line — animate the fill/height in on mount, not on every re-render |
| Success micro-celebration | **canvas-confetti** | One-shot, subtle, low-opacity burst when a trip is marked complete or published — used exactly once per action, never looping |
| Native page transitions (progressive enhancement) | **View Transitions API** (`next/navigation` + `startViewTransition`) | Cross-fade between major routes on browsers that support it; Framer Motion `AnimatePresence` as the fallback |

**Explicitly not used:** Three.js/react-three-fiber or any 3D hero. A travel journal identity doesn't call for a 3D globe spinning in the hero — that's the generic "AI travel app" move. The route-thread signature does more identity work for less complexity and risk.

---

## 5. Component States Matrix (zero-defect baseline)

Every component below must be built with **all** listed states before it's considered done — this is the actual mechanism behind "no UI error should be there."

| Component | Required states |
|---|---|
| **Button** | default, hover, focus-visible (ring), active/pressed, loading (inline spinner, label preserved), disabled, destructive variant |
| **Text input / textarea** | empty, filled, focus, valid, invalid (with inline message), disabled, read-only, character-limit-reached (Additional Information field) |
| **Date range picker** | empty, partial (start only), valid range, invalid (end before start), disabled dates (blocked in the past for Create Trip) |
| **Card (trip/city/activity)** | default, hover (lift + shadow), focus (keyboard nav), loading (skeleton), selected/active, disabled (e.g. sold-out or past activity) |
| **Search / filter results list** | loading (skeleton rows), populated, empty ("no results — try a different filter", not a bare blank), error (retry button), paginating/loading-more |
| **Modal / dialog (Budget Summary, Share)** | opening transition, open, closing transition, focus-trapped, scroll-locked background, mobile → becomes a Vaul bottom sheet |
| **Toast** | success, error, loading→success handoff, stacked (2+ toasts), auto-dismiss + manual dismiss |
| **Avatar / photo upload** | empty (initials fallback, never a broken image icon), uploading (progress ring), uploaded, upload-failed (retry) |
| **Trip status badge** | draft, planned, ongoing, completed — distinct icon + color per Section 2, never color-only (a11y) |
| **Itinerary day block** | populated, empty day ("no activities yet — add one"), dragging/reordering, over-budget flag on the paired expense box |
| **Calendar month cell** | empty, single trip, overlapping multi-trip (stacked chips, "+2 more" affordance), today indicator |
| **Community post** | text-only, with image, image-failed-to-load fallback, liked/unliked toggle, own-post (edit/delete affordance) vs. others' |
| **Admin chart card** | loading skeleton, populated, no-data-yet (new deployment), error |
| **Global** | 404 route, 500/server-error boundary, offline banner (network lost), session-expired → redirect-to-login with return path preserved |

---

## 6. Responsive System

### Breakpoints

```
--bp-xs: 0px       /* phones portrait */
--bp-sm: 480px     /* phones landscape / small tablets */
--bp-md: 768px     /* tablets */
--bp-lg: 1024px    /* small laptops */
--bp-xl: 1280px    /* desktop */
--bp-2xl: 1536px   /* large desktop */
```

### Layout rules per pattern

| Pattern | Mobile (≤480) | Tablet (481–1024) | Desktop (>1024) |
|---|---|---|---|
| Card grids (Top Regional, Trip cards, Activity results) | 1 column, full-bleed cards | 2 columns | 3–4 columns; use **container queries** on the grid wrapper, not just viewport breakpoints, since these grids nest inside modals/sheets at different widths |
| Itinerary Builder sections | Stacked, full-width, drag-handle enlarged to 44px touch target | Stacked, slightly inset | Stacked with max-width 720px, centered — this screen never benefits from multi-column |
| Itinerary View day blocks | Single column, route-thread renders vertically | Single column, wider gutters | Two-column (Physical Activity / Expense) as wireframed |
| Calendar month grid | Horizontally scrollable week rows OR agenda-list fallback view (toggle) | Full 7-column grid, smaller cells | Full 7-column grid |
| Admin dashboard charts | Stacked full-width, charts scroll horizontally if dense | 2-column | Full 2x2/3-column dashboard grid as wireframed |
| Nav | Bottom tab bar (Dashboard / My Trips / Search / Community / Profile) | Bottom tab bar or collapsed side rail | Persistent left sidebar |

### Non-negotiables

- **Touch targets** ≥ 44×44px on any device with `pointer: coarse`.
- **Safe-area insets** (`env(safe-area-inset-*)`) respected on the bottom tab bar and any full-bleed mobile sheet.
- **Orientation:** Calendar and Itinerary View must both remain usable in landscape on mobile, not just portrait — test explicitly.
- **No horizontal overflow** anywhere at 320px width (smallest realistic device) — this is checked per screen in Section 8, not assumed.
- **Images** always via responsive `srcset`/`next/image` with an explicit aspect-ratio box to prevent layout shift (CLS).

### Device test matrix (minimum before demo)

iPhone SE (320px, worst case), iPhone 14/15 (390px), a mid Android (360–412px), iPad portrait + landscape, a 1366px laptop, a 1920px desktop.

---

## 7. Screen-by-Screen Motion & Responsive Notes

Builds directly on the Master Blueprint's Section 6 screen specs — this adds the *how it moves* and *how it reflows* layer only.

| Screen | Signature motion | Mobile-specific note |
|---|---|---|
| Login/Register | Form fields fade+rise in staggered on mount (80ms stagger); error shake (subtle, 1 cycle, respects reduced-motion → becomes a color flash instead) | Photo upload circle opens native camera/gallery picker directly, no custom cropper on mobile v1 |
| Dashboard | Banner has a slow GSAP parallax on scroll; "Top Regional" cards stagger-reveal on first paint via Framer Motion `whileInView` | Banner height caps at 40vh on mobile to avoid pushing content below the fold |
| Create Trip | Suggestion cards animate in (stagger) the moment a place is selected — this is the "reward" moment for filling the form | Date pickers open as a Vaul bottom sheet, not a floating popover (avoids off-screen popover bugs) |
| Itinerary Builder | Section cards use Framer Motion `<Reorder>` with spring physics on drag; "Add another Section" button has a small bounce on click | Drag handle is a dedicated 44px grip icon, not the whole card (prevents accidental drags while scrolling) |
| Itinerary View + Budget | **Route-thread signature**: the connecting line between Day N activity blocks draws itself via GSAP `ScrollTrigger` scrub as the user scrolls; Budget modal's pie chart wedges animate in with a slight delay cascade | Two-column (activity/expense) collapses to stacked with the expense box inline below each activity, thread becomes a simple vertical dotted line |
| My Trips | Status badge icon does a one-time 200ms pop when a trip's status changes (e.g. draft → planned) | Ongoing/Upcoming/Completed become swipeable tabs instead of stacked sections, to save vertical scroll |
| Profile | Edit fields expand in place (height auto-animate via `AutoAnimate`) rather than opening a separate edit modal | |
| City/Activity Search | Result rows stagger in on filter change (not on every keystroke — debounce 250ms first) | Filter/Sort open as Vaul sheets |
| Community Tab | Like button: small scale-pop + color fill, no full-screen confetti (reserve confetti for trip completion only) | Feed uses inertia scroll (Lenis) tuned lighter than Dashboard to feel native |
| Calendar | Month transition slides horizontally (prev/next) with the outgoing month fading faster than the incoming one slides in — avoids the "two months overlapping" glitch | Falls back to agenda list view under 480px width if the grid can't fit legibly |
| Shared/Public Itinerary | Same route-thread as Itinerary View, "Copy this Trip" button gets a distinct filled-brass style so it reads as the primary CTA on a read-only page | |
| Admin Dashboard | Charts animate their fill on mount only, never on tab-switch back (cache the "already animated" state) | Charts stack vertically; tab bar becomes horizontally scrollable chips |

---

## 8. Zero-Defect QA Checklist

Run this **per screen**, not just once globally, before marking a phase (from the Master Blueprint's Section 11) as done.

**Visual**
- [ ] No horizontal scroll/overflow at 320px width
- [ ] No layout shift on image/font load (aspect-ratio boxes reserved, `font-display: swap` with fallback metrics matched)
- [ ] Every color pairing checked at ≥4.5:1 contrast (body text) / ≥3:1 (large text, icons)
- [ ] Dark and light mode both checked, not just the default
- [ ] No orphaned/widowed single words in headings at any breakpoint

**Interaction**
- [ ] Every interactive element has a visible focus-visible ring (not just `:focus`, which fires on mouse click too)
- [ ] Tab order matches visual order on every screen
- [ ] All modals trap focus and return focus to the trigger on close
- [ ] Every destructive action (delete trip, delete stop) has a confirm step
- [ ] Every async action shows a loading state within 100ms of trigger — never a frozen button

**States**
- [ ] Loading, empty, error, and populated states all exist and were actually triggered/screenshotted, not assumed from code
- [ ] Every list/grid has a real empty state with guidance text, not a blank area
- [ ] Every form field's invalid state was actually triggered and reads clearly (voice per Section 9)
- [ ] Network failure (offline, 500) was simulated per screen that fetches data

**Motion**
- [ ] `prefers-reduced-motion` tested — every animation degrades to instant or simple fade
- [ ] No animation blocks interaction (e.g. can't tap "Save" while a card is still animating in)
- [ ] Nothing animates on every re-render — only on genuine state transitions

**Responsive**
- [ ] Checked against the full device matrix in Section 6, not just Chrome DevTools' default presets
- [ ] Landscape mobile checked for Calendar and Itinerary View specifically
- [ ] Touch targets measured, not eyeballed, on at least one real or simulated touch device

---

## 9. Voice & Microcopy Rules

- Buttons say exactly what happens: **"Save trip,"** not "Submit." The confirmation toast then says **"Trip saved,"** matching vocabulary — same verb, start to finish.
- Errors state what happened and how to fix it, without apologizing or being vague: *"That date range overlaps another section. Adjust the end date."* — not "Something went wrong."
- Empty states are an invitation, not a dead end: *"No trips yet — plan your first one"* with the CTA right there, not a lone icon.
- Name things by what the person controls: "Your trips," not "User trip records." "Add to trip," not "Create itinerary item."

---

## 10. Performance & Motion Budget

- Target Lighthouse ≥ 90 (Performance, Accessibility, Best Practices) on the Dashboard and Itinerary View at minimum — these are the screens judges will linger on.
- Animate only `transform`/`opacity`; anything else needs a code comment justifying it.
- Cap concurrent GSAP ScrollTrigger instances per page — the route-thread trigger should be the only scroll-scrubbed animation on the Itinerary View, not layered with three others.
- Lazy-load Lottie/GSAP bundles on the routes that use them (dynamic `import()`), don't ship them in the global bundle.
- Debounce all search-as-you-type inputs (≥ 250ms) before triggering animation + network call together.

---

## 11. Definition of Done (per screen)

A screen ships only when: it matches Section 7's motion spec, passes every box in Section 8's checklist, uses only tokens from Sections 2–3 (no ad-hoc hex/spacing values), and has been viewed at every breakpoint in Section 6's device matrix in **both** color modes.
