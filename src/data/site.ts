/**
 * Details referenced from more than one component. Section-specific copy lives
 * inside its own section component — only genuinely shared values belong here.
 *
 * PLACEHOLDER DATA: contact details below are stand-ins for the demo. Replace
 * before this is deployed anywhere a real visitor can reach it.
 */

export const CONTACT = {
  email: 'hello@famebros.studio',
  phone: '+91 98200 00000',
  whatsappUrl: 'https://wa.me/919820000000',
  location: 'Mumbai, India',
} as const;

/** Lucide icon paths, inlined — no icon font, no runtime request, no emoji. */
export const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    icon: '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  },
] as const;
