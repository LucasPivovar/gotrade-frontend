import { create } from './brand-palette';
import type { Tenant } from './model';
export const brandFonts = [
  'Inter',
  'Sora',
  'Roboto',
  'Montserrat',
  'Poppins',
  'Plus Jakarta Sans',
  'Outfit',
  'Manrope',
  'Open Sans',
  'Lato',
  'Nunito',
];

export function brandThemeVariables(
  brand?: Pick<Tenant, 'color' | 'secondaryColor' | 'font'>,
) {
  const p = create(brand?.color || '#4fbb83', brand?.secondaryColor);
  const font = brandFonts.includes(brand?.font || '') ? brand!.font : 'Inter';
  return {
    '--background': p.background,
    '--foreground': p.text,
    '--card': p.surface,
    '--card-foreground': p.text,
    '--popover': p.surfaceRaised,
    '--popover-foreground': p.text,
    '--primary': p.primary,
    '--primary-foreground': p.onPrimary,
    '--secondary': p.surfaceRaised,
    '--secondary-foreground': p.text,
    '--muted': p.surfaceRaised,
    '--muted-foreground': p.muted,
    '--accent': p.subtle,
    '--accent-foreground': p.accent,
    '--border': p.border,
    '--input': p.border,
    '--ring': p.accent,
    '--sidebar': '#131313',
    '--sidebar-foreground': p.muted,
    '--sidebar-primary': p.primary,
    '--sidebar-primary-foreground': p.onPrimary,
    '--sidebar-accent': p.subtle,
    '--sidebar-accent-foreground': p.accent,
    '--sidebar-border': p.border,
    '--sidebar-ring': p.accent,
    '--brand-accent': p.accent,
    '--brand-complement': p.complement,
    '--brand-secondary': p.secondary,
    '--brand-hover': p.hover,
    '--brand-on-hover': p.onHover,
    '--brand-font': `"${font}", system-ui, sans-serif`,
    '--chart-1': p.accent,
    '--chart-2': p.complement,
    '--chart-3': p.secondary,
  };
}

export function applyBrandTheme(
  brand?: Pick<Tenant, 'color' | 'secondaryColor' | 'font'>,
) {
  Object.entries(brandThemeVariables(brand)).forEach(([key, value]) =>
    document.documentElement.style.setProperty(key, value),
  );
  if (brand?.font && brandFonts.includes(brand.font)) {
    let link = document.getElementById(
      'brand-font-stylesheet',
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = 'brand-font-stylesheet';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(brand.font)}:wght@400;500;600;700;800&display=swap`;
    if (link.getAttribute('href') !== href) link.href = href;
  }
}
