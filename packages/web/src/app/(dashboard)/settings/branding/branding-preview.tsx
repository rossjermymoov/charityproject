"use client";

import { useState, useEffect } from "react";

interface Props {
  defaultPrimary: string;
  defaultSidebar: string;
  defaultSidebarText: string;
  logoUrl: string | null;
}

export function BrandingPreview({
  defaultPrimary,
  defaultSidebar,
  defaultSidebarText,
  logoUrl,
}: Props) {
  const [primary, setPrimary] = useState(defaultPrimary);
  const [sidebar, setSidebar] = useState(defaultSidebar);
  const [sidebarText, setSidebarText] = useState(defaultSidebarText);

  // Sync colour pickers ↔ text inputs
  useEffect(() => {
    const form = document.querySelector("form");
    if (!form) return;

    const syncPair = (colorName: string, textName: string, setter: (v: string) => void) => {
      const colorInput = form.querySelector(`[name="${colorName}"]`) as HTMLInputElement;
      const textInput = form.querySelector(`[name="${textName}"]`) as HTMLInputElement;
      if (!colorInput || !textInput) return;

      const onColor = () => {
        textInput.value = colorInput.value;
        setter(colorInput.value);
      };
      const onText = () => {
        const val = textInput.value;
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          colorInput.value = val;
          setter(val);
        }
      };

      colorInput.addEventListener("input", onColor);
      textInput.addEventListener("input", onText);
      return () => {
        colorInput.removeEventListener("input", onColor);
        textInput.removeEventListener("input", onText);
      };
    };

    const cleanups = [
      syncPair("primaryColour", "primaryColourText", setPrimary),
      syncPair("sidebarColour", "sidebarColourText", setSidebar),
      syncPair("sidebarTextColour", "sidebarTextColourText", setSidebarText),
    ];

    return () => cleanups.forEach((fn) => fn?.());
  }, []);

  // Live preview of the logo as the user uploads/changes it
  const [livePreviewLogo, setLivePreviewLogo] = useState<string | null>(logoUrl);
  useEffect(() => {
    const form = document.querySelector("form");
    const hidden = form?.querySelector('[name="logoUrl"]') as HTMLInputElement;
    if (!hidden) return;
    const update = () => setLivePreviewLogo(hidden.value || null);
    // React doesn't fire input events on hidden fields when value prop changes,
    // so poll briefly after mount and on any form mutation
    const observer = new MutationObserver(update);
    observer.observe(hidden, { attributes: true, attributeFilter: ["value"] });
    const interval = setInterval(update, 500);
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex gap-6 items-start">
      {/* Mini sidebar preview */}
      <div
        className="w-56 rounded-xl overflow-hidden shadow-lg flex-shrink-0"
        style={{ backgroundColor: sidebar }}
      >
        {/* Logo area */}
        <div className="px-4 py-4 flex items-center justify-center">
          {livePreviewLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={livePreviewLogo}
              alt="Logo"
              className="h-8 max-w-[160px] object-contain"
            />
          ) : (
            <span className="text-white font-semibold text-sm tracking-tight">Parity CRM</span>
          )}
        </div>

        {/* Nav items */}
        <div className="px-3 pb-3 space-y-0.5">
          {["Dashboard", "Contacts", "Donations", "Events"].map((label, i) => (
            <div
              key={label}
              className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2"
              style={{
                backgroundColor: i === 0 ? `${primary}30` : "transparent",
                color: i === 0 ? "#ffffff" : sidebarText,
              }}
            >
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: i === 0 ? primary : `${sidebarText}60` }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Button previews */}
      <div className="space-y-4 flex-1">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Buttons</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm"
              style={{ backgroundColor: primary }}
            >
              Primary Action
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium border shadow-sm"
              style={{ color: primary, borderColor: primary }}
            >
              Secondary
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Links &amp; Accents</p>
          <div className="flex items-center gap-4 text-sm">
            <span style={{ color: primary }} className="font-medium underline cursor-pointer">Linked text</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${primary}20`,
                color: primary,
              }}
            >
              Badge
            </span>
            <div
              className="h-2 w-24 rounded-full"
              style={{ backgroundColor: `${primary}30` }}
            >
              <div
                className="h-2 w-16 rounded-full"
                style={{ backgroundColor: primary }}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Colour Values</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border" style={{ backgroundColor: primary }} />
              <span className="font-mono text-gray-600">{primary}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border" style={{ backgroundColor: sidebar }} />
              <span className="font-mono text-gray-600">{sidebar}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded border" style={{ backgroundColor: sidebarText }} />
              <span className="font-mono text-gray-600">{sidebarText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
