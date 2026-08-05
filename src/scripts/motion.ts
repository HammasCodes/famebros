import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Runs `fn` only for users who have not requested reduced motion, and tears the
 * animations back down if that preference changes mid-session.
 *
 * Every animation in this project is written as a `gsap.from()`, so the page is
 * fully visible in its final state before any of this executes. Skipping the
 * callback entirely is therefore a complete, correct rendering — not a
 * degraded one. That also covers the no-JS and crawler cases for free.
 */
export function onMotionAllowed(fn: () => void | (() => void)) {
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', fn);
}

export { gsap, ScrollTrigger };
