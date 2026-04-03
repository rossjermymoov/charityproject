import { prisma } from "./prisma";

export interface Branding {
  orgName: string;
  logoUrl: string | null;
  primaryColour: string;
  sidebarColour: string;
  sidebarTextColour: string;
}

const DEFAULTS: Branding = {
  orgName: "DeepCharity",
  logoUrl: null,
  primaryColour: "#4f46e5",
  sidebarColour: "#111827",
  sidebarTextColour: "#d1d5db",
};

/**
 * Load branding from the SystemSettings singleton.
 * Returns sensible defaults if no row exists yet.
 */
export async function loadBranding(): Promise<Branding> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: {
      orgName: true,
      logoUrl: true,
      primaryColour: true,
      sidebarColour: true,
      sidebarTextColour: true,
    },
  });

  if (!settings) return DEFAULTS;

  return {
    orgName: settings.orgName || DEFAULTS.orgName,
    logoUrl: settings.logoUrl || DEFAULTS.logoUrl,
    primaryColour: settings.primaryColour || DEFAULTS.primaryColour,
    sidebarColour: settings.sidebarColour || DEFAULTS.sidebarColour,
    sidebarTextColour: settings.sidebarTextColour || DEFAULTS.sidebarTextColour,
  };
}

/**
 * Convert a hex colour to an RGB string for use in CSS `rgb()`.
 */
export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Lighten or darken a hex colour by a percentage (-100 to +100).
 */
export function adjustColour(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const r = Math.min(255, Math.max(0, parseInt(h.substring(0, 2), 16) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, parseInt(h.substring(2, 4), 16) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, parseInt(h.substring(4, 6), 16) + Math.round(2.55 * percent)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
