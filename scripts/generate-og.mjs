/**
 * Generates public/og.png — the 1200x630 card social platforms show when the
 * site is shared.
 *
 *   node scripts/generate-og.mjs
 *
 * Run this whenever the headline, palette, or wordmark changes. The output is
 * committed, so builds and deploys never depend on this script.
 *
 * Fonts are the real constraint. Sharp renders SVG through librsvg, which
 * resolves font families against *system* fonts — Syne is not installed on a
 * build machine, so SVG <text> silently falls back to a default face. Sharp's
 * own text input accepts `fontfile`, which registers a specific file with
 * Pango. That is why every text run below is rendered as its own layer and
 * composited, rather than written into one SVG.
 *
 * The family strings must match the TTF name table, not the filename. Pango
 * parses trailing style keywords, so "Syne ExtraBold" resolves to family Syne
 * at weight ExtraBold. Getting these wrong does not error — it falls back to a
 * default font and looks wrong, so the script prints what it measured.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const FONTS = {
  display: {
    file: join(here, 'og-fonts', 'Syne-ExtraBold.ttf'),
    family: 'Syne ExtraBold',
  },
  body: {
    file: join(here, 'og-fonts', 'SpaceGrotesk-Medium.ttf'),
    family: 'Space Grotesk Medium',
  },
  label: {
    file: join(here, 'og-fonts', 'SpaceGrotesk-Bold.ttf'),
    family: 'Space Grotesk Bold',
  },
};

const W = 1200;
const H = 630;

const C = {
  black: '#0F0F0F',
  offwhite: '#FFFDF5',
  yellow: '#FFDE59',
  blue: '#5CE1E6',
  purple: '#C678DD',
};

const PANEL = { x: 48, y: 44, w: 1104, h: 542, r: 20 };
const OFFSET = 14; // hard shadow displacement, matching --shadow-neo-lg
const PAD = 72;
const contentX = PANEL.x + PAD;
const contentW = PANEL.w - PAD * 2;

const warnings = [];

/** Renders one text run to an RGBA buffer, returning it with its real size. */
async function text(content, { font, size, color, spacing = 0, lineHeight }) {
  const attrs = [`foreground="${color}"`];
  // Pango letter_spacing is in Pango units (1024 per point).
  if (spacing) attrs.push(`letter_spacing="${Math.round(spacing * size * 1024)}"`);
  if (lineHeight) attrs.push(`line_height="${lineHeight}"`);

  const buffer = await sharp({
    text: {
      text: `<span ${attrs.join(' ')}>${content}</span>`,
      font: `${font.family} ${size}`,
      fontfile: font.file,
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer();

  const { width, height } = await sharp(buffer).metadata();
  if (width > contentW) {
    warnings.push(`"${content.split('\n')[0]}" is ${width}px wide, panel allows ${contentW}px`);
  }
  return { buffer, width, height };
}

/**
 * Text filled with a left-to-right gradient. Pango cannot fill glyphs with a
 * gradient, so the run is rendered white and used as an alpha mask over one via
 * `dest-in`. Rendering both headline lines as a single run keeps the gradient
 * continuous across the block and lets Pango own the leading.
 */
async function gradientText(content, opts) {
  const mask = await text(content, { ...opts, color: '#FFFFFF' });

  const gradient = Buffer.from(
    `<svg width="${mask.width}" height="${mask.height}" xmlns="http://www.w3.org/2000/svg">
       <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="${opts.from}"/><stop offset="1" stop-color="${opts.to}"/>
       </linearGradient></defs>
       <rect width="100%" height="100%" fill="url(#g)"/>
     </svg>`,
  );

  const buffer = await sharp(gradient)
    .composite([{ input: mask.buffer, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return { buffer, width: mask.width, height: mask.height };
}

const backdrop = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
         <circle cx="2" cy="2" r="1.6" fill="${C.black}" opacity="0.10"/>
       </pattern>
     </defs>
     <rect width="${W}" height="${H}" fill="${C.offwhite}"/>
     <rect width="${W}" height="${H}" fill="url(#dots)"/>
     <rect x="${PANEL.x + OFFSET}" y="${PANEL.y + OFFSET}" width="${PANEL.w}"
           height="${PANEL.h}" rx="${PANEL.r}" fill="${C.yellow}"
           stroke="${C.black}" stroke-width="4"/>
     <rect x="${PANEL.x}" y="${PANEL.y}" width="${PANEL.w}" height="${PANEL.h}"
           rx="${PANEL.r}" fill="${C.black}" stroke="${C.black}" stroke-width="4"/>
   </svg>`,
);

const pill = (w, h, fill) =>
  Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
       <rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${(h - 3) / 2}"
             fill="${fill}" stroke="${C.black}" stroke-width="3"/>
     </svg>`,
  );

const badge = await text('MUMBAI · SOCIAL MEDIA STUDIO', {
  font: FONTS.label,
  size: 20,
  color: C.black,
  spacing: 0.08,
});

// Three lines, matching the page. Syne ExtraBold is an extended face — roughly
// 0.9em per uppercase character — so "WE MAKE BRANDS" on one line measures
// 1712px at 108pt against the 960px the panel allows. The longest line here is
// "GO VIRAL." at ~744px.
const headline = await gradientText('WE MAKE\nBRANDS\nGO VIRAL.', {
  font: FONTS.display,
  size: 92,
  from: C.blue,
  to: C.purple,
  lineHeight: 0.94,
});

const sub = await text(
  'Social Media Marketing &amp; Content Creation that actually slaps.',
  { font: FONTS.body, size: 28, color: '#CFCCC3' },
);

const kicker = await text('REELS · BRAND SHOOTS · PAID ADS · STRATEGY', {
  font: FONTS.label,
  size: 19,
  color: '#8C897F',
  spacing: 0.14,
});

// Stack with explicit gaps, then centre the whole block in the panel so the
// composition never ends up top-heavy when copy length changes.
const badgeH = badge.height + 22;
const badgeW = badge.width + 44;

const stack = [
  { h: badgeH, gap: 40, draw: (top) => [
      { input: pill(badgeW, badgeH, C.yellow), left: contentX, top },
      { input: badge.buffer, left: contentX + 22, top: top + 11 },
    ] },
  { h: headline.height, gap: 32, draw: (top) => [
      { input: headline.buffer, left: contentX, top },
    ] },
  { h: sub.height, gap: 24, draw: (top) => [
      { input: sub.buffer, left: contentX, top },
    ] },
  { h: kicker.height, gap: 0, draw: (top) => [
      { input: kicker.buffer, left: contentX, top },
    ] },
];

const total = stack.reduce((sum, s) => sum + s.h + s.gap, 0);
let y = Math.round(PANEL.y + (PANEL.h - total) / 2);

const layers = [];
for (const item of stack) {
  layers.push(...item.draw(y));
  y += item.h + item.gap;
}

await sharp(backdrop)
  .composite(layers)
  .png({ compressionLevel: 9 })
  .toFile(join(here, '..', 'public', 'og.png'));

console.log(`og.png written — ${W}x${H}`);
console.log(`  headline  ${headline.width}x${headline.height}px  (max width ${contentW}px)`);
console.log(`  sub       ${sub.width}x${sub.height}px`);
console.log(`  block     ${total}px tall (panel inner ${PANEL.h - PAD * 2}px)`);
if (total > PANEL.h - 40) warnings.push(`content block ${total}px exceeds panel height`);
for (const w of warnings) console.warn(`  WARNING: ${w}`);
if (!warnings.length) console.log('  no overflow');
