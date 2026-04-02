"use client";

import { useState, useTransition } from "react";
import { previewGenerateRoutes, createGeneratedRoutes, type GeneratePreview } from "./actions";
import { Sparkles, MapPin, Clock, Route, Check, AlertTriangle, Loader2 } from "lucide-react";

export default function GenerateClient({
  locationCount,
  tinCount,
}: {
  locationCount: number;
  tinCount: number;
}) {
  const [numRoutes, setNumRoutes] = useState(5);
  const [preview, setPreview] = useState<GeneratePreview | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreating, startCreating] = useTransition();
  const [created, setCreated] = useState(false);

  function handlePreview() {
    const formData = new FormData();
    formData.set("numRoutes", numRoutes.toString());
    startTransition(async () => {
      const result = await previewGenerateRoutes(formData);
      setPreview(result);
    });
  }

  function handleCreate() {
    if (!preview) return;
    const formData = new FormData();
    formData.set("routes", JSON.stringify(preview.routes));
    startCreating(async () => {
      await createGeneratedRoutes(formData);
      setCreated(true);
    });
  }

  function formatTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">How many routes do you need?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Think about how many volunteers typically go out collecting. We'll split your{" "}
          <strong>{locationCount} locations</strong> into that many geographically balanced routes,
          each with roughly similar collection times.
        </p>

        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of routes (volunteers)
            </label>
            <input
              type="number"
              min={1}
              max={Math.min(locationCount, 50)}
              value={numRoutes}
              onChange={(e) => setNumRoutes(parseInt(e.target.value) || 1)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              ~{Math.round(locationCount / numRoutes)} stops per route
            </p>
          </div>

          <button
            onClick={handlePreview}
            disabled={isPending || numRoutes < 1}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Preview Routes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview results */}
      {preview && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-sm text-indigo-600 font-medium">Routes Generated</p>
              <p className="text-3xl font-bold text-indigo-900">{preview.routes.length}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium">Total Locations</p>
              <p className="text-3xl font-bold text-green-900">{preview.totalLocations}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Avg Stops/Route</p>
              <p className="text-3xl font-bold text-blue-900">{preview.avgStopsPerRoute}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm text-amber-600 font-medium">Avg Time/Route</p>
              <p className="text-3xl font-bold text-amber-900">{formatTime(preview.avgTimeMinutes)}</p>
            </div>
          </div>

          {/* Route cards */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Routes</h2>
            <div className="space-y-3">
              {preview.routes.map((route, idx) => {
                const timeVariance = preview.avgTimeMinutes > 0
                  ? Math.round(((route.estimatedMinutes - preview.avgTimeMinutes) / preview.avgTimeMinutes) * 100)
                  : 0;
                const isLong = timeVariance > 20;
                const isShort = timeVariance < -20;

                return (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                            {idx + 1}
                          </div>
                          <h3 className="font-semibold text-gray-900">{route.name}</h3>
                          {isLong && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="h-3 w-3" /> +{timeVariance}% above avg
                            </span>
                          )}
                          {isShort && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <Check className="h-3 w-3" /> {timeVariance}% below avg
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-5 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {route.stops.length} stops
                          </span>
                          <span className="flex items-center gap-1">
                            <Route className="h-3.5 w-3.5" />
                            {route.totalMiles} miles
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            ~{formatTime(route.estimatedMinutes)}
                          </span>
                          <span className="text-gray-400">
                            {route.tinCount} tins
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stop preview (collapsed) */}
                    <details className="mt-3">
                      <summary className="text-xs text-indigo-600 cursor-pointer font-medium hover:text-indigo-700">
                        View stops
                      </summary>
                      <div className="mt-2 pl-4 border-l-2 border-gray-100 space-y-1">
                        {route.stops.map((stop, si) => (
                          <div key={si} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-mono w-5 text-right">{si + 1}.</span>
                            {stop.name}
                            {stop.tinCount > 1 && (
                              <span className="text-xs text-gray-400">({stop.tinCount} tins)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create button */}
          <div className="bg-white border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Happy with these routes? Create them all as predefined routes that you can then assign to volunteers and schedule runs for.
            </p>
            <button
              onClick={handleCreate}
              disabled={isCreating || created}
              className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating {preview.routes.length} routes...
                </>
              ) : created ? (
                <>
                  <Check className="h-5 w-5" />
                  Routes Created!
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Create {preview.routes.length} Routes
                </>
              )}
            </button>
            <p className="text-xs text-amber-600 mt-2 font-medium">
              This will replace all existing routes. Each location can only appear on one route.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
