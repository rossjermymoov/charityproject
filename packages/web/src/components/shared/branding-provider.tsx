"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface BrandingValues {
  orgName: string;
  logoUrl: string | null;
  primaryColour: string;
  primaryColourHover: string;
  sidebarColour: string;
  sidebarTextColour: string;
}

const BrandingContext = createContext<BrandingValues | null>(null);

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within a BrandingProvider");
  return ctx;
}

/**
 * Wraps children with CSS custom properties for branding.
 * This lets every component in the tree pick up the brand colours
 * via CSS variables without needing to import the context directly.
 */
export function BrandingProvider({
  branding,
  children,
}: {
  branding: BrandingValues;
  children: ReactNode;
}) {
  const cssVars = {
    "--brand-primary": branding.primaryColour,
    "--brand-primary-hover": branding.primaryColourHover,
    "--brand-sidebar": branding.sidebarColour,
    "--brand-sidebar-text": branding.sidebarTextColour,
  } as React.CSSProperties;

  return (
    <BrandingContext.Provider value={branding}>
      <div style={cssVars} className="contents">
        {children}
      </div>
    </BrandingContext.Provider>
  );
}
