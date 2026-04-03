"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { AddressResult, AddressDetails } from "@/lib/loqate";

interface AddressLookupProps {
  onAddressSelect: (address: AddressDetails) => void;
  placeholder?: string;
  className?: string;
}

interface SearchState {
  query: string;
  results: AddressResult[];
  isLoading: boolean;
  isOpen: boolean;
  selectedIndex: number;
  error: string | null;
}

export const AddressLookup: React.FC<AddressLookupProps> = ({
  onAddressSelect,
  placeholder = "Search for an address...",
  className = "",
}) => {
  const [state, setState] = useState<SearchState>({
    query: "",
    results: [],
    isLoading: false,
    isOpen: false,
    selectedIndex: -1,
    error: null,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setState((prev) => ({ ...prev, isOpen: false, selectedIndex: -1 }));
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Debounced search function
   */
  const performSearch = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setState((prev) => ({
        ...prev,
        results: [],
        isOpen: false,
        error: null,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const response = await fetch(`/api/address/search?q=${encodedQuery}`);

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(
          errorData.error || `Search failed with status ${response.status}`
        );
      }

      const results = (await response.json()) as AddressResult[];

      setState((prev) => ({
        ...prev,
        results,
        isOpen: results.length > 0,
        isLoading: false,
        selectedIndex: -1,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to search addresses";
      setState((prev) => ({
        ...prev,
        error: message,
        results: [],
        isOpen: false,
        isLoading: false,
      }));
    }
  }, []);

  /**
   * Handle input change with debouncing
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newQuery = e.target.value;

    setState((prev) => ({
      ...prev,
      query: newQuery,
    }));

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer (300ms)
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  };

  /**
   * Handle address selection from dropdown
   */
  const handleSelectAddress = async (
    address: AddressResult
  ): Promise<void> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(
        `/api/address/details?id=${encodeURIComponent(address.id)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address details");
      }

      const details = (await response.json()) as AddressDetails;

      setState((prev) => ({
        ...prev,
        query: details.text,
        results: [],
        isOpen: false,
        isLoading: false,
        selectedIndex: -1,
      }));

      onAddressSelect(details);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch address details";
      setState((prev) => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!state.isOpen || state.results.length === 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1),
        }));
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1),
        }));
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (state.selectedIndex >= 0) {
          const selected = state.results[state.selectedIndex];
          if (selected) {
            handleSelectAddress(selected).catch((error) => {
              console.error("Error selecting address:", error);
            });
          }
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        setState((prev) => ({
          ...prev,
          isOpen: false,
          selectedIndex: -1,
        }));
        break;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={state.query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (state.results.length > 0) {
              setState((prev) => ({ ...prev, isOpen: true }));
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          autoComplete="off"
        />
        {state.isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin">
              <svg
                className="w-5 h-5 text-indigo-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {state.error && (
        <div className="mt-2 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {state.isOpen && state.results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
          {state.results.map((address, index) => (
            <li
              key={address.id}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === state.selectedIndex
                  ? "bg-indigo-100"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => {
                handleSelectAddress(address).catch((error) => {
                  console.error("Error selecting address:", error);
                });
              }}
              onMouseEnter={() => {
                setState((prev) => ({ ...prev, selectedIndex: index }));
              }}
              role="option"
              aria-selected={index === state.selectedIndex}
            >
              <div className="font-medium text-gray-900">{address.text}</div>
              {address.description !== address.text && (
                <div className="text-sm text-gray-600">{address.description}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressLookup;
