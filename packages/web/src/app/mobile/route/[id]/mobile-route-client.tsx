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
  const [deployTin, setDeployTin] = useState("");
  const [collectTin, setCollectTin] = useState("");
  const [scanTarget, setScanTarget] = useState<"deploy" | "collect" | null>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [showStops, setShowStops] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const i = run.runStops.findIndex((s) => s.status === "PENDING");
    if (i >= 0) setCurrentStopIndex(i);
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
        (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const pendingStops = run.runStops.filter((s) => s.status === "PENDING");
  const doneStops = run.runStops.filter((s) => s.status === "COMPLETED" || s.status === "SKIPPED");
  const currentStop = run.runStops[currentStopIndex];
  const progress = Math.round((doneStops.length / run.runStops.length) * 100);

  const handleScan = useCallback((val: string) => {
    if (scanTarget === "deploy") setDeployTin(val);
    else setCollectTin(val);
    setScanTarget(null);
  }, [scanTarget]);

  // COMPLETED SCREEN
  if (!currentStop || pendingStops.length === 0) {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f0fdf4", padding: 32 }}>
        <div style={{ fontSize: 96, marginBottom: 24 }}>✅</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#14532d", textAlign: "center" }}>Run Complete!</div>
        <div style={{ fontSize: 22, color: "#166534", marginTop: 12, textAlign: "center" }}>{run.route.name}</div>
        <div style={{ fontSize: 18, color: "#16a34a", marginTop: 8 }}>{doneStops.length} of {run.runStops.length} stops done</div>
        <button onClick={() => router.push("/mobile")} style={{ marginTop: 40, width: "100%", maxWidth: 320, background: "#16a34a", color: "white", fontSize: 22, fontWeight: 800, padding: "20px 0", borderRadius: 20, border: "none", cursor: "pointer" }}>
          Back to Home
        </button>
      </div>
    );
  }

  const handleComplete = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const tin = availableTins.find((t) => t.tinNumber === deployTin.trim());
      const fd = new FormData();
      fd.set("runStopId", currentStop.id);
      if (tin) fd.set("deployedTinId", tin.id);
      if (collectTin.trim()) fd.set("collectedTinId", collectTin.trim());
      if (position) { fd.set("latitude", position.lat.toString()); fd.set("longitude", position.lng.toString()); }
      await completeRunStop(fd);
      setDeployTin("");
      setCollectTin("");
      const next = run.runStops.findIndex((s, i) => i > currentStopIndex && s.status === "PENDING");
      if (next >= 0) setCurrentStopIndex(next);
    } catch {
      setError(isOnline ? "Failed. Try again." : "Offline — saved locally.");
    }
    setSubmitting(false);
  };

  const handleSkip = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("runStopId", currentStop.id);
      fd.set("skipReason", skipReason || "Not accessible");
      await skipRunStop(fd);
      setSkipReason("");
      setShowSkip(false);
      const next = run.runStops.findIndex((s, i) => i > currentStopIndex && s.status === "PENDING");
      if (next >= 0) setCurrentStopIndex(next);
    } catch { setError("Failed to skip."); }
    setSubmitting(false);
  };

  const loc = currentStop.routeStop.location;

  // ALL STOPS OVERLAY
  if (showStops) {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#f3f4f6", overflow: "hidden" }}>
        <div style={{ background: "#4f46e5", color: "white", padding: "calc(env(safe-area-inset-top, 12px) + 12px) 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button onClick={() => setShowStops(false)} style={{ fontSize: 18, fontWeight: 700, color: "white", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{doneStops.length}/{run.runStops.length} done</div>
        </div>
        <div style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch", padding: 16 }}>
          {run.runStops.map((rs, i) => (
            <button key={rs.id} onClick={() => { if (rs.status === "PENDING") { setCurrentStopIndex(i); setShowStops(false); } }} style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              marginBottom: 8,
              borderRadius: 16,
              border: i === currentStopIndex ? "2px solid #4f46e5" : "1px solid #e5e7eb",
              background: rs.status === "COMPLETED" ? "#f0fdf4" : rs.status === "SKIPPED" ? "#fff7ed" : i === currentStopIndex ? "#eef2ff" : "white",
              cursor: rs.status === "PENDING" ? "pointer" : "default",
              textAlign: "left",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, flexShrink: 0, color: "white",
                background: rs.status === "COMPLETED" ? "#16a34a" : rs.status === "SKIPPED" ? "#f97316" : i === currentStopIndex ? "#4f46e5" : "#d1d5db",
              }}>
                {rs.status === "COMPLETED" ? "✓" : rs.status === "SKIPPED" ? "—" : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: rs.status !== "PENDING" ? "#888" : "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rs.routeStop.location.name}</div>
                <div style={{ fontSize: 14, color: "#999", marginTop: 2 }}>{rs.routeStop.location.postcode}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // SKIP OVERLAY
  if (showSkip) {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff7ed", padding: 32 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏭️</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#9a3412", marginBottom: 8 }}>Skip this stop?</div>
        <div style={{ fontSize: 18, color: "#c2410c", marginBottom: 24, textAlign: "center" }}>{loc.name}</div>
        <input
          type="text"
          value={skipReason}
          onChange={(e) => setSkipReason(e.target.value)}
          placeholder="Reason (closed, no parking...)"
          style={{ width: "100%", maxWidth: 360, padding: "18px 20px", fontSize: 18, borderRadius: 16, border: "2px solid #fdba74", outline: "none", marginBottom: 20 }}
        />
        <button onClick={handleSkip} disabled={submitting} style={{ width: "100%", maxWidth: 360, background: "#ea580c", color: "white", fontSize: 22, fontWeight: 800, padding: "20px 0", borderRadius: 20, border: "none", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}>
          {submitting ? "Skipping..." : "Skip Stop"}
        </button>
        <button onClick={() => setShowSkip(false)} style={{ marginTop: 16, fontSize: 18, color: "#9a3412", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          Cancel
        </button>
      </div>
    );
  }

  // MAIN COLLECTION SCREEN - fixed, no scroll
  return (
    <>
      {scanTarget && <BarcodeScanner onScan={handleScan} onClose={() => setScanTarget(null)} />}

      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#f3f4f6", overflow: "hidden" }}>
        {/* Header bar */}
        <div style={{
          background: "#4f46e5",
          color: "white",
          padding: "calc(env(safe-area-inset-top, 12px) + 8px) 20px 12px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <button onClick={() => router.push("/mobile")} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600 }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              Home
            </button>
            <div style={{ fontSize: 14, fontWeight: 700, background: isOnline ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)", padding: "4px 12px", borderRadius: 12 }}>
              {isOnline ? "● Online" : "● Offline"}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Stop {currentStopIndex + 1}/{run.runStops.length}</div>
            <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.8 }}>{progress}%</div>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.2)", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "white", borderRadius: 4, transition: "width 0.3s" }} />
          </div>
        </div>

        {/* Main content area - fills remaining space */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 16px", gap: 10, overflow: "hidden", minHeight: 0 }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "2px solid #fca5a5", borderRadius: 14, padding: "10px 16px", fontSize: 16, fontWeight: 700, color: "#dc2626", flexShrink: 0 }}>{error}</div>
          )}

          {/* Location */}
          <div style={{ background: "white", borderRadius: 20, padding: "16px 20px", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#111", lineHeight: 1.2 }}>{loc.name}</div>
            <div style={{ fontSize: 15, color: "#888", marginTop: 4 }}>
              {[loc.address, loc.city, loc.postcode].filter(Boolean).join(", ")}
            </div>
            {(currentStop.routeStop.parkingNotes || currentStop.routeStop.accessNotes) && (
              <div style={{ fontSize: 14, color: "#ea580c", marginTop: 6, fontWeight: 600 }}>
                {currentStop.routeStop.parkingNotes && `🅿️ ${currentStop.routeStop.parkingNotes}`}
                {currentStop.routeStop.parkingNotes && currentStop.routeStop.accessNotes && " · "}
                {currentStop.routeStop.accessNotes && `🚪 ${currentStop.routeStop.accessNotes}`}
              </div>
            )}
          </div>

          {/* Navigate button */}
          {loc.latitude && loc.longitude && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#2563eb", color: "white", fontSize: 20, fontWeight: 800,
              padding: "16px 0", borderRadius: 18, textDecoration: "none", flexShrink: 0,
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Navigate
            </a>
          )}

          {/* Tin inputs - side by side for space efficiency */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            {/* Deploy */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Leave tin</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={deployTin}
                  onChange={(e) => setDeployTin(e.target.value)}
                  placeholder="Tin #"
                  style={{ flex: 1, minWidth: 0, padding: "14px 12px", fontSize: 18, fontFamily: "monospace", borderRadius: 14, border: "2px solid #d1d5db", outline: "none" }}
                  autoComplete="off"
                />
                <button onClick={() => setScanTarget("deploy")} style={{ width: 52, background: "#4f46e5", color: "white", borderRadius: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>
            </div>
            {/* Collect */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Collect tin</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={collectTin}
                  onChange={(e) => setCollectTin(e.target.value)}
                  placeholder="Tin #"
                  style={{ flex: 1, minWidth: 0, padding: "14px 12px", fontSize: 18, fontFamily: "monospace", borderRadius: 14, border: "2px solid #d1d5db", outline: "none" }}
                  autoComplete="off"
                />
                <button onClick={() => setScanTarget("collect")} style={{ width: 52, background: "#4f46e5", color: "white", borderRadius: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div style={{ flex: 1 }} />

          {/* Action buttons at bottom */}
          <button
            onClick={handleComplete}
            disabled={submitting || !deployTin.trim()}
            style={{
              width: "100%",
              background: deployTin.trim() ? "#16a34a" : "#d1d5db",
              color: "white",
              fontSize: 24,
              fontWeight: 800,
              padding: "22px 0",
              borderRadius: 20,
              border: "none",
              cursor: deployTin.trim() ? "pointer" : "default",
              opacity: submitting ? 0.5 : 1,
              flexShrink: 0,
              boxShadow: deployTin.trim() ? "0 4px 14px rgba(22,163,74,0.3)" : "none",
            }}
          >
            {submitting ? "Processing..." : "✅ Complete Stop"}
          </button>

          <div style={{ display: "flex", gap: 10, flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
            <button onClick={() => setShowSkip(true)} style={{ flex: 1, background: "#fff7ed", color: "#ea580c", fontSize: 16, fontWeight: 700, padding: "14px 0", borderRadius: 16, border: "2px solid #fdba74", cursor: "pointer" }}>
              Skip Stop
            </button>
            <button onClick={() => setShowStops(true)} style={{ flex: 1, background: "white", color: "#4f46e5", fontSize: 16, fontWeight: 700, padding: "14px 0", borderRadius: 16, border: "2px solid #c7d2fe", cursor: "pointer" }}>
              All Stops ({doneStops.length}/{run.runStops.length})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
