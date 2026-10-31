# SecureKaro Design System & Frontend Craft Specification (DESIGN.md)

This document establishes the authoritative design guidelines, visual tokens, layout conventions, and component standards for **SecureKaro** (`securekaro.in`). All future UI contributions and automated agent workflows must align with these specifications.

---

## 1. Brand Identity & Design Intent

- **Positioning:** SecureKaro is India's delivery verification and parcel logistics platform. The design must project **trust, precision, institutional security, and effortless speed**.
- **Aesthetic Tone:** Clean financial & logistics dashboard. Modern, restrained, crisp, and tactile. Avoid noisy visual gimmicks, ungrounded heavy gradients, or generic AI slop.
- **Surface Roles:**
  - **Public / Auth:** Confident, reassuring, high-trust. Uses soft blue atmospheric gradients, distinct shield iconography, and crisp white cards.
  - **Seller & Buyer Portals:** High-density, high-legibility workspaces. Clean data tables, status badges, monospaced financials, and unambiguous CTAs.

---

## 2. Color Palette & Token System

### Core Brand Colors
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `brand-primary` | `#1E56E3` | Primary action buttons, active navigation states, primary focus rings |
| `brand-dark` | `#0D38A8` | Gradient anchors, deep header accents |
| `brand-light` | `#EFF6FF` (`blue-50`) | Selected list items, soft info badges, subtle active backgrounds |
| `brand-border` | `#BFDBFE` (`blue-200`) | Focus borders, active selection borders |

### Canvas & Surface Neutrals
| Token | Hex Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| `bg-canvas` | `#F7F9FC` | `bg-[#F7F9FC]` | Primary application background |
| `surface-white`| `#FFFFFF` | `bg-white` | Cards, modals, drawers, input fields |
| `surface-muted`| `#F1F5F9` | `bg-slate-100` | Secondary buttons, disabled inputs, table headers |
| `border-subtle`| `rgba(226,232,240,0.8)` | `border-slate-200/80` | Card borders, horizontal dividers, container outlines |
| `border-strong`| `#CBD5E1` | `border-slate-300` | Input borders, hover borders |

### Semantic System Colors
| Status | Accent Color | Badge Background | Badge Text | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Verified** | Emerald-600 (`#059669`) | `bg-emerald-50` | `text-emerald-800` | Delivered parcels, settled payouts, verified phone/bank |
| **In-Transit / Pending**| Amber-600 (`#D97706`) | `bg-amber-50` | `text-amber-800` | Shipments in transit, OTP timers, pending actions |
| **Danger / Cancelled** | Rose-600 (`#E11D48`) | `bg-rose-50` | `text-rose-700` | Sign out, destructive actions, DPDP account erasure |
| **Informational** | Sky-600 (`#0284C7`) | `bg-sky-50` | `text-sky-800` | Tracking notices, carrier updates, tips |

---

## 3. Typography Architecture

### Typefaces
- **Primary Interface Font:** System Sans / Inter / Plus Jakarta Sans (`font-sans`)
- **Numbers, Codes & Currency:** Monospace (`font-mono font-bold tabular-nums`)
  - Always used for: **Shipment IDs** (`SK-2026-00841`), **Amounts** (`₹1,450`), **OTP codes** (`123456`), and **Phone numbers** (`+91 98765 43210`).

### Scale & Tracking Matrix
- **Page Titles:** `text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight`
- **Section Headers:** `text-sm sm:text-base font-extrabold text-slate-900`
- **Body Text:** `text-xs sm:text-sm text-slate-600 leading-relaxed font-normal`
- **Input Labels:** `text-xs font-semibold text-slate-700 mb-1`
- **Metadata / Micro-badges:** `text-[10px] font-extrabold uppercase tracking-wider`

---

## 4. Spacing, Elevation & Surfaces

### Border-First Depth (Anti-Slop Elevation)
- Never rely on muddy box-shadows alone.
- Pair a hairline border with a soft, diffused shadow:
  ```css
  /* Standard Card Surface */
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 1.5rem; /* rounded-3xl */
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 2px 8px -2px rgba(0, 0, 0, 0.03);
  ```

### Spacing Tokens
- Inner Card Padding: `p-4 sm:p-6 md:p-8`
- Button Padding: `py-2.5 px-4` (Standard CTA), `py-3.5 px-6` (Primary Wizard Submit)
- Input Padding: `px-4 py-2.5` (`text-sm`)

---

## 5. Component Library Standards

### Primary Action Buttons
```jsx
<button
  type="button"
  className="py-3 px-5 bg-[#1E56E3] hover:bg-[#1649CC] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
>
  <span>Action Label</span>
  <ArrowRight className="w-4 h-4" />
</button>
```

### Secondary / Subtle Buttons
```jsx
<button
  type="button"
  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 active:scale-[0.98] transition cursor-pointer"
>
  Cancel
</button>
```

### Destructive Action Buttons (Sign Out / Delete)
```jsx
<button
  type="button"
  className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 active:scale-[0.98] transition flex items-center gap-1.5 cursor-pointer"
>
  <LogOut className="w-3.5 h-3.5" />
  <span>Sign Out</span>
</button>
```

### Form Input Fields
```jsx
<div className="space-y-1">
  <label className="block text-xs font-semibold text-slate-700">Mobile Number *</label>
  <input
    type="tel"
    required
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
    placeholder="+91 98765 43210"
  />
</div>
```

---

## 6. Mobile Viewport & Ergonomics

1. **Fixed 5-Tab Bottom Navigation (`md:hidden`):**
   - Height: `py-1.5 pb-safe` (adapts to iOS home bar).
   - Backdrop blur: `bg-white/95 backdrop-blur-md border-t border-slate-200/80`.
   - Elevated Center Action: `w-12 h-12 -mt-5 rounded-2xl shadow-lg border-2 border-white`.
2. **Sticky Mobile Top Header (`lg:hidden`):**
   - Displays current Portal, Role switcher pill, and Quick Sign Out icon button.
3. **Touch Targets:**
   - All interactive tap targets on mobile must measure at least **44px × 44px**.
4. **Input Zoom Prevention:**
   - Mobile text inputs use `text-base sm:text-xs` so iOS Safari never triggers automatic viewport zoom on focus.

---

## 7. Motion & Micro-Interactions

- **Hover Transitions:** `transition-all duration-150 ease-out`
- **Active Press Feedback:** `active:scale-[0.98]` or `active:scale-95` on icon buttons.
- **Modal Entrances:** `animate-in zoom-in-95 duration-200`
- **Dropdown & Drawer Entrances:** `animate-in slide-in-from-bottom-4 duration-200`
- **Loading State:** `RefreshCw` icon with `animate-spin` or clean white circular spinner.

---

## 8. Compliance & Accessibility Checklist

- [x] All text meets WCAG 2.1 AA 4.5:1 minimum contrast.
- [x] All icons have accompanying labels, tooltips, or accessible text.
- [x] Interactive buttons provide visible keyboard focus rings (`focus-visible:ring-2`).
- [x] Forms support explicit auto-complete and clear validation errors.
- [x] Mobile views are tested across 320px, 375px, 390px, and 414px viewports with zero horizontal overflow.

