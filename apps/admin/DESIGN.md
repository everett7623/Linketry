---
name: Linketry Admin
description: Self-hosted operator console for short links, analytics, and monitoring
colors:
  brand-600: "oklch(51.1% 0.262 276.966)"
  brand-500: "oklch(58.5% 0.233 277.117)"
  brand-700: "oklch(45.7% 0.24 277.023)"
  slate-950: "oklch(12.9% 0.042 264.695)"
  slate-900: "oklch(20.8% 0.042 265.755)"
  slate-800: "oklch(27.9% 0.041 260.031)"
  slate-700: "oklch(37.2% 0.044 257.287)"
  slate-400: "oklch(70.4% 0.04 256.788)"
  slate-300: "oklch(86.9% 0.022 252.894)"
  slate-100: "oklch(96.8% 0.007 247.896)"
  status-success: "oklch(76.5% 0.177 163.223)"
  status-danger: "oklch(70.4% 0.191 22.216)"
  status-warning: "oklch(90.5% 0.182 98.111)"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "2rem"
    letterSpacing: "0em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: "1.25rem"
    letterSpacing: "0em"
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
    letterSpacing: "0em"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "0em"
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
    letterSpacing: "0em"
rounded:
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  "2xl": "1rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  "2xl": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-600}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.brand-700}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.slate-700}"
    textColor: "{colors.slate-100}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.slate-300}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  button-danger:
    backgroundColor: "oklch(57.7% 0.245 27.325)"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  input-default:
    backgroundColor: "{colors.slate-900}"
    textColor: "{colors.slate-100}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem"
  card-panel:
    backgroundColor: "{colors.slate-900}"
    textColor: "{colors.slate-100}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
  badge-status:
    backgroundColor: "color-mix(in oklab, {colors.status-success} 15%, transparent)"
    textColor: "{colors.status-success}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
    typography: "{typography.label}"
---

# Design System: Linketry Admin

## Overview

**Creative North Star: "The Operator Console"**

Linketry Admin is a dark-first operator console: precise, trustworthy, and calm enough for daily short-link work, with enough brand signal (indigo accent, Logo mark, intentional chrome) that it reads as Linketry—not a generic admin template. Correctness is non-negotiable; visual upgrades sharpen recognition and clarity without inventing a second product personality.

The system stays dense and scannable: slate tonal layers for structure, a single indigo voice for primary action and focus, and soft status tints for state. Motion is short (150ms color transitions) and respects `prefers-reduced-motion`. Light theme inverts the slate ladder and retunes brand steps for contrast rather than introducing a separate look.

**Key Characteristics:**
- Dark console by default; light theme is a contrast invert, not a rebrand
- One accent family (indigo / `brand-*`) for primary action and focus
- Flat tonal surfaces at rest; elevation reserved for overlays and key moments
- System UI sans stack for en/zh-CN parity and predictable metrics
- Refined, restrained controls—upgrade craft, don’t add decorative noise

## Colors

OKLCH Tailwind v4 tokens in `src/index.css` are normative; brand mirrors indigo.

### Primary
- **Operator Indigo** (`brand-600` / oklch(51.1% 0.262 276.966)): primary buttons, skip-link focus, brand glow on login Logo, focus rings. Rarity matters—use it to mark the next correct action, not decoration.
- **Signal Indigo** (`brand-500` / oklch(58.5% 0.233 277.117)): focus rings and lighter brand accents in the dark theme.
- **Deep Indigo** (`brand-700` / oklch(45.7% 0.24 277.023)): primary hover / pressed deepen.

### Neutral
- **Console Void** (`slate-950`): page canvas (`body`, main).
- **Console Panel** (`slate-900`): sidebar, cards, inputs, dialogs.
- **Panel Edge** (`slate-800` / `slate-700`): borders, dividers, secondary fills.
- **Muted Caption** (`slate-400` / `slate-300`): secondary text and labels (shared utilities pin readable muted text across themes).
- **Primary Ink** (`slate-100`): primary text on dark surfaces.

### Status (functional, not brand)
- **Alive Emerald** (emerald-400 family): success, active status.
- **Alert Rose** (red-400 / red-600 fills): errors, danger actions, disabled/failed states.
- **Caution Amber** (yellow/amber): warnings, expired.

Analytics charts may use a wider OKLCH ramp (teal→amber world map; categorical sky/emerald/amber/…)—those are data encodings, not chrome accents.

**The One Voice Rule.** `brand-*` is the only accent for primary chrome. Do not introduce a second brand hue for buttons, nav active states, or focus.

**The Theme Invert Rule.** Light theme redefines the same `slate-*` / `brand-*` variable names—do not fork component class names per theme.

## Typography

**Display Font:** System UI stack (`ui-sans-serif, system-ui, sans-serif` + emoji fallbacks)  
**Body Font:** Same stack  
**Label/Mono Font:** No dedicated product mono; monospace appears only where data demands it (e.g. tokens), via browser `ui-monospace` / utility use—not a brand face

**Character:** Utilitarian and locale-stable. The pinned v3-era stack keeps Latin metrics predictable on Chinese Windows where `system-ui` would otherwise widen.

### Hierarchy
- **Display** (700, 1.5rem / 2rem): login product title (`Linketry Admin`).
- **Headline** (700, 1.125rem / 1.25rem): sidebar product name; page-level emphasis.
- **Title** (600, 1rem / 1.5rem): modal titles, section headers.
- **Body** (400, 0.875rem / 1.25rem): forms, tables, most UI copy.
- **Label** (500, 0.75rem / 1rem): badges, hints, dense metadata.

**The One Face Rule.** Do not add a display serif or marketing font inside Admin; brand recognition comes from indigo, Logo, and craft—not a second type family.

## Layout

Shell: fixed left sidebar (60 / 52 / 20 width for expanded / compact / collapsed) with `border-r border-slate-800`, main canvas `bg-slate-950`, desktop breakpoint `lg` for persistent sidebar vs mobile drawer. Content uses Tailwind spacing rhythm (`gap-2`–`gap-6`, `p-4`–`p-6`); tables honor `data-table-density` compact padding. Prefer scan-friendly rows and toolbars over card sprawl—cards appear when a surface is an interactive unit (login form, settings panels), not as default decoration.

## Elevation & Depth

Depth is mostly **tonal layering** (950 canvas → 900 panels → 800 borders). Shadows are sparse and purposeful.

### Shadow Vocabulary
- **Control kiss** (`shadow-xs` on primary/secondary/danger buttons): tiny resting lift so filled controls don’t feel pasted flat.
- **Overlay lift** (`shadow-xl` / `shadow-2xl` on toasts, login card, modal, mobile sidebar): structural elevation for temporary layers.
- **Brand halo** (`shadow-lg shadow-brand-600/20` on login Logo): rare recognition moment, not a global card style.
- **Scrim** (`bg-black/60` or `bg-slate-950/75` + `backdrop-blur-xs`): modal/drawer separation.

**The Flat-By-Default Rule.** Resting page content stays tonal. Reach for large shadows only on overlays, drawers, and the login mark—not every panel.

## Shapes

Gently rounded console geometry: controls and fields at **8px** (`rounded-lg`), compact controls at **6px** (`rounded-md`), dialogs and login card at **12–16px** (`rounded-xl` / `rounded-2xl`), status chips fully pill (`rounded-full`). Borders are 1px slate edges; badges use inset rings instead of heavy outlines. Logo mark uses matching radius steps (`rounded-lg` → `rounded-2xl` by size).

## Components

### Buttons
- **Shape:** medium soft rectangle (`rounded-lg` default; `rounded-md` on `sm`)
- **Primary:** Operator Indigo fill, white text, `shadow-xs`, hover Deep Indigo
- **Secondary:** slate-700 fill, slate-100 text
- **Ghost:** transparent, slate text, hover slate-800 wash
- **Danger:** red-600 fill for destructive commits
- **Hover / Focus:** 150ms color transition; focus ring `brand-500` with `slate-900` offset
- **Character:** refined and restrained—clear hierarchy, no playful motion

### Chips / Badges
- Soft tinted fills at ~15% opacity + inset ring; pill radius; status mapped (active→emerald, disabled→red, expired→yellow, archived→gray)

### Cards / Containers
- Panel fill `slate-900`, border `slate-800`/`700`, radius up to `rounded-2xl` for hero forms; internal padding typically `p-6`
- Prefer borders + tone over drop shadows at rest

### Inputs / Fields
- `slate-900` fill, `slate-700` border, `rounded-lg`, body text size
- Focus: brand ring, transparent border; error: red border + red ring + `role="alert"` message
- Labels: `text-sm font-medium text-slate-300`

### Navigation
- Dark sidebar panel; BrandMark + bold product name; NavLink rows with hover wash and clear current state
- Mobile: full-height drawer over scrim with focus trap; desktop collapse to icon rail

### Modal / Toast (signature overlays)
- Modal: blurred scrim, `rounded-xl` bordered panel, header rule, Escape + focus trap
- Toast: bottom-end stack, bordered `slate-900` cards, status icon color, auto-dismiss ~4s

## Do's and Don'ts

### Do:
- **Do** keep dark-first Operator Console identity when upgrading UI craft.
- **Do** use Operator Indigo sparingly for primary actions and focus.
- **Do** preserve en/zh-CN, Simple/Advanced modes, and theme-aware Logo assets.
- **Do** verify behavior after visual changes—correctness outranks polish.
- **Do** keep overlays elevated and page content mostly flat/tonal.

### Don't:
- **Don't** introduce a second brand hue or marketing display font in Admin.
- **Don't** wrap every section in shadowed cards “for hierarchy.”
- **Don't** ship UI that looks better but breaks forms, auth, import conflict `skip`, or redirect-adjacent ops.
- **Don't** enable Demo styling or copy patterns that imply a real instance is read-only SaaS.
- **Don't** ignore `prefers-reduced-motion` when adding animation.
