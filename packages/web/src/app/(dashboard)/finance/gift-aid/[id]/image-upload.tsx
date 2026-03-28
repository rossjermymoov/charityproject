"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  giftAidId: string;
  currentImageUrl: string | null;
}

export function ImageUpload({ giftAidId, currentImageUrl }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG, WebP, and PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("giftAidId", giftAidId);

      const res = await fetch("/api/gift-aid/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setImageUrl(data.imageUrl);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <div className="relative">
          {imageUrl.endsWith(".pdf") ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-red-600">PDF</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Declaration document uploaded</p>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  View document
                </a>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Gift Aid declaration"
                className="rounded-lg border border-gray-200 max-h-64 object-contain w-full bg-gray-50"
              />
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
              >
                View full size
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No declaration image uploaded</p>
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 font-medium">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : imageUrl ? "Replace image" : "Upload declaration image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      <p className="text-xs text-gray-500">
        JPEG, PNG, WebP or PDF, max 5MB. Upload a photo or scan of the signed paper declaration.
      </p>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
