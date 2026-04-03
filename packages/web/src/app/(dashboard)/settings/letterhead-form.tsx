"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, FileImage } from "lucide-react";

export default function LetterheadForm({ currentImage }: { currentImage: string | null }) {
  const [image, setImage] = useState<string | null>(currentImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/settings/letterhead", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setImage(data.letterheadImage);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await fetch("/api/settings/letterhead", { method: "DELETE" });
      setImage(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
          <FileImage className="h-4 w-4 text-indigo-600" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">Letterhead</h3>
      </div>

      {image ? (
        <div className="space-y-2">
          <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
            <img src={image} alt="Letterhead" className="max-h-14 w-auto mx-auto" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs h-7 px-2">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              Replace
            </Button>
            <Button size="sm" variant="outline" onClick={handleRemove} disabled={uploading}
              className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <X className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
              <p className="text-xs text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="h-5 w-5 text-gray-400" />
              <p className="text-xs text-gray-600 font-medium">Upload letterhead</p>
              <p className="text-xs text-gray-400">PNG, JPEG — max 2MB</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
