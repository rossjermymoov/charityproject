"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4">
        <div className="inline-flex h-16 w-16 rounded-full bg-red-100 items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-500 max-w-md">
          {error.message || "An unexpected error occurred loading this page."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Try again
          </button>
          <a
            href="/crm/contacts"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
          >
            Go to Contacts
          </a>
        </div>
      </div>
    </div>
  );
}
