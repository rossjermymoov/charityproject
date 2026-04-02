"use client";

import { useState, useCallback } from "react";
import { MapPin, Search, Plus, X, AlertTriangle, Loader2, FileText, Key, Check, Download, Building2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ProspectResult = {
  placeId: string;
  name: string;
  address: string;
  type: string;
  lat: number;
  lng: number;
  rating?: number;
  alreadyExists: boolean;
};

const CATEGORY_NAMES: Record<string, string> = {
  PUB: "Pubs", RESTAURANT: "Restaurants & Cafes", SHOP: "Shops & Retail",
  SCHOOL: "Schools", CHURCH: "Churches", OFFICE: "Offices", OTHER: "Other",
};

const CATEGORY_ICONS: Record<string, string> = {
  PUB: "🍺", RESTAURANT: "🍽️", SHOP: "🛍️",
  SCHOOL: "🎓", CHURCH: "⛪", OFFICE: "🏢", OTHER: "📍",
};

const ALL_CATEGORIES = ["PUB", "RESTAURANT", "SHOP", "SCHOOL", "CHURCH", "OFFICE"];

export default function ProspectsClient({
  catchment: initialCatchment,
  hasApiKey: initialHasApiKey,
  hasDescription,
  orgName,
  charityDescription,
  categories,
}: {
  catchment: string[];
  hasApiKey: boolean;
  hasDescription: boolean;
  orgName: string | null;
  charityDescription: string | null;
  categories: string[];
}) {
  const [catchment, setCatchment] = useState<string[]>(initialCatchment);
  const [newPostcode, setNewPostcode] = useState("");
  const [savingCatchment, setSavingCatchment] = useState(false);

  const [hasApiKey, setHasApiKey] = useState(initialHasApiKey);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingApiKey, setSavingApiKey] = useState(false);

  const [descInput, setDescInput] = useState(charityDescription || "");
  const [savingDesc, setSavingDesc] = useState(false);
  const [descSaved, setDescSaved] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPostcode, setSelectedPostcode] = useState("");
  const [results, setResults] = useState<ProspectResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  // Catchment management
  const addPostcode = async () => {
    const pc = newPostcode.trim().toUpperCase();
    if (!pc || catchment.includes(pc)) return;
    const updated = [...catchment, pc];
    setSavingCatchment(true);
    await fetch("/api/settings/catchment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postcodes: updated }),
    });
    setCatchment(updated);
    setNewPostcode("");
    setSavingCatchment(false);
  };

  const removePostcode = async (pc: string) => {
    const updated = catchment.filter((p) => p !== pc);
    await fetch("/api/settings/catchment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postcodes: updated }),
    });
    setCatchment(updated);
  };

  // Save API key
  const saveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingApiKey(true);
    await fetch("/api/settings/google-places-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
    });
    setHasApiKey(true);
    setSavingApiKey(false);
  };

  // Save description
  const saveDescription = async () => {
    setSavingDesc(true);
    await fetch("/api/settings/charity-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: descInput }),
    });
    setSavingDesc(false);
    setDescSaved(true);
    setTimeout(() => setDescSaved(false), 3000);
  };

  // Search
  const handleSearch = async () => {
    if (!selectedCategory || !selectedPostcode) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    try {
      const res = await fetch("/api/prospects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: selectedCategory, postcode: selectedPostcode }),
      });
      const data = await res.json();
      if (data.error) {
        setSearchError(data.error);
      } else {
        setResults(data.results || []);
      }
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  };

  // Download infographic PDF
  const downloadInfographic = async (category: string) => {
    setGeneratingPdf(category);
    try {
      const res = await fetch(`/api/prospects/infographic/pdf?category=${category}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${CATEGORY_NAMES[category]?.replace(/\s+/g, "-") || category}-infographic.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setGeneratingPdf(null);
    }
  };

  const newResults = results.filter((r) => !r.alreadyExists);
  const existingResults = results.filter((r) => r.alreadyExists);

  return (
    <div className="space-y-6">
      {/* Setup section - show if missing config */}
      {(!hasApiKey || catchment.length === 0) && (
        <Card className="p-6 border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-800">Setup Required</h3>
              <p className="text-sm text-amber-700 mt-1">
                {!hasApiKey && "Add your Google Places API key below. "}
                {catchment.length === 0 && "Add your catchment area postcodes to get started."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Google Places API Key */}
      {!hasApiKey && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Key className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Google Places API Key</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Required to search for businesses. Get one from the Google Cloud Console under Places API.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <Button size="sm" onClick={saveApiKey} disabled={savingApiKey}>
              {savingApiKey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Key"}
            </Button>
          </div>
        </Card>
      )}

      {hasApiKey && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <Check className="h-4 w-4" /> Google Places API key configured
        </div>
      )}

      {/* Catchment Area */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Catchment Area</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Add postcode prefixes to define your operating area. E.g. "SY10", "SY11", or more specific like "SY10 1".
        </p>

        {catchment.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {catchment.map((pc) => (
              <Badge key={pc} className="bg-blue-100 text-blue-800 pl-2.5 pr-1 py-1.5 text-sm flex items-center gap-1">
                {pc}
                <button
                  onClick={() => removePostcode(pc)}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newPostcode}
            onChange={(e) => setNewPostcode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPostcode()}
            placeholder="e.g. SY11"
            className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <Button size="sm" variant="outline" onClick={addPostcode} disabled={savingCatchment}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </Card>

      {/* Charity Description */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">About Your Charity</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          This description appears on infographics you send to prospective businesses.
        </p>
        <textarea
          value={descInput}
          onChange={(e) => setDescInput(e.target.value)}
          rows={3}
          placeholder="e.g. We are a local charity supporting families in need across Shropshire. Our collection tins help fund community programmes, food banks, and youth services."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
        />
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" onClick={saveDescription} disabled={savingDesc}>
            {savingDesc ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Description"}
          </Button>
          {descSaved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </Card>

      {/* Search for prospects */}
      {hasApiKey && catchment.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Search className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Find New Prospects</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Search for businesses in your catchment area that don't yet have a collection tin.
          </p>

          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Choose a category...</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_ICONS[cat]} {CATEGORY_NAMES[cat]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Postcode area</label>
              <select
                value={selectedPostcode}
                onChange={(e) => setSelectedPostcode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Choose a postcode...</option>
                {catchment.map((pc) => (
                  <option key={pc} value={pc}>{pc}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleSearch}
              disabled={!selectedCategory || !selectedPostcode || searching}
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>

          {searchError && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {searchError}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  {newResults.length} new prospects found
                  {existingResults.length > 0 && ` (${existingResults.length} already have tins)`}
                </p>
              </div>

              <div className="space-y-2">
                {newResults.map((r) => (
                  <div key={r.placeId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.address}</p>
                      {r.rating && (
                        <p className="text-xs text-yellow-600 mt-0.5">★ {r.rating}</p>
                      )}
                    </div>
                    <Badge className="bg-green-100 text-green-800">New prospect</Badge>
                  </div>
                ))}
                {existingResults.map((r) => (
                  <div key={r.placeId} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.address}</p>
                    </div>
                    <Badge className="bg-gray-200 text-gray-600">Already exists</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Infographic generation */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Generate Infographics</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Create a branded PDF one-pager for each business category showing collection stats,
          how partnership works, and your charity's impact. Send these to prospective businesses.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => downloadInfographic(cat)}
              disabled={generatingPdf === cat}
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                <span className="text-sm font-semibold text-gray-900">{CATEGORY_NAMES[cat]}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-indigo-600 mt-2">
                {generatingPdf === cat ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="h-3 w-3" /> Download PDF</>
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
