import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Tin Collections",
  description: "CharityOS Tin Collections",
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-app">
      {children}
      <style>{`
        .mobile-app {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          overscroll-behavior: none;
          min-height: 100dvh;
        }
      `}</style>
    </div>
  );
}
