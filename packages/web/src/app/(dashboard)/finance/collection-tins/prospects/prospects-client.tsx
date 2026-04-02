"use client";

import { useState } from "react";
import { MapPin, Search, Plus, X, AlertTriangle, Loader2, FileText, Key, Check, Download, Building2, Globe, Mail } from "lucide-react";
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

  alreadyExists: boolean;
};

type LetterData = {
  prospectName: string;
  prospectAddress: string;
  category: string;
  letterBody: string;
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
  initialWebsite,
  initialWebsiteSummary,
}: {
  catchment: string[];
  hasApiKey: boolean;
  hasDescription: boolean;
  orgName: string | null;
  charityDescription: string | null;
  categories: string[];
  initialWebsite: string | null;
  initialWebsiteSummary: string | null;
}) {
  // Settings state
  const [catchment, setCatchment] = useState<string[]>(initialCatchment);
  const [newPostcode, setNewPostcode] = useState("");
  const [savingCatchment, setSavingCatchment] = useState(false);

  const [hasApiKey, setHasApiKey] = useState(initialHasApiKey);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingApiKey, setSavingApiKey] = useState(false);

  const [descInput, setDescInput] = useState(charityDescription || "");
  const [savingDesc, setSavingDesc] = useState(false);
  const [descSaved, setDescSaved] = useState(false);

  const [websiteUrl, setWebsiteUrl] = useState(initialWebsite || "");
  const [websiteSummary, setWebsiteSummary] = useState(initialWebsiteSummary || "");
  const [scanningWebsite, setScanningWebsite] = useState(false);
  const [websiteError, setWebsiteError] = useState("");

  // Search state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPostcode, setSelectedPostcode] = useState("");
  const [results, setResults] = useState<ProspectResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Letter state
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [letters, setLetters] = useState<LetterData[]>([]);
  const [generatingLetters, setGeneratingLetters] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewLetter, setPreviewLetter] = useState<LetterData | null>(null);

  // --- Settings handlers ---
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

  const scanWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setScanningWebsite(true);
    setWebsiteError("");
    try {
      const res = await fetch("/api/settings/charity-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setWebsiteError(data.error);
      } else {
        setWebsiteSummary(data.summary);
      }
    } catch (e: any) {
      setWebsiteError(e.message);
    } finally {
      setScanningWebsite(false);
    }
  };

  // --- Search ---
  const handleSearch = async () => {
    if (!selectedCategory || !selectedPostcode) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    setLetters([]);
    setSelectedProspects(new Set());
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
        // Auto-select all new prospects
        const newIds = new Set<string>(
          (data.results || []).filter((r: ProspectResult) => !r.alreadyExists).map((r: ProspectResult) => r.placeId)
        );
        setSelectedProspects(newIds);
      }
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const toggleProspect = (placeId: string) => {
    setSelectedProspects((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedProspects(new Set(newResults.map((r) => r.placeId)));
  };

  const selectNone = () => {
    setSelectedProspects(new Set());
  };

  // --- Letters ---
  const generateLetters = async () => {
    const selected = newResults.filter((r) => selectedProspects.has(r.placeId));
    if (selected.length === 0) return;
    setGeneratingLetters(true);
    try {
      const res = await fetch("/api/prospects/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospects: selected.map((r) => ({
            name: r.name,
            address: r.address,
            category: r.type || selectedCategory,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setLetters(data.letters || []);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGeneratingLetters(false);
    }
  };

  const downloadPdf = async () => {
    if (letters.length === 0) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/prospects/letters/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letters }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prospect-letters-${letters.length}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const newResults = results.filter((r) => !r.alreadyExists);
  const existingResults = results.filter((r) => r.alreadyExists);

  return (
    <div className="space-y-6">
      {/* Setup warning */}
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
            <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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
                <button onClick={() => removePostcode(pc)} className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input type="text" value={newPostcode} onChange={(e) => setNewPostcode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPostcode()} placeholder="e.g. SY11"
            className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <Button size="sm" variant="outline" onClick={addPostcode} disabled={savingCatchment}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </Card>

      {/* Charity Website */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Charity Website</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          We'll scan your website to find key information about your charity — services, impact stats, and mission — then use it to write compelling letters to prospects.
        </p>
        <div className="flex gap-2">
          <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="e.g. www.yourcharity.org.uk"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <Button size="sm" onClick={scanWebsite} disabled={scanningWebsite}>
            {scanningWebsite ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Scanning...</> : "Scan Website"}
          </Button>
        </div>
        {websiteError && (
          <p className="text-sm text-red-600 mt-2">{websiteError}</p>
        )}
        {websiteSummary && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-800 mb-1">Website analysed</p>
            <p className="text-xs text-green-700 whitespace-pre-line">{websiteSummary}</p>
          </div>
        )}
      </Card>

      {/* Charity Description */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">About Your Charity</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          This description is included in the letters sent to prospects. Write a short paragraph about what you do.
        </p>
        <textarea value={descInput} onChange={(e) => setDescInput(e.target.value)} rows={3}
          placeholder="e.g. We are a local charity supporting families in need across Shropshire. Our collection tins help fund community programmes, food banks, and youth services."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
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
            Search for businesses in your catchment area, then generate personalised letters to send them.
          </p>

          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">Choose a category...</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {CATEGORY_NAMES[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Postcode area</label>
              <select value={selectedPostcode} onChange={(e) => setSelectedPostcode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">Choose a postcode...</option>
                {catchment.map((pc) => (
                  <option key={pc} value={pc}>{pc}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleSearch} disabled={!selectedCategory || !selectedPostcode || searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
          </div>

          {searchError && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{searchError}</div>
          )}

          {/* Results with checkboxes */}
          {results.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  {newResults.length} new prospects found
                  {existingResults.length > 0 && ` (${existingResults.length} already have tins)`}
                </p>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Select all</button>
                  <span className="text-xs text-gray-300">|</span>
                  <button onClick={selectNone} className="text-xs text-blue-600 hover:underline">Select none</button>
                </div>
              </div>

              <div className="space-y-2">
                {newResults.map((r) => (
                  <label key={r.placeId} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedProspects.has(r.placeId)
                      ? "bg-green-50 border-green-300"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedProspects.has(r.placeId)}
                      onChange={() => toggleProspect(r.placeId)}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500 truncate">{r.address}</p>
                    </div>

                    <Badge className="bg-green-100 text-green-800 text-xs">New</Badge>
                  </label>
                ))}
                {existingResults.map((r) => (
                  <div key={r.placeId} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-50">
                    <div className="w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500 truncate">{r.address}</p>
                    </div>
                    <Badge className="bg-gray-200 text-gray-600 text-xs">Already exists</Badge>
                  </div>
                ))}
              </div>

              {/* Generate letters button */}
              {selectedProspects.size > 0 && !generatingLetters && (
                <div className="pt-2">
                  <Button onClick={generateLetters}>
                    <Mail className="h-4 w-4 mr-2" /> Generate {selectedProspects.size} Letter{selectedProspects.size > 1 ? "s" : ""}
                  </Button>
                </div>
              )}

              {/* Letter generation loading graphic */}
              {generatingLetters && (
                <Card className="mt-4 p-8 border-indigo-200 bg-indigo-50">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                      <Mail className="h-6 w-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">Generating {selectedProspects.size} personalised letter{selectedProspects.size > 1 ? "s" : ""}...</p>
                      <p className="text-xs text-indigo-600 mt-1">Reviewing your charity details and crafting compelling messages for each prospect</p>
                    </div>
                    <div className="w-full max-w-xs bg-indigo-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: "70%" }} />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Generated letters */}
      {letters.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">{letters.length} Letters Generated</h3>
            </div>
            <Button onClick={downloadPdf} disabled={downloadingPdf}>
              {downloadingPdf ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating PDF...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Download All as PDF</>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {letters.map((letter, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setPreviewLetter(previewLetter?.prospectName === letter.prospectName ? null : letter)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{letter.prospectName}</p>
                    <p className="text-xs text-gray-500">{letter.prospectAddress}</p>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                    {previewLetter?.prospectName === letter.prospectName ? "Hide preview" : "Preview"}
                  </Badge>
                </button>
                {previewLetter?.prospectName === letter.prospectName && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="mt-3 bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-800 leading-relaxed whitespace-pre-line font-serif max-h-96 overflow-y-auto">
                      {letter.letterBody}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
