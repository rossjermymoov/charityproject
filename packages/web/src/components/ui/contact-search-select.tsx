"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Shield } from "lucide-react";

interface ContactResult {
  id: string;
  donorId: number;
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  city: string;
  postcode: string;
  hasGiftAid: boolean;
}

interface ContactSearchSelectProps {
  name: string;
  defaultValue?: string;
  defaultLabel?: string;
  required?: boolean;
  onSelect?: (contact: ContactResult | null) => void;
}

export function ContactSearchSelect({
  name,
  defaultValue = "",
  defaultLabel = "",
  required = false,
  onSelect,
}: ContactSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [narrowFilter, setNarrowFilter] = useState("");
  const [results, setResults] = useState<ContactResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [selectedLabel, setSelectedLabel] = useState(defaultLabel);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const narrowRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setTotalCount(data.totalCount || 0);
      } else {
        setResults(Array.isArray(data) ? data : []);
        setTotalCount(0);
      }
    } catch {
      setResults([]);
      setTotalCount(0);
    }
    setLoading(false);
  }, []);

  // Combine main search + narrow filter into a single query
  const combinedQuery = [search, narrowFilter].filter(Boolean).join(" ");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(combinedQuery), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [combinedQuery, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        setNarrowFilter("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(contact: ContactResult) {
    setSelectedValue(contact.id);
    setSelectedLabel(`${contact.firstName} ${contact.lastName} (#${contact.donorId})`);
    setOpen(false);
    setSearch("");
    setNarrowFilter("");
    onSelect?.(contact);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedValue("");
    setSelectedLabel("");
    onSelect?.(null);
  }

  function padDonorId(id: number): string {
    return String(id).padStart(5, "0");
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedValue} />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className="w-full flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      >
        <span className={selectedLabel ? "text-gray-900" : "text-gray-500"}>
          {selectedLabel || "Search for a contact..."}
        </span>
        <div className="flex items-center gap-1">
          {selectedValue && !required && (
            <span onClick={handleClear} className="text-gray-400 hover:text-gray-600 px-1">
              ×
            </span>
          )}
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[400px]">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setNarrowFilter(""); }}
              placeholder="Type name, donor ID, postcode, or email..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoComplete="off"
            />
            {/* Secondary narrow filter — appears when 10+ results */}
            {!loading && totalCount >= 10 && search.length > 0 && (
              <div className="mt-1.5">
                <div className="text-[11px] text-amber-600 font-medium mb-1">
                  {totalCount} matches found — narrow by postcode, email, or donor ID:
                </div>
                <input
                  ref={narrowRef}
                  type="text"
                  value={narrowFilter}
                  onChange={(e) => setNarrowFilter(e.target.value)}
                  placeholder="e.g. SY10 or jones@email.com"
                  className="w-full px-3 py-1.5 text-sm border border-amber-200 bg-amber-50 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  autoComplete="off"
                />
              </div>
            )}
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">Searching...</div>
            )}
            {!loading && search.length > 0 && results.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No contacts found</div>
            )}
            {!loading && search.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">Start typing to search</div>
            )}
            {!loading && results.length > 0 && totalCount > results.length && (
              <div className="px-4 py-1.5 text-[11px] text-gray-400 text-center border-b border-gray-50">
                Showing {results.length} of {totalCount} results
              </div>
            )}
            {results.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelect(contact)}
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 ${
                  selectedValue === contact.id ? "bg-indigo-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Donor ID badge */}
                  <span className="inline-flex items-center justify-center w-14 text-xs font-mono font-semibold text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 flex-shrink-0">
                    {padDonorId(contact.donorId)}
                  </span>

                  {/* Name and details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </span>
                      {contact.hasGiftAid && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-700 bg-green-50 rounded px-1.5 py-0.5">
                          <Shield className="h-2.5 w-2.5" /> GA
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {[contact.addressLine1, contact.city, contact.postcode]
                        .filter(Boolean)
                        .join(", ") || "No address on file"}
                    </div>
                  </div>

                  {/* Postcode prominent */}
                  {contact.postcode && (
                    <span className="text-xs font-mono font-medium text-gray-600 bg-gray-50 rounded px-1.5 py-0.5 flex-shrink-0">
                      {contact.postcode}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
