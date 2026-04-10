"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

export function LogoUpload({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>(currentLogoUrl || "");

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/branding/logo", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setLogoUrl(data.logoUrl);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function handleRemove() {
    setLogoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Hidden field submitted with the surrounding branding form */}
      <input type="hidden" name="logoUrl" value={logoUrl} />

      <label className="block text-sm font-medium text-gray-700">Logo</label>

      {logoUrl ? (
        <div className="flex items-center gap-4 rounded-lg border border-gray-300 bg-gray-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Current logo"
            className="h-16 w-16 object-contain rounded bg-white border border-gray-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate font-mono">{logoUrl}</p>
            <p className="text-xs text-gray-500">Current logo — click Save Branding to apply</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
        </button>
        <span className="text-xs text-gray-500">SVG, PNG, JPG, or WebP · max 2 MB</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/svg+xml,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleChange}
      />

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Or paste a logo URL
        </label>
        <input
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.svg"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
