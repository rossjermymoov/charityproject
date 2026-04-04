"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";

const PRESETS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "This year", value: "ytd" },
  { label: "Custom", value: "custom" },
] as const;

export function DashboardDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRange = searchParams.get("range") || "ytd";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  const [showCustom, setShowCustom] = useState(currentRange === "custom");
  const [fromDate, setFromDate] = useState(currentFrom);
  const [toDate, setToDate] = useState(currentTo);

  const applyPreset = (value: string) => {
    if (value === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const params = new URLSearchParams();
    params.set("range", value);
    router.push(`/?${params.toString()}`);
  };

  const applyCustom = () => {
    if (!fromDate || !toDate) return;
    const params = new URLSearchParams();
    params.set("range", "custom");
    params.set("from", fromDate);
    params.set("to", toDate);
    router.push(`/?${params.toString()}`);
  };

  const activeLabel = PRESETS.find((p) => p.value === currentRange)?.label || "This year";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline">Showing:</span>
      </div>
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => applyPreset(preset.value)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${
                currentRange === preset.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={applyCustom}
            className="px-3 py-1.5 text-xs font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
