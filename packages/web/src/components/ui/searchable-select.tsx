"use client";

import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  name: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** When provided, shows a "+ Create New" button in the dropdown */
  onCreateNew?: () => void;
  createNewLabel?: string;
}

export function SearchableSelect({
  name,
  options,
  defaultValue = "",
  placeholder = "Search...",
  required = false,
  className = "",
  onCreateNew,
  createNewLabel = "Create New",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel =
    options.find((o) => o.value === selectedValue)?.label || "";

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Allow parent to programmatically set value (e.g. after creating a new contact)
  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(value: string) {
    setSelectedValue(value);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedValue("");
    setSearch("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form submission */}
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
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedValue && !required && (
            <span
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 px-1"
            >
              ×
            </span>
          )}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoComplete="off"
            />
          </div>

          {/* Create New button */}
          {onCreateNew && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearch("");
                onCreateNew();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 border-b border-gray-100"
            >
              <Plus className="h-4 w-4" />
              {createNewLabel}
            </button>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {!required && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  selectedValue === "" ? "bg-indigo-50 text-indigo-700" : "text-gray-500"
                }`}
              >
                {placeholder}
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    selectedValue === option.value
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-900"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
