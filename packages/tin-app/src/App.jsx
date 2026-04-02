import { useState, useEffect, useRef } from "react";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

const API_BASE = "https://web-production-68151.up.railway.app";

// ─── Bucket Icon ─────────────────────────────────────────────────
function BucketIcon({ size = 32, color = "white" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9l1.5 11a1 1 0 0 0 1 .9h9a1 1 0 0 0 1-.9L19 9" />
      <ellipse cx="12" cy="9" rx="8" ry="2.5" />
      <path d="M8.5 6.5C8.5 4 10 2.5 12 2.5s3.5 1.5 3.5 4" />
      <line x1="10" y1="9" x2="14" y2="9" strokeWidth="2.2" />
    </svg>
  );
}

// ─── SVG Icons ───────────────────────────────────────────────────
function ChevronRight({ size = 20, color = "#999" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>;
}
function PlusIcon({ size = 20, color = "white" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function CalendarIcon({ size = 20, color = "#666" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function MapPinIcon({ size = 20, color = "#666" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function RouteIcon({ size = 20, color = "white" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 000-7h-9a3.5 3.5 0 010-7H12"/></svg>;
}
function PlayIcon({ size = 20, color = "white" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
}
function CameraIcon({ size = 28 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
}

const PRESETS = [
  { name: "Teal", color: "#0d9488" },
  { name: "Indigo", color: "#4f46e5" },
  { name: "Blue", color: "#2563eb" },
  { name: "Purple", color: "#7c3aed" },
  { name: "Rose", color: "#e11d48" },
  { name: "Orange", color: "#ea580c" },
];

// ─── Barcode Scanner Component ───────────────────────────────────
function BarcodeScanner({ onScan, onClose, brand }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error:", err);
        const code = prompt("Camera unavailable. Enter barcode manually:");
        if (code) onScan(code);
        else onClose();
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  function captureAndRead() {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      if ("BarcodeDetector" in window) {
        const detector = new BarcodeDetector();
        detector.detect(canvas).then(barcodes => {
          if (barcodes.length > 0) onScan(barcodes[0].rawValue);
          else { const c = prompt("No barcode detected. Enter manually:"); if (c) onScan(c); }
        }).catch(() => { const c = prompt("Scan failed. Enter manually:"); if (c) onScan(c); });
      } else {
        const c = prompt("Enter barcode number:"); if (c) onScan(c);
      }
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} playsInline muted />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "75%", height: 200, border: "3px solid white", borderRadius: 16, boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
        </div>
        <div style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center", color: "white", fontSize: 18, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
          Point camera at barcode
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, padding: 16, background: "#000", flexShrink: 0 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "18px 0", fontSize: 20, fontWeight: 800, borderRadius: 16, border: "2px solid #666", background: "transparent", color: "white", cursor: "pointer" }}>Cancel</button>
        <button onClick={captureAndRead} style={{ flex: 1, padding: "18px 0", fontSize: 20, fontWeight: 800, borderRadius: 16, border: "none", background: brand || "#0d9488", color: "white", cursor: "pointer" }}>Capture</button>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────
export default function TinCollectionsApp() {
  const [brand, setBrand] = useState(() => {
    try { return localStorage.getItem("tc_brand") || null; } catch { return null; }
  });
  const [screen, setScreen] = useState("login");
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("tc_token") || null; } catch { return null; }
  });
  const [userName, setUserName] = useState(() => {
    try { return localStorage.getItem("tc_name") || ""; } catch { return ""; }
  });

  // Runs state
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [stops, setStops] = useState([]);
  const [idx, setIdx] = useState(0);
  const [deployTin, setDeployTin] = useState("");
  const [collectTin, setCollectTin] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [notes, setNotes] = useState("");
  const [scanning, setScanning] = useState(null);

  // General
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const screenRef = useRef(screen);

  useEffect(() => { screenRef.current = screen; }, [screen]);

  // Auto-login if we have a saved token
  useEffect(() => {
    if (token && brand) {
      setScreen("home");
      fetchRuns(token);
    }
  }, []);

  // ─── Android back button ──────────────────────────────────────
  useEffect(() => {
    const listener = CapApp.addListener("backButton", () => {
      const s = screenRef.current;
      if (s === "collect") setScreen("home");
      else if (s === "stops") setScreen("collect");
      else if (s === "skip") setScreen("collect");
      else if (s === "done") setScreen("home");
      else if (s === "home") setScreen("login");
      else if (s === "login") CapApp.exitApp();
    });
    return () => { listener.then(l => l.remove()); };
  }, []);

  // ─── API calls ────────────────────────────────────────────────
  async function doLogin(email, password) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setToken(data.token);
      setUserName(data.user.name);
      try {
        localStorage.setItem("tc_token", data.token);
        localStorage.setItem("tc_name", data.user.name);
      } catch {}
      setScreen("home");
      await fetchRuns(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRuns(t) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/mobile/runs?token=${t}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load runs");
      setRuns(data.runs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function selectRun(run) {
    setSelectedRun(run);
    const mapped = run.runStops.map(rs => ({
      id: rs.id,
      name: rs.routeStop.location.name,
      address: rs.routeStop.location.address,
      status: rs.status,
      parking: rs.routeStop.parkingNotes,
      access: rs.routeStop.accessNotes,
      deployedTinNumber: rs.deployedTin?.tinNumber || null,
      collectedTinNumber: rs.collectedTin?.tinNumber || null,
    }));
    setStops(mapped);
    const firstPending = mapped.findIndex(s => s.status === "PENDING");
    setIdx(firstPending >= 0 ? firstPending : 0);

    // Start run if SCHEDULED
    if (run.status === "SCHEDULED") {
      fetch(`${API_BASE}/api/mobile/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, runId: run.id, action: "start" }),
      });
    }

    setScreen("collect");
  }

  async function completeStop() {
    setLoading(true);
    const stop = stops[idx];
    try {
      await fetch(`${API_BASE}/api/mobile/runs/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          runStopId: stop.id,
          action: "complete",
          deployedTinNumber: deployTin.trim(),
          collectedTinNumber: collectTin.trim(),
          notes,
        }),
      });

      const next = [...stops];
      next[idx] = { ...next[idx], status: "COMPLETED" };
      setStops(next);
      setDeployTin(""); setCollectTin(""); setNotes("");

      const ni = next.findIndex((s, i) => i > idx && s.status === "PENDING");
      if (ni >= 0) {
        setIdx(ni);
      } else {
        await fetch(`${API_BASE}/api/mobile/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, runId: selectedRun.id, action: "complete" }),
        });
        setScreen("done");
      }
    } catch (err) {
      setError("Failed to save. Check connection.");
    } finally {
      setLoading(false);
    }
  }

  async function skipStop() {
    setLoading(true);
    const stop = stops[idx];
    try {
      await fetch(`${API_BASE}/api/mobile/runs/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, runStopId: stop.id, action: "skip", skipReason }),
      });

      const next = [...stops];
      next[idx] = { ...next[idx], status: "SKIPPED" };
      setStops(next);
      setSkipReason("");

      const ni = next.findIndex((s, i) => i > idx && s.status === "PENDING");
      if (ni >= 0) { setIdx(ni); setScreen("collect"); }
      else {
        await fetch(`${API_BASE}/api/mobile/runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, runId: selectedRun.id, action: "complete" }),
        });
        setScreen("done");
      }
    } catch (err) {
      setError("Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  function doLogout() {
    setToken(null);
    setUserName("");
    setRuns([]);
    try { localStorage.removeItem("tc_token"); localStorage.removeItem("tc_name"); } catch {}
    setScreen("login");
  }

  function saveBrand(c) {
    setBrand(c);
    try { localStorage.setItem("tc_brand", c); } catch {}
  }

  // ─── Helpers ──────────────────────────────────────────────────
  function darken(hex, pct) { const [r,g,b]=hexToRgb(hex); const f=1-pct/100; return rgbToHex(Math.round(r*f),Math.round(g*f),Math.round(b*f)); }
  function lighten(hex, pct) { const [r,g,b]=hexToRgb(hex); const f=pct/100; return rgbToHex(Math.round(r+(255-r)*f),Math.round(g+(255-g)*f),Math.round(b+(255-b)*f)); }
  function hexToRgb(hex) { const n=parseInt(hex.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
  function rgbToHex(r,g,b) { return "#"+[r,g,b].map(x=>x.toString(16).padStart(2,"0")).join(""); }

  async function openNavigation(address) {
    const encoded = encodeURIComponent(address);
    try { await Browser.open({ url: `https://www.google.com/maps/search/?api=1&query=${encoded}` }); }
    catch { window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank"); }
  }

  function handleScan(code) {
    if (scanning === "collect") setCollectTin(code);
    else if (scanning === "deploy") setDeployTin(code);
    setScanning(null);
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }

  const brandLight = brand ? lighten(brand, 92) : "#fff";
  const done = stops.filter(s => s.status !== "PENDING");
  const pct = stops.length > 0 ? Math.round((done.length / stops.length) * 100) : 0;
  const stop = stops[idx];

  // Separate runs into in-progress and upcoming
  const inProgressRuns = runs.filter(r => r.status === "IN_PROGRESS");
  const upcomingRuns = runs.filter(r => r.status === "SCHEDULED");

  // ─── Error toast ──────────────────────────────────────────────
  const ErrorToast = error ? (
    <div style={{ position: "fixed", top: 16, left: 16, right: 16, zIndex: 10000, background: "#ef4444", color: "white", padding: "14px 20px", borderRadius: 14, fontSize: 16, fontWeight: 700, textAlign: "center" }} onClick={() => setError(null)}>
      {error} <span style={{ opacity: 0.6 }}>(tap to dismiss)</span>
    </div>
  ) : null;

  const LoadingOverlay = loading ? (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 20, padding: "24px 32px", fontSize: 18, fontWeight: 700, color: "#333" }}>Loading...</div>
    </div>
  ) : null;

  // ─── SCANNER ──────────────────────────────────────────────────
  if (scanning) return <BarcodeScanner brand={brand} onScan={handleScan} onClose={() => setScanning(null)} />;

  // ─── SETUP (first launch) ─────────────────────────────────────
  if (!brand) {
    return (
      <div style={S.app}>
        {ErrorToast}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: "#f8fafc" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><BucketIcon size={38} color="#475569" /></div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#111", marginBottom: 6 }}>Welcome</div>
          <div style={{ fontSize: 16, color: "#666", marginBottom: 32, textAlign: "center" }}>Pick your charity's brand colour</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, width: "100%", maxWidth: 300, marginBottom: 32 }}>
            {PRESETS.map(p => (
              <button key={p.color} onClick={() => saveBrand(p.color)} style={{ width: "100%", aspectRatio: "1", borderRadius: 20, background: p.color, border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, gap: 2 }}>
                {p.name}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 14, color: "#999", marginBottom: 10 }}>Or enter a hex code</div>
          <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 260 }}>
            <input id="hex-input" defaultValue="#0d9488" style={{ flex: 1, padding: "14px 16px", fontSize: 18, fontFamily: "monospace", borderRadius: 14, border: "2px solid #d1d5db", outline: "none", textAlign: "center", boxSizing: "border-box" }} />
            <button onClick={() => { const v = document.getElementById("hex-input").value; if (/^#[0-9a-fA-F]{6}$/.test(v)) saveBrand(v); }} style={{ padding: "14px 20px", fontSize: 16, fontWeight: 800, borderRadius: 14, border: "none", background: "#111", color: "white", cursor: "pointer" }}>Go</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOGIN ─────────────────────────────────────────────────────
  if (screen === "login") {
    return (
      <div style={S.app}>
        {ErrorToast}{LoadingOverlay}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: brand, padding: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><BucketIcon size={42} color="white" /></div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "white", marginBottom: 4 }}>Tin Collections</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 40 }}>CharityOS</div>
          <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={{ ...S.loginInput, background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.25)", color: "white" }} placeholder="Email" />
          <input value={loginPass} onChange={e => setLoginPass(e.target.value)} style={{ ...S.loginInput, background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.25)", color: "white" }} type="password" placeholder="Password" />
          <button onClick={() => doLogin(loginEmail, loginPass)} disabled={loading} style={{ width: "100%", maxWidth: 320, padding: "20px 0", fontSize: 22, fontWeight: 800, borderRadius: 18, border: "none", background: "white", color: brand, cursor: "pointer", marginTop: 8, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <button onClick={() => { setBrand(null); try { localStorage.removeItem("tc_brand"); } catch {} }} style={{ marginTop: 20, fontSize: 14, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer" }}>Change colour</button>
        </div>
      </div>
    );
  }

  // ─── HOME (Dashboard) ─────────────────────────────────────────
  if (screen === "home") {
    return (
      <div style={S.app}>
        {ErrorToast}{LoadingOverlay}
        {/* Header */}
        <div style={{ background: brand, color: "white", padding: "24px 24px 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><BucketIcon size={24} color="white" /></div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Tin Collections</div>
            </div>
            <button onClick={doLogout} style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>Hey {userName}!</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 16, overflow: "auto" }}>

          {/* ── In-Progress Runs ─────────────────────────────── */}
          {inProgressRuns.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingLeft: 4 }}>In Progress</div>
              {inProgressRuns.map(run => {
                const totalStops = run.runStops.length;
                const doneStops = run.runStops.filter(rs => rs.status !== "PENDING").length;
                const runPct = totalStops > 0 ? Math.round((doneStops / totalStops) * 100) : 0;
                return (
                  <div key={run.id} style={{ background: "white", borderRadius: 20, padding: 20, border: `2px solid ${brand}`, boxShadow: `0 2px 16px ${brand}20`, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: brand, flexShrink: 0 }} />
                      <div style={{ fontSize: 12, fontWeight: 800, color: brand, textTransform: "uppercase", letterSpacing: 0.5 }}>Live</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>{run.route.name}</div>
                    <div style={{ fontSize: 14, color: "#888", marginBottom: 12 }}>{doneStops} of {totalStops} stops completed</div>
                    <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, marginBottom: 16 }}>
                      <div style={{ height: "100%", width: `${runPct}%`, background: brand, borderRadius: 4, transition: "width 0.3s" }} />
                    </div>
                    <button onClick={() => selectRun(run)} style={{ width: "100%", padding: "16px 0", fontSize: 18, fontWeight: 900, borderRadius: 16, border: "none", background: brand, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <PlayIcon size={16} /> Continue Collection
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Upcoming Runs ────────────────────────────────── */}
          {upcomingRuns.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingLeft: 4 }}>Upcoming</div>
              {upcomingRuns.map(run => {
                const totalStops = run.runStops.length;
                return (
                  <div key={run.id} style={{ background: "white", borderRadius: 18, padding: 18, border: "1.5px solid #e5e7eb", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 4 }}>{run.route.name}</div>
                      <div style={{ fontSize: 14, color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
                        <CalendarIcon size={14} color="#aaa" />
                        {run.scheduledDate ? formatDate(run.scheduledDate) : "Unscheduled"}
                        <span style={{ margin: "0 4px" }}>·</span>
                        {totalStops} stops
                      </div>
                    </div>
                    <button onClick={() => selectRun(run)} style={{
                      width: "100%", padding: "14px 0", fontSize: 17, fontWeight: 800, borderRadius: 14,
                      border: `2px solid ${brand}`, background: brandLight, color: brand, cursor: "pointer", marginTop: 14,
                    }}>
                      Start Collection
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {inProgressRuns.length === 0 && upcomingRuns.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No collections scheduled</div>
              <div style={{ fontSize: 15, color: "#bbb" }}>Your upcoming runs will appear here</div>
            </div>
          )}

          <button onClick={() => fetchRuns(token)} style={{ padding: "12px 0", fontSize: 15, fontWeight: 700, borderRadius: 12, border: `1.5px solid ${brand}30`, background: brandLight, color: brand, cursor: "pointer" }}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // ─── DONE ──────────────────────────────────────────────────────
  if (screen === "done") {
    return (
      <div style={S.app}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f0fdf4", padding: 32 }}>
          <div style={{ fontSize: 80 }}>🎉</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#14532d", marginTop: 16 }}>All Done!</div>
          <div style={{ fontSize: 18, color: "#166534", marginTop: 8 }}>{done.length} of {stops.length} stops completed</div>
          <div style={{ fontSize: 16, color: "#16a34a", marginTop: 16 }}>Head back to base to count tins</div>
          <button onClick={() => { fetchRuns(token); setScreen("home"); }} style={{ marginTop: 40, width: "100%", maxWidth: 300, padding: "20px 0", fontSize: 22, fontWeight: 800, borderRadius: 20, border: "none", background: "#16a34a", color: "white", cursor: "pointer" }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ─── STOPS LIST ────────────────────────────────────────────────
  if (screen === "stops") {
    return (
      <div style={S.app}>
        <div style={{ background: brand, color: "white", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => setScreen("collect")} style={{ fontSize: 18, fontWeight: 700, color: "white", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{done.length}/{stops.length}</div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
          {stops.map((s, i) => (
            <button key={s.id} onClick={() => { if (s.status === "PENDING") { setIdx(i); setScreen("collect"); } }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14, padding: 16, marginBottom: 8,
              borderRadius: 18, border: i === idx ? `2px solid ${brand}` : "1px solid #e5e7eb",
              background: s.status === "COMPLETED" ? "#f0fdf4" : s.status === "SKIPPED" ? "#fefce8" : i === idx ? brandLight : "white",
              cursor: s.status === "PENDING" ? "pointer" : "default", textAlign: "left", boxSizing: "border-box",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "white", flexShrink: 0, background: s.status === "COMPLETED" ? "#16a34a" : s.status === "SKIPPED" ? "#eab308" : i === idx ? brand : "#d1d5db" }}>
                {s.status === "COMPLETED" ? "✓" : s.status === "SKIPPED" ? "—" : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.status !== "PENDING" ? "#999" : "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ fontSize: 14, color: "#aaa", marginTop: 2 }}>{s.address}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── SKIP ──────────────────────────────────────────────────────
  if (screen === "skip") {
    return (
      <div style={S.app}>
        {LoadingOverlay}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fffbeb", padding: 32 }}>
          <div style={{ fontSize: 56 }}>⏭️</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#92400e", marginTop: 12 }}>Skip this stop?</div>
          <div style={{ fontSize: 17, color: "#b45309", marginTop: 8, textAlign: "center" }}>{stop?.name}</div>
          <input value={skipReason} onChange={e => setSkipReason(e.target.value)} placeholder="Reason (optional)" style={{ width: "100%", maxWidth: 320, padding: "16px 18px", fontSize: 18, borderRadius: 16, border: "2px solid #fcd34d", outline: "none", marginTop: 24, boxSizing: "border-box", textAlign: "center" }} />
          <button onClick={skipStop} style={{ width: "100%", maxWidth: 320, padding: "20px 0", fontSize: 22, fontWeight: 800, borderRadius: 20, border: "none", background: "#d97706", color: "white", cursor: "pointer", marginTop: 16 }}>Skip</button>
          <button onClick={() => setScreen("collect")} style={{ marginTop: 14, fontSize: 17, color: "#92400e", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
        </div>
      </div>
    );
  }

  // ─── COLLECTION (main stop screen) ─────────────────────────────
  return (
    <div style={S.app}>
      {ErrorToast}{LoadingOverlay}
      <div style={{ background: brand, color: "white", padding: "14px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button onClick={() => setScreen("home")} style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Home</button>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Stop {idx + 1} of {stops.length}</div>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "white", borderRadius: 3, transition: "width 0.3s" }} />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "14px 16px 16px", gap: 10, overflow: "hidden" }}>
        <div style={{ background: "white", borderRadius: 20, padding: "18px 20px", flexShrink: 0, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#111", lineHeight: 1.15 }}>{stop?.name}</div>
          <div style={{ fontSize: 15, color: "#888", marginTop: 4 }}>{stop?.address}</div>
          {(stop?.parking || stop?.access) && (
            <div style={{ fontSize: 14, color: "#ea580c", fontWeight: 600, marginTop: 8 }}>
              {stop?.parking && `🅿️ ${stop.parking}`}{stop?.parking && stop?.access && "  ·  "}{stop?.access && `🚪 ${stop.access}`}
            </div>
          )}
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes about this pickup..." style={{ flex: 1, marginTop: 12, padding: "14px 16px", fontSize: 16, fontFamily: "inherit", borderRadius: 14, border: "2px solid #e5e7eb", outline: "none", boxSizing: "border-box", resize: "none", color: "#333", background: "#f9fafb", minHeight: 60 }} />
        </div>

        <button onClick={() => openNavigation(stop?.address)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: brand, color: "white", fontSize: 20, fontWeight: 800, padding: "16px 0", borderRadius: 16, border: "none", cursor: "pointer", flexShrink: 0 }}>
          📍 Navigate
        </button>

        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Collect Tin</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={collectTin} onChange={e => setCollectTin(e.target.value)} placeholder="Scan or enter tin #" style={{ flex: 1, minWidth: 0, padding: "16px 14px", fontSize: 22, fontFamily: "monospace", fontWeight: 700, borderRadius: 16, border: "2px solid #d1d5db", outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => setScanning("collect")} style={{ width: 60, background: brand, color: "white", borderRadius: 16, border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CameraIcon />
            </button>
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Leave Tin</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={deployTin} onChange={e => setDeployTin(e.target.value)} placeholder="Scan or enter tin #" style={{ flex: 1, minWidth: 0, padding: "16px 14px", fontSize: 22, fontFamily: "monospace", fontWeight: 700, borderRadius: 16, border: "2px solid #d1d5db", outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => setScanning("deploy")} style={{ width: 60, background: brand, color: "white", borderRadius: 16, border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CameraIcon />
            </button>
          </div>
        </div>

        <button onClick={completeStop} disabled={!collectTin.trim() || !deployTin.trim() || loading} style={{
          width: "100%", padding: "22px 0", fontSize: 24, fontWeight: 900, borderRadius: 20,
          border: "none", cursor: (collectTin.trim() && deployTin.trim()) ? "pointer" : "default",
          background: (collectTin.trim() && deployTin.trim()) ? "#16a34a" : "#d1d5db",
          color: "white", flexShrink: 0,
          boxShadow: (collectTin.trim() && deployTin.trim()) ? "0 6px 20px rgba(22,163,74,0.3)" : "none",
          transition: "background 0.2s, box-shadow 0.2s",
        }}>
          {loading ? "Saving..." : (collectTin.trim() && deployTin.trim()) ? "Complete Stop" : !collectTin.trim() && !deployTin.trim() ? "Enter both tin numbers" : !collectTin.trim() ? "Enter collect tin" : "Enter leave tin"}
        </button>

        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={() => setScreen("skip")} style={{ flex: 1, padding: "14px 0", fontSize: 16, fontWeight: 700, borderRadius: 14, border: "2px solid #fcd34d", background: "#fffbeb", color: "#92400e", cursor: "pointer" }}>Skip</button>
          <button onClick={() => setScreen("stops")} style={{ flex: 1, padding: "14px 0", fontSize: 16, fontWeight: 700, borderRadius: 14, border: `2px solid ${brand}30`, background: brandLight, color: brand, cursor: "pointer" }}>All Stops</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  app: { width: "100%", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f3f4f6" },
  loginInput: { width: "100%", maxWidth: 320, padding: "18px 20px", fontSize: 18, borderRadius: 16, border: "2px solid #d1d5db", outline: "none", marginBottom: 12, boxSizing: "border-box" },
};
