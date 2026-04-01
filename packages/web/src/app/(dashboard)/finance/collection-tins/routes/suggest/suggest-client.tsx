"use client";

import { useState, useTransition } from "react";
import { suggestRoute, createRouteFromSuggestion, type SuggestedRoute } from "./actions";
import { GoogleMap } from "@/components/ui/google-map";
import Link from "next/link";
import {
  ArrowLeft,
  Route,
  Clock,
  MapPin,
  Banknote,
  Zap,
  Sparkles,
} from "lucide-react";

type Volunteer = {
  id: string;
  contact: { firstName: string; lastName: string };
};

export function SuggestRouteClient({
  volunteers,
  locationCount,
  deployedTins,
}: {
  volunteers: Volunteer[];
  locationCount: number;
  deployedTins: number;
}) {
  const [startPostcode, setStartPostcode] = useState("");
  const [maxTins, setMaxTins] = useState(50);
  const [availableHours, setAvailableHours] = useState(4);
  const [suggestion, setSuggestion] = useState<SuggestedRoute | null>(null);
  const [error, setError] = useState("");
  const [routeName, setRouteName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isCreating, startCreating] = useTransition();

  const handleSuggest = () => {
    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("startPostcode", startPostcode);
      formData.set("maxTins", maxTins.toString());
      formData.set("availableHours", availableHours.toString());

      const result = await suggestRoute(formData);
      if (result && result.stops.length > 0) {
        setSuggestion(result);
        setRouteName(
          `Route from ${startPostcode.toUpperCase()} (${result.stops.length} stops)`
        );
      } else {
        setError(
          "Could not generate a route. Check the postcode is valid and that you have geocoded locations with deployed tins."
        );
        setSuggestion(null);
      }
    });
  };

  const handleCreate = () => {
    if (!suggestion) return;
    startCreating(async () => {
      const formData = new FormData();
      formData.set("name", routeName);
      formData.set(
        "description",
        `Auto-suggested from ${suggestion.startPostcode}. ${suggestion.stops.length} stops, ~${suggestion.totalDistanceMiles} miles, ~${Math.round((suggestion.estimatedTimeMinutes / 60) * 10) / 10}hrs`
      );
      formData.set("tinCount", suggestion.stops.length.toString());
      formData.set("scheduledDate", scheduledDate);
      formData.set("assignedToId", assignedToId);
      formData.set(
        "stops",
        JSON.stringify(
          suggestion.stops.map((s) => ({
            locationId: s.locationId,
            parkingNotes: s.parkingNotes,
          }))
        )
      );
      await createRouteFromSuggestion(formData);
    });
  };

  // Build map markers
  const markers = suggestion
    ? [
        // Start point
        {
          id: "start",
          lat: suggestion.startLat,
          lng: suggestion.startLng,
          title: `Start: ${suggestion.startPostcode}`,
          label: "START",
          info: "Starting point",
        },
        // Route stops
        ...suggestion.stops.map((stop) => ({
          id: stop.locationId,
          lat: stop.lat,
          lng: stop.lng,
          title: `#${stop.stopNumber} ${stop.name}`,
          label: stop.type,
          info: [
            stop.address,
            stop.postcode,
            `${stop.distanceFromPrev.toFixed(1)} mi from prev`,
            stop.avgCollected > 0
              ? `Avg: £${stop.avgCollected.toFixed(2)}`
              : null,
            `${stop.daysSinceLastCollection} days since last collection`,
            `${stop.deployedTins} tin${stop.deployedTins !== 1 ? "s" : ""} deployed`,
          ]
            .filter(Boolean)
            .join(" · "),
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/finance/collection-tins/routes">
          <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" />
            Routes
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            Suggest Route
          </h1>
          <p className="text-gray-500 mt-1">
            Enter a starting postcode and we'll build the most efficient route
            based on distance, collection history and time budget
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Geocoded Locations</p>
          <p className="text-2xl font-bold">{locationCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Deployed Tins</p>
          <p className="text-2xl font-bold">{deployedTins}</p>
        </div>
      </div>

      {/* Input form */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Route Parameters
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Postcode
            </label>
            <input
              type="text"
              value={startPostcode}
              onChange={(e) => setStartPostcode(e.target.value)}
              placeholder="e.g. SY11 1NZ"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Tins
            </label>
            <input
              type="number"
              value={maxTins}
              onChange={(e) => setMaxTins(parseInt(e.target.value) || 50)}
              min={1}
              max={200}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              How many tins can you carry?
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available Time (hours)
            </label>
            <input
              type="number"
              value={availableHours}
              onChange={(e) =>
                setAvailableHours(parseFloat(e.target.value) || 4)
              }
              min={0.5}
              max={12}
              step={0.5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Including travel back to base
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSuggest}
            disabled={isPending || !startPostcode.trim()}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 hover:bg-indigo-700"
          >
            <Zap className="h-4 w-4" />
            {isPending ? "Calculating..." : "Suggest Route"}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </div>

      {/* Results */}
      {suggestion && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Stops</span>
              </div>
              <p className="text-2xl font-bold">{suggestion.stops.length}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Route className="h-4 w-4" />
                <span className="text-sm">Distance</span>
              </div>
              <p className="text-2xl font-bold">{suggestion.totalDistanceMiles} mi</p>
              <p className="text-xs text-gray-400">including return</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Est. Time</span>
              </div>
              <p className="text-2xl font-bold">
                {Math.floor(suggestion.estimatedTimeMinutes / 60)}h{" "}
                {suggestion.estimatedTimeMinutes % 60}m
              </p>
              <p className="text-xs text-gray-400">
                5 min per stop + driving
              </p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Banknote className="h-4 w-4" />
                <span className="text-sm">Est. Collection</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                £{suggestion.estimatedTotalCollection.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">based on avg per location</p>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl border p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Route Map
            </h2>
            <GoogleMap markers={markers} height="500px" />
          </div>

          {/* Stop list */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Suggested Stops
            </h2>
            <div className="space-y-2">
              {suggestion.stops.map((stop) => (
                <div
                  key={stop.locationId}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {stop.stopNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{stop.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                        {stop.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {[stop.address, stop.postcode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="text-right text-sm flex-shrink-0 space-y-0.5">
                    <p className="text-gray-500">
                      {stop.distanceFromPrev.toFixed(1)} mi
                    </p>
                    {stop.avgCollected > 0 && (
                      <p className="text-green-600 font-medium">
                        avg £{stop.avgCollected.toFixed(2)}
                      </p>
                    )}
                    <p
                      className={`text-xs ${
                        stop.daysSinceLastCollection > 60
                          ? "text-red-600 font-medium"
                          : stop.daysSinceLastCollection > 30
                            ? "text-orange-600"
                            : "text-gray-400"
                      }`}
                    >
                      {stop.daysSinceLastCollection < 999
                        ? `${stop.daysSinceLastCollection}d ago`
                        : "Never collected"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create route form */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Create This Route
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route Name
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Volunteer
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.contact.firstName} {v.contact.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={isCreating || !routeName.trim()}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 hover:bg-green-700"
            >
              <Route className="h-4 w-4" />
              {isCreating
                ? "Creating..."
                : `Create Route (${suggestion.stops.length} stops)`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
