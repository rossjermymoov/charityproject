"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export function JustGivingSyncButton({
  fundraisingPageId,
}: {
  fundraisingPageId: string;
}) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    synced?: number;
    skipped?: number;
    total?: number;
    error?: string;
  } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);

    try {
      const res = await fetch("/api/justgiving/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundraisingPageId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResult({ success: false, error: data.error });
      } else {
        setResult(data);
        if (data.synced > 0) {
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch {
      setResult({ success: false, error: "Sync failed" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync Donations"}
      </button>

      {result && (
        <div
          className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
            result.success
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {result.success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Synced {result.synced} new donation{result.synced !== 1 ? "s" : ""}
              {result.skipped ? ` (${result.skipped} already imported)` : ""}
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              {result.error}
            </>
          )}
        </div>
      )}
    </div>
  );
}
