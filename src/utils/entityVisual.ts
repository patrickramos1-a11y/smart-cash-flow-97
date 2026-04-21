// Shared visual helpers for accounts / cost-centers / categories.
// Used across approval, edit-transaction modals, and any other selector
// that needs the same icon+color identity.

// Ensure color is dark enough for readable contrast on white surfaces.
export function ensureDarkColor(hex?: string | null): string {
  if (!hex || !hex.startsWith('#')) return '#6366f1';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.6) {
    const f = 0.5;
    const dr = Math.round(r * f), dg = Math.round(g * f), db = Math.round(b * f);
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
  }
  return hex;
}

// Deterministic 12-tone palette aligned with the visual identity
// (emerald / teal / violet / pink / orange / blue / lime / etc).
export const VISUAL_PALETTE = [
  '#0d9488', '#7c3aed', '#db2777', '#ea580c', '#0284c7', '#65a30d',
  '#9333ea', '#0891b2', '#c2410c', '#15803d', '#be185d', '#4338ca',
];

export function colorFromName(name?: string | null): string {
  if (!name) return VISUAL_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return VISUAL_PALETTE[hash % VISUAL_PALETTE.length];
}
