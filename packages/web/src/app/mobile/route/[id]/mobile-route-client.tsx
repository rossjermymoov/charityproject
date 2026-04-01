"use client";

import { useState, useEffect } from "react";
import { completeStop, skipStop } from "@/app/(dashboard)/finance/collection-tins/routes/actions";

type Stop = {
  id: string;
  sortOrder: number;
  status: string;
  parkingNotes: string | null;
  accessNotes: string | null;
  skipReason: string | null;
  deployedTinId: string | null;
  collectedTinId: string | null;
  completedAt: string | null;
  location: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    postcode: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  deployedTin: { tinNumber: string } | null;
  collectedTin: { tinNumber: string } | null;
};

type Route = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  tinCount: number;
  stops: Stop[];
  assignedTo: { contact: { firstName: string; lastName: string } } | null;
};

type Tin = {
  id: string;
  tinNumber: string;
};

export function MobileRouteClient({
  route,
  availableTins,
}: {
  route: Route;
  availableTins: Tin[];
}) {
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [deployedTinNumber, setDeployedTinNumber] = useState("");
  const [collectedTinNumber, setCollectedTinNumber] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [showSkip, setShowSkip] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Find first pending stop on mount
  useEffect(() => {
    const firstPending = route.stops.findIndex((s) => s.status === "PENDING");
    if (firstPending >= 0) setCurrentStopIndex(firstPending);
  }, [route.stops]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Get GPS position
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (pos) =>
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const pendingStops = route.stops.filter((s) => s.status === "PENDING");
  const completedStops = route.stops.filter((s) => s.status === "COMPLETED");
  const currentStop = route.stops[currentStopIndex];

  if (!currentStop || pendingStops.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="bg-green-50 rounded-2xl p-8 mt-8">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-900">Route Complete!</h1>
          <p className="text-green-700 mt-2">{route.name}</p>
          <p className="text-green-600 mt-1">
            {completedStops.length} of {route.stops.length} stops completed
          </p>
          <p className="text-sm text-green-600 mt-4">
            Head back to base to process the collected tins.
          </p>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // Find tin IDs from numbers
      const deployedTin = availableTins.find(
        (t) => t.tinNumber === deployedTinNumber.trim()
      );
      const collectedTinId = collectedTinNumber.trim() || null;

      const formData = new FormData();
      formData.set("stopId", currentStop.id);
      if (deployedTin) formData.set("deployedTinId", deployedTin.id);
      if (collectedTinId) formData.set("collectedTinId", collectedTinId);
      if (position) {
        formData.set("latitude", position.lat.toString());
        formData.set("longitude", position.lng.toString());
      }

      await completeStop(formData);

      setDeployedTinNumber("");
      setCollectedTinNumber("");
      // Move to next pending
      const next = route.stops.findIndex(
        (s, i) => i > currentStopIndex && s.status === "PENDING"
      );
      if (next >= 0) setCurrentStopIndex(next);
    } catch (err) {
      // Handle offline - store locally
      if (!isOnline) {
        const queue = JSON.parse(
          localStorage.getItem("offlineQueue") || "[]"
        );
        queue.push({
          type: "completeStop",
          stopId: currentStop.id,
          deployedTinNumber: deployedTinNumber.trim(),
          collectedTinNumber: collectedTinNumber.trim(),
          latitude: position?.lat,
          longitude: position?.lng,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem("offlineQueue", JSON.stringify(queue));
        setDeployedTinNumber("");
        setCollectedTinNumber("");
        setError("Offline - action saved locally");
      } else {
        setError("Failed to complete stop. Please try again.");
      }
    }
    setSubmitting(false);
  };

  const handleSkip = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("stopId", currentStop.id);
      formData.set("skipReason", skipReason || "Not accessible");
      await skipStop(formData);
      setSkipReason("");
      setShowSkip(false);
      // Move to next pending
      const next = route.stops.findIndex(
        (s, i) => i > currentStopIndex && s.status === "PENDING"
      );
      if (next >= 0) setCurrentStopIndex(next);
    } catch (err) {
      setError("Failed to skip stop. Please try again.");
    }
    setSubmitting(false);
  };

  const progress =
    ((route.stops.length - pendingStops.length) / route.stops.length) * 100;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">{route.name}</h1>
            <p className="text-indigo-200 text-sm">
              Stop {currentStopIndex + 1} of {route.stops.length}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isOnline ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-green-200" : "bg-red-200"
                }`}
              />
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 bg-indigo-800 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current stop */}
      <div className="p-4 space-y-4">
        {error && (
          <div
            className={`p-3 rounded-lg border ${
              error.includes("Offline")
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {currentStop.location.name}
              </h2>
              <p className="text-gray-500 mt-1">
                {[
                  currentStop.location.address,
                  currentStop.location.city,
                  currentStop.location.postcode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            <span className="text-2xl font-bold text-indigo-600">
              #{currentStopIndex + 1}
            </span>
          </div>

          {currentStop.parkingNotes && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm font-medium text-orange-800">🅿️ Parking</p>
              <p className="text-sm text-orange-700">{currentStop.parkingNotes}</p>
            </div>
          )}

          {currentStop.accessNotes && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">ℹ️ Access</p>
              <p className="text-sm text-blue-700">{currentStop.accessNotes}</p>
            </div>
          )}

          {/* Navigation link */}
          {currentStop.location.latitude && currentStop.location.longitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${currentStop.location.latitude},${currentStop.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full text-center bg-blue-50 text-blue-700 font-medium py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              📍 Open in Google Maps
            </a>
          )}
        </div>

        {/* Scan section */}
        <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Scan Tins</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New tin being LEFT here
            </label>
            <input
              type="text"
              value={deployedTinNumber}
              onChange={(e) => setDeployedTinNumber(e.target.value)}
              placeholder="Scan or type tin number..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Old tin being COLLECTED
            </label>
            <input
              type="text"
              value={collectedTinNumber}
              onChange={(e) => setCollectedTinNumber(e.target.value)}
              placeholder="Scan or type tin number..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoComplete="off"
            />
          </div>

          {position && (
            <p className="text-xs text-gray-400">
              📍 GPS: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          )}

          <button
            onClick={handleComplete}
            disabled={submitting || !deployedTinNumber.trim()}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-green-700 hover:bg-green-700 transition-colors"
          >
            {submitting ? "Processing..." : "✅ Complete Stop"}
          </button>

          {/* Skip */}
          {!showSkip ? (
            <button
              onClick={() => setShowSkip(true)}
              className="w-full text-orange-600 font-medium py-2 text-sm hover:text-orange-700 transition-colors"
            >
              Can't access this location? Skip stop
            </button>
          ) : (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <input
                type="text"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Reason (e.g. closed, no parking)..."
                className="w-full rounded-lg border border-orange-300 px-3 py-2 text-sm mb-2 outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSkip}
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  Skip Stop
                </button>
                <button
                  onClick={() => setShowSkip(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* All stops list */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-900 mb-3">All Stops</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {route.stops.map((stop, i) => (
              <button
                key={stop.id}
                onClick={() => stop.status === "PENDING" && setCurrentStopIndex(i)}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${
                  i === currentStopIndex
                    ? "bg-indigo-50 border border-indigo-200"
                    : stop.status === "COMPLETED"
                      ? "bg-green-50 hover:bg-green-100"
                      : stop.status === "SKIPPED"
                        ? "bg-orange-50 hover:bg-orange-100"
                        : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    stop.status === "COMPLETED"
                      ? "bg-green-600 text-white"
                      : stop.status === "SKIPPED"
                        ? "bg-orange-500 text-white"
                        : i === currentStopIndex
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {stop.status === "COMPLETED"
                    ? "✓"
                    : stop.status === "SKIPPED"
                      ? "—"
                      : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      stop.status !== "PENDING"
                        ? "text-gray-500"
                        : "text-gray-900"
                    }`}
                  >
                    {stop.location.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {stop.location.postcode}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
