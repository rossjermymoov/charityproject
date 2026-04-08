"use client";

import { useState } from "react";

export function RetentionPeriodInput() {
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const totalMonths = years * 12 + months;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Retention Period
      </label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={99}
            value={years}
            onChange={(e) => setYears(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-500">yrs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={11}
            value={months}
            onChange={(e) => setMonths(Math.min(11, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-500">mths</span>
        </div>
      </div>
      <input type="hidden" name="retentionMonths" value={totalMonths} />
      {totalMonths === 0 && (
        <p className="text-xs text-red-500 mt-1">Must be at least 1 month</p>
      )}
    </div>
  );
}
