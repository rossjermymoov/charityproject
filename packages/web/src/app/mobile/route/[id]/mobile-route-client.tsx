"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { completeRunStop, skipRunStop } from "@/app/(dashboard)/finance/collection-tins/routes/actions";
import { BarcodeScanner } from "../../barcode-scanner";

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
  route: { id: string; name: string; description: string | null };
  runStops: RunStop[];
  assignedTo: { contact: { firstName: string; lastName: string } } | null;
};

type Tin = { id: string; tinNumber: string };

export function MobileRouteClient({ run, availableTins }: { run: Run; availableTins: Tin[] }) {
  const router = useRouter();
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [deployedTinNumber, setDeployedTinNumber] = useState("");
  const [collectedTinNumber, setCollectedTinNumber] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [showSkip, setShowSkip] = useState(false);
  const [showAllStops, setShowAllStops] = useState(false);
  const [scanTarget, setScanTarget] = useState<"deploy" | "collect" | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firstPending = run.runStops.findIndex((s) => s.status === "PENDING");
    if (firstPending >= 0) setCurrentStopIndex(firstPending);
  }, [run.runStops]);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setIsOnline(navigator.onLine);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
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

  const handleScan = useCallback((value: string) => {
    if (scanTarget === "deploy") setDeployedTinNumber(value);
    else if (scanTarget === "collect") setCollectedTinNumber(value);
    setScanTarget(null);
  }, [scanTarget]);

  const handleCloseScan = useCallback(() => setScanTarget(null), []);

  if (!currentStop || pendingStops.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-green-50 rounded-3xl p-10 text-center w-full">
          <div className="text-8xl mb-6">✅</div>
          <h1 className="text-4xl font-bold text-green-900">Run Complete!</h1>
          <p className="text-2xl text-green-700 mt-4">{run.route.name}</p>
          <p className="text-xl text-green-600 mt-2">{completedStops.length} of {run.runStops.length} stops completed</p>
          <p className="text-lg text-green-600 mt-6">Head back to base to count the collected tins.</p>
          <button
            onClick={() => router.push("/mobile")}
            className="mt-8 w-full bg-green-600 text-white font-bold py-5 rounded-2xl text-xl active:bg-green-700"
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
      const deployedTin = availableTins.find((t) => t.tinNumber === deployedTinNumber.trim());
      const formData = new FormData();
      formData.set("runStopId", currentStop.id);
      if (deployedTin) formData.set("deployedTinId", deployedTin.id);
      if (collectedTinNumber.trim()) formData.set("collectedTinId", collectedTinNumber.trim());
      if (position) {
        formData.set("latitude", position.lat.toString());
        formData.set("longitude", position.lng.toString());
      }
      await completeRunStop(formData);
      setDeployedTinNumber("");
      setCollectedTinNumber("");
      const next = run.runStops.findIndex((s, i) => i > currentStopIndex && s.status === "PENDING");
      if (next >= 0) setCurrentStopIndex(next);
    } catch {
      if (!isOnline) {
        const queue = JSON.parse(localStorage.getItem("offlineQueue") || "[]");
        queue.push({ type: "completeRunStop", runStopId: currentStop.id, deployedTinNumber: deployedTinNumber.trim(), collectedTinNumber: collectedTinNumber.trim(), latitude: position?.lat, longitude: position?.lng, timestamp: new Date().toISOString() });
        localStorage.setItem("offlineQueue", JSON.stringify(queue));
        setDeployedTinNumber("");
        setCollectedTinNumber("");
        setError("Offline — action saved locally");
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
      const next = run.runStops.findIndex((s, i) => i > currentStopIndex && s.status === "PENDING");
      if (next >= 0) setCurrentStopIndex(next);
    } catch {
      setError("Failed to skip stop. Please try again.");
    }
    setSubmitting(false);
  };

  const loc = currentStop.routeStop.location;

  return (
    <>
      {scanTarget && <BarcodeScanner onScan={handleScan} onClose={handleCloseScan} />}

      <div className="min-h-[100dvh] bg-gray-100 pb-8">
        {/* Sticky header */}
        <div className="bg-indigo-600 text-white px-5 sticky top-0 z-10 shadow-xl" style={{ paddingTop: "calc(env(safe-area-inset-top, 12px) + 0.75rem)", paddingBottom: "1.25rem" }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.push("/mobile")} className="flex items-center gap-2 text-indigo-200 active:text-white py-2">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-lg font-semibold">Back</span>
            </button>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold ${isOnline ? "bg-green-500/30" : "bg-red-500/30"}`}>
              <span className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-300" : "bg-red-300"}`} />
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
          <h1 className="font-bold text-2xl">{run.route.name}</h1>
          <div className="flex items-center justify-between mt-2">
            <p className="text-indigo-200 text-lg">Stop {currentStopIndex + 1} of {run.runStops.length}</p>
            <p className="text-indigo-200 text-lg font-bold">{Math.round(progress)}%</p>
          </div>
          <div className="mt-3 bg-indigo-800 rounded-full h-4">
            <div className="bg-white rounded-full h-4 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {error && (
            <div className={`p-5 rounded-2xl border-2 ${error.includes("Offline") ? "bg-yellow-50 border-yellow-300 text-yellow-800" : "bg-red-50 border-red-300 text-red-800"}`}>
              <p className="text-lg font-bold">{error}</p>
            </div>
          )}

          {/* Location card */}
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">{loc.name}</h2>
                <p className="text-lg text-gray-500 mt-2">
                  {[loc.address, loc.city, loc.postcode].filter(Boolean).join(", ")}
                </p>
              </div>
              <div className="bg-indigo-100 rounded-2xl w-16 h-16 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-indigo-600">{currentStopIndex + 1}</span>
              </div>
            </div>

            {currentStop.routeStop.parkingNotes && (
              <div className="mt-5 p-4 bg-orange-50 rounded-2xl border border-orange-200">
                <p className="text-lg font-bold text-orange-800">🅿️ Parking</p>
                <p className="text-lg text-orange-700 mt-1">{currentStop.routeStop.parkingNotes}</p>
              </div>
            )}

            {currentStop.routeStop.accessNotes && (
              <div className="mt-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-lg font-bold text-blue-800">🚪 Access</p>
                <p className="text-lg text-blue-700 mt-1">{currentStop.routeStop.accessNotes}</p>
              </div>
            )}

            {loc.latitude && loc.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-3 w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-xl active:bg-blue-700 transition-colors"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Navigate
              </a>
            )}
          </div>

          {/* Tin scanning section */}
          <div className="bg-white rounded-3xl shadow-md p-6 space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Swap Tins</h3>

            {/* Deploy tin */}
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">
                New tin being LEFT here
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={deployedTinNumber}
                  onChange={(e) => setDeployedTinNumber(e.target.value)}
                  placeholder="Tin number..."
                  className="flex-1 rounded-2xl border-2 border-gray-300 px-5 py-5 text-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  autoComplete="off"
                />
                <button
                  onClick={() => setScanTarget("deploy")}
                  className="bg-indigo-600 text-white rounded-2xl w-20 flex items-center justify-center active:bg-indigo-700 transition-colors flex-shrink-0"
                  type="button"
                >
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Collect tin */}
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">
                Old tin being COLLECTED
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={collectedTinNumber}
                  onChange={(e) => setCollectedTinNumber(e.target.value)}
                  placeholder="Tin number..."
                  className="flex-1 rounded-2xl border-2 border-gray-300 px-5 py-5 text-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  autoComplete="off"
                />
                <button
                  onClick={() => setScanTarget("collect")}
                  className="bg-indigo-600 text-white rounded-2xl w-20 flex items-center justify-center active:bg-indigo-700 transition-colors flex-shrink-0"
                  type="button"
                >
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {position && (
              <p className="text-base text-gray-400">📍 {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>
            )}

            {/* Complete button */}
            <button
              onClick={handleComplete}
              disabled={submitting || !deployedTinNumber.trim()}
              className="w-full bg-green-600 text-white font-bold py-6 rounded-2xl text-2xl disabled:opacity-40 active:bg-green-700 transition-colors shadow-lg"
            >
              {submitting ? "Processing..." : "✅ Complete Stop"}
            </button>

            {/* Skip */}
            {!showSkip ? (
              <button
                onClick={() => setShowSkip(true)}
                className="w-full text-orange-600 font-bold py-4 text-lg active:text-orange-700"
              >
                Can&apos;t access? Skip this stop
              </button>
            ) : (
              <div className="p-5 bg-orange-50 rounded-2xl border-2 border-orange-200 space-y-4">
                <input
                  type="text"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  placeholder="Reason (e.g. closed, no parking)..."
                  className="w-full rounded-2xl border-2 border-orange-300 px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    disabled={submitting}
                    className="flex-1 bg-orange-600 text-white py-4 rounded-2xl text-lg font-bold active:bg-orange-700 disabled:opacity-50"
                  >
                    Skip Stop
                  </button>
                  <button
                    onClick={() => setShowSkip(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-2xl text-lg font-bold active:bg-gray-300"
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
            className="w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-6 flex items-center justify-between active:bg-gray-50"
          >
            <span className="text-xl font-bold text-gray-900">All Stops</span>
            <div className="flex items-center gap-3">
              <span className="text-lg text-gray-500 font-semibold">{completedStops.length}/{run.runStops.length}</span>
              <svg className={`w-7 h-7 text-gray-400 transition-transform ${showAllStops ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showAllStops && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-4 space-y-2">
              {run.runStops.map((rs, i) => (
                <button
                  key={rs.id}
                  onClick={() => rs.status === "PENDING" && setCurrentStopIndex(i)}
                  className={`w-full text-left p-5 rounded-2xl flex items-center gap-4 transition-colors ${
                    i === currentStopIndex ? "bg-indigo-50 border-2 border-indigo-300"
                    : rs.status === "COMPLETED" ? "bg-green-50"
                    : rs.status === "SKIPPED" ? "bg-orange-50"
                    : "bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                    rs.status === "COMPLETED" ? "bg-green-600 text-white"
                    : rs.status === "SKIPPED" ? "bg-orange-500 text-white"
                    : i === currentStopIndex ? "bg-indigo-600 text-white"
                    : "bg-gray-300 text-gray-600"
                  }`}>
                    {rs.status === "COMPLETED" ? "✓" : rs.status === "SKIPPED" ? "—" : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-lg font-bold truncate ${rs.status !== "PENDING" ? "text-gray-500" : "text-gray-900"}`}>
                      {rs.routeStop.location.name}
                    </p>
                    <p className="text-base text-gray-400 truncate mt-0.5">{rs.routeStop.location.postcode}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
