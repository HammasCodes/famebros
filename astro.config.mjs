// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// The page ships zero client-side framework code, so the React integration is
// off — leaving it enabled emitted a ~190KB react-dom chunk into dist/ that
// nothing on the page ever loaded. The dependency is still installed: to add an
// interactive island later, restore the two commented lines below.
//
// import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://famebros.studio',

  vite: {
    plugins: [tailwindcss()]
  },

  // integrations: [react()],

  // Fonts are downloaded at build time and served from our own origin.
  // Each family's cssVariable is consumed by @theme in src/styles/global.css.
  // `styles: ['normal']` keeps Google from also shipping italic files we never
  // use — that alone was 33KB of dead weight for JetBrains Mono.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Syne',
      cssVariable: '--font-syne',
      weights: [400, 700, 800],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif']
    },
    {
      provider: fontProviders.google(),
      name: 'Space Grotesk',
      cssVariable: '--font-space-grotesk',
      weights: [300, 400, 500, 700],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif']
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['ui-monospace', 'monospace']
    }
  ]
});
