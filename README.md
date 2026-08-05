# Fame Bros Studio — Neubrutalist Marketing Site

Single-page marketing site for a Mumbai social media agency. Astro 7, Tailwind CSS v4,
GSAP ScrollTrigger, Lenis smooth scroll. Static output, no framework runtime on the page.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # → dist/
npm run preview   # serve dist/ — always benchmark against this, never dev
```

> The **first** build needs network access: `astro:fonts` downloads Syne, Space Grotesk
> and JetBrains Mono from Google and caches them. Subsequent builds work offline.

---

## Read this before showing it to anyone

Three things in here are demo scaffolding, not real:

1. **The booking form does not send anything.** `src/components/sections/Contact.astro`
   intercepts submit and swaps in the success panel. Nothing is transmitted, stored, or
   emailed. The exact line to replace is marked in the script block. Until you wire an
   endpoint, do not let a prospect fill it in — they will believe they contacted you.
2. **The portfolio is invented.** Client names, categories and result figures in
   `src/components/sections/Portfolio.astro` are fictional, and the images in
   `src/assets/portfolio/` are stock placeholders from picsum.photos. Replace both before
   presenting this as case-study work.
3. **Contact details are placeholders.** Email, phone, WhatsApp and social URLs live in
   `src/data/site.ts`. Currently they point nowhere real.

---

## Design system

All tokens live in one `@theme` block in `src/styles/global.css`.

### Colour

| Token | Value | Use |
|---|---|---|
| `neo-black` | `#0F0F0F` | Text, every border, dark surfaces |
| `neo-offwhite` | `#FFFDF5` | Page base, text on dark |
| `neo-yellow` | `#FFDE59` | Primary CTA |
| `neo-green` | `#7ED957` | About, success |
| `neo-blue` | `#5CE1E6` | Gradient start, stats |
| `neo-purple` | `#C678DD` | Portfolio, FAQ, booking band |
| `neo-pink` | `#FF66C4` | Services accent, confetti |
| `neo-red` | `#C4262E` | Form validation only — added because none of the five brand accents can mean "error" without being confused for decoration |

**The one colour rule:** black text on brights, off-white text on black, and never a
bright colour as text on a light background. `neo-blue` on `neo-offwhite` measures
**1.4:1** and fails WCAG AA outright. On `neo-black` the same colour is **14.8:1**.

That is why the hero headline sits on a black poster panel rather than on the page base —
it is the only placement where a blue→purple gradient headline is legible. Black-on-fill
ratios for the rest: yellow 14.5, blue 14.8, green 13.2, pink 9.0, purple 7.8. All pass.

### Type

Loaded through `astro:fonts` (`astro.config.mjs`), downloaded at build and served from
`/_astro/fonts/`. There is no request to `fonts.googleapis.com` or `fonts.gstatic.com`.

| Utility | Family | Use |
|---|---|---|
| `font-display` | Syne 400/700/800 | Headings, figures |
| `font-sans` | Space Grotesk 300–700 | Body — also the document default |
| `font-mono` | JetBrains Mono 400/700 | Labels, tags, chips, eyebrows |

Fluid sizes: `text-hero`, `text-section`, `text-stat`.

### Surfaces

- **Borders** are 2px, 3px or 4px, never 1px. Tailwind v4 runs bare integers through its
  border-width handler, so `border-3` compiles to `3px` even though it is not in
  autocomplete. **Always pair a width with `border-neo-black`** — v4's default border
  colour is `currentColor`, so an unqualified border silently inherits text colour.
- **Shadows** are hard-edged with zero blur: `shadow-neo-sm` (3px), `shadow-neo` (5px),
  `shadow-neo-lg` (8px), plus `shadow-neo-dark` / `shadow-neo-dark-sm` for dark surfaces.
- **Radii**: `rounded-neo-sm` (0.25rem, buttons and chips), `rounded-neo` (0.75rem, cards
  and panels), `rounded-full` (pills and avatars).

### The physical press

`neo-press` is the single custom utility, and it carries the whole interaction contract:
lift 4px on hover, press 4px down and drop the shadow on active, 150ms on
`cubic-bezier(0.4, 0, 0.2, 1)`.

Two refinements over repeating the classes inline on ~25 elements:

- It transitions `transform` and `box-shadow` only, not `all`. Same feel, and no
  accidental transitions on border colour or layout properties.
- Hover is gated behind `@media (hover: hover)` so a tap on a phone does not leave the
  element stuck in its lifted state.

---

## Architecture

```
src/
├─ styles/global.css          tokens, neo-press, neo-container, Lenis CSS, base layer
├─ scripts/motion.ts          registers ScrollTrigger, exports onMotionAllowed()
├─ layouts/Layout.astro       head, SEO, fonts, skip link
├─ data/site.ts               contact + socials (shared across components)
├─ components/
│  ├─ SmoothScroll.astro      Lenis ⇄ GSAP ticker
│  ├─ ScrollReveal.astro      page-wide reveal driver
│  ├─ NeoButton / NeoTag / SectionHeading / Marquee
│  ├─ Navbar / Footer
│  └─ sections/               Hero About Services Portfolio Stats Faq Contact
└─ pages/index.astro
```

`@astrojs/react` is installed but **switched off** in `astro.config.mjs`. Nothing on the
page needs hydration, and leaving it on emitted a ~190KB react-dom chunk into `dist/` that
was never loaded. Two commented lines restore it when you want a real island.

### Adding a section

1. Create it in `src/components/sections/`, render it from `index.astro`.
2. Put `data-reveal` on a container for a sequential child reveal, or `data-reveal-grid`
   for a grid wave. `ScrollReveal.astro` picks it up — no per-section GSAP code.
3. Give the `<section>` an `id` and `scroll-mt-24` so anchor links clear the sticky header.

### Motion

Lenis runs off GSAP's ticker, so one `requestAnimationFrame` loop drives the page and
ScrollTrigger always reads the smoothed scroll position:

```js
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

**Every animation is a `gsap.from()`.** Nothing is hidden in CSS. The un-animated page is
the finished page, which means reduced-motion users, no-JS visitors and crawlers all get
complete content rather than a blank screen. GSAP work is wrapped in `onMotionAllowed()`
(`gsap.matchMedia` on `prefers-reduced-motion: no-preference`); Lenis disables its own
smoothing via `respectReducedMotion`.

No pinning and no parallax anywhere — both force reflow and degrade on mid-tier mobile.

The hero headline is split into lines **in the markup**, not by a runtime text splitter.
The gradient sits on the same element GSAP transforms; putting `background-clip: text` on
an *ancestor* of a transformed node is what makes gradient headlines flicker out.

---

## Performance notes

- Zero hydration. Total JS is GSAP + ScrollTrigger + Lenis in one shared chunk, plus three
  script tags under 0.5KB each. All deferred.
- Tailwind's source detection is scoped to `src/` via `source(none)` + `@source`. Left on
  automatic it scanned `.claude/`, `.agents/` and `.kilocode/` — skill data files full of
  example class names — and compiled ~10KB of utilities the page never uses.
- Images go through `<Picture>` as AVIF + WebP with a JPG fallback, explicit dimensions,
  and `loading="lazy"` throughout since the portfolio is the fourth section down.
- Only Syne and Space Grotesk are preloaded. Both arrive as single variable files, so
  `preload` emits one `<link>` each rather than one per weight. JetBrains Mono is left to
  `font-display: swap` — a third preload would compete with the LCP for bandwidth.
- The sticky header is opaque, not `backdrop-blur`. A full-width backdrop filter repaints
  everything behind it on every frame of a smooth scroll.

## Verifying a change

```bash
npm run build && npm run preview
```

- No external origins: `grep -oE 'https?://[a-z.]+' dist/index.html` should return only
  `famebros.studio` and the social links.
- Fonts self-hosted: `dist/_astro/fonts/` contains `.woff2`.
- No framework runtime: no `client.*.js` in `dist/_astro/`.
- Tab the page end to end — focus visible at every stop, `<details>` operable by keyboard.
- Toggle OS reduced motion and reload — page fully legible, nothing moves.
- Check 375 / 768 / 1024 / 1440.

`astro check` is not wired up: `@astrojs/check` and `typescript` are not installed, and
`astro build` does **not** type-check `.astro` frontmatter (esbuild strips types). Add both
as devDependencies if you want a real type gate.
