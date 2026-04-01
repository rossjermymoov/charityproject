"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { completeRunStop, skipRunStop } from "@/app/(dashboard)/finance/collection-tins/routes/actions";

type RunStop = {
  id: string;
  status: string;
  skipReason: string | null;
  deployedTinId: string | null;
  collectedTinId: string | null;
  completedAt: string | null;
  routeStop: {
    id: string;
    sortOrder: number;
    parkingNotes: string | null;
    accessNotes: string | null;
    location: {
      id: string;
      name: string;
      address: string | null;
      city: string | null;
      postcode: string | null;
      latitude: number | null;
      longitude: number | null;
    };
  };
  deployedTin: { tinNumber: string } | null;
  collectedTin: { tinNumber: string } | null;
};

type Run = {
  id: string;
  status: string;
  route: {
    id: string;
    name: string;
    description: string | null;
  };
  runStops: RunStop[];
  assignedTo: { contact: { firstName: string; lastName: string } } | null;
};

type Tin = {
  id: string;
  tinNumber: string;
};

export function MobileRouteClient({
  run,
  availableTins,
}: {
  run: Run;
  availableTins: Tin[];
}) {
  const router = useRouter();
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [deployedTinNumber, setDeployedTinNumber] = useState("");
  const [collectedTinNumber, setCollectedTinNumber] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [showSkip, setShowSkip] = useState(false);
  const [showAllStops, setShowAllStops] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firstPending = run.runStops.findIndex((s) => s.status === "PENDING");
    if (firstPending >= 0) setCurrentStopIndex(firstPending);
  }, [run.runStops]);

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

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const pendingStops = run.runStops.filter((s) => s.status === "PENDING");
  const completedStops = run.runStops.filter((s) => s.status === "COMPLETED");
  const currentStop = run.runStops[currentStopIndex];
  const progress = ((run.runStops.length - pendingStops.length) / run.runStops.length) * 100;

  if (!currentStop || pendingStops.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-green-50 rounded-3xl p-10 text-center w-full max-w-md">
          <div className="text-7xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-green-900">Run Complete!</h1>
          <p className="text-xl text-green-700 mt-3">{run.route.name}</p>
          <p className="text-lg text-green-600 mt-2">
            {completedStops.length} of {run.runStops.length} stops completed
          </p>
          <p className="text-base text-green-600 mt-6">
            Head back to base to count the collected tins.
          </p>
          <button
            onClick={() => router.push("/mobile")}
            className="mt-8 w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg active:bg-green-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const deployedTin = availableTins.find(
        (t) => t.tinNumber === deployedTinNumber.trim()
      );
      const collectedTinId = collectedTinNumber.trim() || null;

      const formData = new FormData();
      formData.set("runStopId", currentStop.id);
      if (deployedTin) formData.set("deployedTinId", deployedTin.id);
      if (collectedTinId) formData.set("collectedTinId", collectedTinId);
      if (position) {
        formData.set("latitude", position.lat.toString());
        formData.set("longitude", position.lng.toString());
      }

      await completeRunStop(formData);
      setDeployedTinNumber("");
      setCollectedTinNumber("");
      const next = run.runStops.findIndex(
        (s, i) => i > currentStopIndex && s.status === "PENDING"
      );
      if (next >= 0) setCurrentStopIndex(next);
    } catch {
      if (!isOnline) {
        const queue = JSON.parse(localStorage.getItem("offlineQueue") || "[]");
        queue.push({
          type: "completeRunStop",
          runStopId: currentStop.id,
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
      formData.set("runStopId", currentStop.id);
      formData.set("skipReason", skipReason || "Not accessible");
      await skipRunStop(formData);
      setSkipReason("");
      setShowSkip(false);
      const next = run.runStops.findIndex(
        (s, i) => i > currentStopIndex && s.status === "PENDING"
      );
      if (next >= 0) setCurrentStopIndex(next);
    } catch {
      setError("Failed to skip stop. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-8">
      {/* Sticky header */}
      <div className="bg-indigo-600 text-white px-5 pt-12 pb-5 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push("/mobile")}
            className="flex items-center gap-2 text-indigo-200 active:text-white py-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-base font-medium">Back</span>
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${isOnline ? "bg-green-500/30" : "bg-red-500/30"}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-300" : "bg-red-300"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
        <h1 className="font-bold text-xl">{run.route.name}</h1>
        <p className="text-indigo-200 text-base mt-1">
          Stop {currentStopIndex + 1} of {run.runStops.length}
        </p>
        <div className="mt-4 bg-indigo-800 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {error && (
          <div className={`p-4 rounded-2xl border-2 ${
            error.includes("Offline")
              ? "bg-yellow-50 border-yellow-300 text-yellow-800"
              : "bg-red-50 border-red-300 text-red-800"
          }`}>
            <p className="text-base font-semibold">{error}</p>
          </div>
        )}

        {/* Current stop card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStop.routeStop.location.name}
              </h2>
              <p className="text-base text-gray-500 mt-2">
                {[
                  currentStop.routeStop.location.address,
                  currentStop.routeStop.location.city,
                  currentStop.routeStop.location.postcode,
                ].filter(Boolean).join(", ")}
              </p>
            </div>
            <span className="text-3xl font-bold text-indigo-600 ml-3">
              #{currentStopIndex + 1}
            </span>
          </div>

          {currentStop.routeStop.parkingNotes && (
            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-base font-bold text-orange-800">🅿️ Parking</p>
              <p className="text-base text-orange-700 mt-1">{currentStop.routeStop.parkingNotes}</p>
            </div>
          )}

          {currentStop.routeStop.accessNotes && (
            <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-base font-bold text-blue-800">🚪 Access</p>
              <p className="text-base text-blue-700 mt-1">{currentStop.routeStop.accessNotes}</p>
            </div>
          )}

          {currentStop.routeStop.location.latitude && currentStop.routeStop.location.longitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${currentStop.routeStop.location.latitude},${currentStop.routeStop.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg active:bg-blue-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Navigate
            </a>
          )}
        </div>

        {/* Tin swap section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-5">
          <h3 className="text-xl font-bold text-gray-900">Swap Tins</h3>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              New tin being LEFT here
            </label>
            <input
              type="text"
              value={deployedTinNumber}
              onChange={(e) => setDeployedTinNumber(e.target.value)}
              placeholder="Scan or type tin number..."
              className="w-full rounded-xl border-2 border-gray-300 px-5 py-4 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              Old tin being COLLECTED
            </label>
            <input
              type="text"
              value={collectedTinNumber}
              onChange={(e) => setCollectedTinNumber(e.target.value)}
              placeholder="Scan or type tin number..."
              className="w-full rounded-xl border-2 border-gray-300 px-5 py-4 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoComplete="off"
            />
          </div>

          {position && (
            <p className="text-sm text-gray-400">
              📍 GPS: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          )}

          <button
            onClick={handleComplete}
            disabled={submitting || !deployedTinNumber.trim()}
            className="w-full bg-green-600 text-white font-bold py-5 rounded-xl text-xl disabled:opacity-40 disabled:cursor-not-allowed active:bg-green-700 transition-colors shadow-lg"
          >
            {submitting ? "Processing..." : "✅ Complete Stop"}
          </button>

          {!showSkip ? (
            <button
              onClick={() => setShowSkip(true)}
              className="w-full text-orange-600 font-semibold py-3 text-base active:text-orange-700 transition-colors"
            >
              Can&apos;t access this location? Skip stop
            </button>
          ) : (
            <div className="p-5 bg-orange-50 rounded-xl border-2 border-orange-200">
              <input
                type="text"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Reason (e.g. closed, no parking)..."
                className="w-full rounded-xl border-2 border-orange-300 px-4 py-3.5 text-base mb-3 outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  disabled={submitting}
                  className="flex-1 bg-orange-600 text-white py-3.5 rounded-xl text-base font-bold active:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  Skip Stop
                </button>
                <button
                  onClick={() => setShowSkip(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3.5 rounded-xl text-base font-semibold active:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* All stops toggle */}
        <button
          onClick={() => setShowAllStops(!showAllStops)}
          className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center justify-between active:bg-gray-50"
        >
          <span className="text-lg font-bold text-gray-900">All Stops</span>
          <div className="flex items-center gap-3">
            <span className="text-base text-gray-500">
              {completedStops.length}/{run.runStops.length}
            </span>
            <svg
              className={`w-6 h-6 text-gray-400 transition-transform ${showAllStops ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showAllStops && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="space-y-2">
              {run.runStops.map((runStop, i) => (
                <button
                  key={runStop.id}
                  onClick={() => runStop.status === "PENDING" && setCurrentStopIndex(i)}
                  className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-colors ${
                    i === currentStopIndex
                      ? "bg-indigo-50 border-2 border-indigo-300"
                      : runStop.status === "COMPLETED"
                        ? "bg-green-50"
                        : runStop.status === "SKIPPED"
                          ? "bg-orange-50"
                          : "bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${
                      runStop.status === "COMPLETED"
                        ? "bg-green-600 text-white"
                        : runStop.status === "SKIPPED"
                          ? "bg-orange-500 text-white"
                          : i === currentStopIndex
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {runStop.status === "COMPLETED"
                      ? "✓"
                      : runStop.status === "SKIPPED"
                        ? "—"
                        : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-semibold truncate ${
                      runStop.status !== "PENDING" ? "text-gray-500" : "text-gray-900"
                    }`}>
                      {runStop.routeStop.location.name}
                    </p>
                    <p className="text-sm text-gray-400 truncate mt-0.5">
                      {runStop.routeStop.location.postcode}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
