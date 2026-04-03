"use client";

import { useState } from "react";
import { Building2, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeadOfficeForm({
  currentAddress,
  lat,
  lng,
}: {
  currentAddress: string | null;
  lat: number | null;
  lng: number | null;
}) {
  const [address, setAddress] = useState(currentAddress || "");
  const [saving, setSaving] = useState(false);
  const [savedLat, setSavedLat] = useState(lat);
  const [savedLng, setSavedLng] = useState(lng);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/settings/head-office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSavedLat(data.lat);
        setSavedLng(data.lng);
        setSuccess(true);
        if (!data.lat) setError("Saved but could not geocode.");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      setError("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">Head Office</h3>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 High Street, London"
          className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <Button type="submit" disabled={saving} size="sm">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
        </Button>
      </div>
      {savedLat && savedLng && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg">
          <MapPin className="h-3 w-3" />
          <span>{savedLat.toFixed(4)}, {savedLng.toFixed(4)}</span>
        </div>
      )}
      {error && (
        <p className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg">{error}</p>
      )}
      {success && !error && (
        <p className="text-xs text-green-600">Saved</p>
      )}
    </form>
  );
}
