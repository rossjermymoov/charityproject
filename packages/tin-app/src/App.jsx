import { useState, useEffect, useRef, useCallback } from "react";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

// ─── Mock Data ───────────────────────────────────────────────────
const MOCK_STOPS = [
  { id: "s1", name: "Premier Stores", address: "Whittington Rd, SY11 4AA", status: "PENDING", parking: "On street", access: null },
  { id: "s2", name: "Co-op Gobowen", address: "St Martins Rd, SY11 3EP", status: "PENDING", parking: null, access: "Ask at counter" },
  { id: "s3", name: "Spar Oswestry", address: "Church St, SY11 2SP", status: "PENDING", parking: "Car park behind", access: null },
  { id: "s4", name: "Tesco Express", address: "Salop Rd, SY11 2NR", status: "PENDING", parking: "Customer car park", access: null },
  { id: "s5", name: "Post Office", address: "Station Rd, SY11 4DA", status: "PENDING", parking: null, access: "Side entrance" },
];

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
        // Fallback: prompt for manual entry
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
    // For now, use a simple approach: take photo and let user confirm
    // In production this would use a barcode detection library
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

      // Try BarcodeDetector API (available on Android Chrome/WebView)
      if ("BarcodeDetector" in window) {
        const detector = new BarcodeDetector();
        detector.detect(canvas).then(barcodes => {
          if (barcodes.length > 0) {
            onScan(barcodes[0].rawValue);
          } else {
            const code = prompt("No barcode detected. Enter manually:");
            if (code) onScan(code);
          }
        }).catch(() => {
          const code = prompt("Scan failed. Enter manually:");
          if (code) onScan(code);
        });
      } else {
        // Fallback for devices without BarcodeDetector
        const code = prompt("Enter barcode number:");
        if (code) onScan(code);
      }
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} playsInline muted />
        {/* Scan overlay */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "75%", height: 200, border: "3px solid white", borderRadius: 16, boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
        </div>
        <div style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center", color: "white", fontSize: 18, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
          Point camera at barcode
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, padding: 16, background: "#000", flexShrink: 0 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "18px 0", fontSize: 20, fontWeight: 800, borderRadius: 16, border: "2px solid #666", background: "transparent", color: "white", cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={captureAndRead} style={{ flex: 1, padding: "18px 0", fontSize: 20, fontWeight: 800, borderRadius: 16, border: "none", background: brand || "#0d9488", color: "white", cursor: "pointer" }}>
          Capture
        </button>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────
export default function TinCollectionsApp() {
  const [brand, setBrand] = useState(null);
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState("");
  const [stops, setStops] = useState(MOCK_STOPS.map(s => ({ ...s })));
  const [idx, setIdx] = useState(0);
  const [deployTin, setDeployTin] = useState("");
  const [collectTin, setCollectTin] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [notes, setNotes] = useState("");
  const [scanning, setScanning] = useState(null); // "collect" | "deploy" | null
  const screenRef = useRef(screen);

  // Keep ref in sync for back button handler
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // ─── Android hardware back button handling ──────────────────────
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

  const brandDark = brand ? darken(brand, 15) : "#000";
  const brandLight = brand ? lighten(brand, 92) : "#fff";
  const pending = stops.filter(s => s.status === "PENDING");
  const done = stops.filter(s => s.status !== "PENDING");
  const pct = stops.length > 0 ? Math.round((done.length / stops.length) * 100) : 0;
  const stop = stops[idx];

  function darken(hex, pct) {
    const [r, g, b] = hexToRgb(hex);
    const f = 1 - pct / 100;
    return rgbToHex(Math.round(r * f), Math.round(g * f), Math.round(b * f));
  }
  function lighten(hex, pct) {
    const [r, g, b] = hexToRgb(hex);
    const f = pct / 100;
    return rgbToHex(Math.round(r + (255 - r) * f), Math.round(g + (255 - g) * f), Math.round(b + (255 - b) * f));
  }
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
  }

  // ─── Navigate to address in Google Maps ─────────────────────────
  async function openNavigation(address) {
    const encoded = encodeURIComponent(address);
    // Try native Google Maps intent first, fall back to browser
    try {
      await Browser.open({ url: `https://www.google.com/maps/search/?api=1&query=${encoded}` });
    } catch {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
    }
  }

  // ─── Handle barcode scan result ─────────────────────────────────
  function handleScan(code) {
    if (scanning === "collect") setCollectTin(code);
    else if (scanning === "deploy") setDeployTin(code);
    setScanning(null);
  }

  function completeStop() {
    const next = [...stops];
    next[idx] = { ...next[idx], status: "COMPLETED" };
    setStops(next);
    setDeployTin(""); setCollectTin(""); setNotes("");
    const ni = next.findIndex((s, i) => i > idx && s.status === "PENDING");
    if (ni >= 0) setIdx(ni);
    else setScreen("done");
  }

  function skipStop() {
    const next = [...stops];
    next[idx] = { ...next[idx], status: "SKIPPED" };
    setStops(next);
    setSkipReason("");
    const ni = next.findIndex((s, i) => i > idx && s.status === "PENDING");
    if (ni >= 0) { setIdx(ni); setScreen("collect"); }
    else setScreen("done");
  }

  // ─── SCANNER OVERLAY ──────────────────────────────────────────
  if (scanning) {
    return <BarcodeScanner brand={brand} onScan={handleScan} onClose={() => setScanning(null)} />;
  }

  // ─── SETUP SCREEN (first launch) ──────────────────────────────
  if (!brand) {
    return (
      <div style={S.app}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, background: "#f8fafc" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#475569", marginBottom: 20 }}>TC</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#111", marginBottom: 6 }}>Welcome</div>
          <div style={{ fontSize: 16, color: "#666", marginBottom: 32, textAlign: "center" }}>Pick your charity&apos;s brand colour</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, width: "100%", maxWidth: 300, marginBottom: 32 }}>
            {PRESETS.map(p => (
              <button key={p.color} onClick={() => setBrand(p.color)} style={{
                width: "100%", aspectRatio: "1", borderRadius: 20, background: p.color, border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, gap: 2,
              }}>
                {p.name}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 14, color: "#999", marginBottom: 10 }}>Or enter a hex code</div>
          <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 260 }}>
            <input id="hex-input" defaultValue="#0d9488" style={{ flex: 1, padding: "14px 16px", fontSize: 18, fontFamily: "monospace", borderRadius: 14, border: "2px solid #d1d5db", outline: "none", textAlign: "center", boxSizing: "border-box" }} />
            <button onClick={() => { const v = document.getElementById("hex-input").value; if (/^#[0-9a-fA-F]{6}$/.test(v)) setBrand(v); }} style={{ padding: "14px 20px", fontSize: 16, fontWeight: 800, borderRadius: 14, border: "none", background: "#111", color: "white", cursor: "pointer" }}>Go</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOGIN ─────────────────────────────────────────────────────
  if (screen === "login") {
    return (
      <div style={S.app}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: brand, padding: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: "white", marginBottom: 20 }}>TC</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "white", marginBottom: 4 }}>Tin Collections</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 40 }}>CharityOS</div>
          <input style={{ ...S.loginInput, background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.25)", color: "white" }} placeholder="Email" defaultValue="admin@charity.org" />
          <input style={{ ...S.loginInput, background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.25)", color: "white" }} type="password" placeholder="Password" defaultValue="password" />
          <button onClick={() => { setUser("Ross"); setScreen("home"); }} style={{ width: "100%", maxWidth: 320, padding: "20px 0", fontSize: 22, fontWeight: 800, borderRadius: 18, border: "none", background: "white", color: brand, cursor: "pointer", marginTop: 8 }}>
            Sign In
          </button>
          <button onClick={() => setBrand(null)} style={{ marginTop: 20, fontSize: 14, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer" }}>Change colour</button>
        </div>
      </div>
    );
  }

  // ─── HOME ──────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <div style={S.app}>
        <div style={{ background: brand, color: "white", padding: "24px 24px 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900 }}>TC</div>
              <div><div style={{ fontSize: 17, fontWeight: 800 }}>Tin Collections</div></div>
            </div>
            <button onClick={() => setScreen("login")} style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>Hey {user}!</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20, gap: 16 }}>
          <div style={{ background: "white", borderRadius: 24, padding: 24, border: `2px solid ${brand}20`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", flex: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 4 }}>Route from SY11 4FN</div>
            <div style={{ fontSize: 16, color: "#888", marginBottom: 16 }}>{stops.length} stops · Thu 2 Apr</div>
            {done.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                  <span>{done.length} of {stops.length}</span><span>{pct}%</span>
                </div>
                <div style={{ height: 10, background: "#e5e7eb", borderRadius: 5 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: brand, borderRadius: 5, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <button onClick={() => { setIdx(stops.findIndex(s => s.status === "PENDING") || 0); setScreen("collect"); }} style={{
            width: "100%", padding: "24px 0", fontSize: 24, fontWeight: 900, borderRadius: 20, border: "none",
            background: brand, color: "white", cursor: "pointer", boxShadow: `0 4px 16px ${brand}40`,
          }}>
            {done.length > 0 ? "Continue Collection" : "Start Collection"}
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
          <button onClick={() => setScreen("home")} style={{ marginTop: 40, width: "100%", maxWidth: 300, padding: "20px 0", fontSize: 22, fontWeight: 800, borderRadius: 20, border: "none", background: "#16a34a", color: "white", cursor: "pointer" }}>
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

  // ─── COLLECTION (main screen) ──────────────────────────────────
  return (
    <div style={S.app}>
      {/* Compact header */}
      <div style={{ background: brand, color: "white", padding: "14px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button onClick={() => setScreen("home")} style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Home</button>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Stop {idx + 1} of {stops.length}</div>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "white", borderRadius: 3, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Content fills screen */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "14px 16px 16px", gap: 10, overflow: "hidden" }}>
        {/* Location card — deeper with notes area */}
        <div style={{ background: "white", borderRadius: 20, padding: "18px 20px", flexShrink: 0, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#111", lineHeight: 1.15 }}>{stop?.name}</div>
          <div style={{ fontSize: 15, color: "#888", marginTop: 4 }}>{stop?.address}</div>
          {(stop?.parking || stop?.access) && (
            <div style={{ fontSize: 14, color: "#ea580c", fontWeight: 600, marginTop: 8 }}>
              {stop?.parking && `🅿️ ${stop.parking}`}{stop?.parking && stop?.access && "  ·  "}{stop?.access && `🚪 ${stop.access}`}
            </div>
          )}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes about this pickup..."
            style={{
              flex: 1, marginTop: 12, padding: "14px 16px", fontSize: 16, fontFamily: "inherit",
              borderRadius: 14, border: "2px solid #e5e7eb", outline: "none", boxSizing: "border-box",
              resize: "none", color: "#333", background: "#f9fafb", minHeight: 60,
            }}
          />
        </div>

        {/* Navigate — opens Google Maps */}
        <button onClick={() => openNavigation(stop?.address)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: brand, color: "white", fontSize: 20, fontWeight: 800, padding: "16px 0", borderRadius: 16, border: "none", cursor: "pointer", flexShrink: 0 }}>
          📍 Navigate
        </button>

        {/* Collect Tin — full width */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Collect Tin</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={collectTin} onChange={e => setCollectTin(e.target.value)} placeholder="Scan or enter tin #" style={{ flex: 1, minWidth: 0, padding: "16px 14px", fontSize: 22, fontFamily: "monospace", fontWeight: 700, borderRadius: 16, border: "2px solid #d1d5db", outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => setScanning("collect")} style={{ width: 60, background: brand, color: "white", borderRadius: 16, border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          </div>
        </div>

        {/* Leave Tin — full width */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Leave Tin</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={deployTin} onChange={e => setDeployTin(e.target.value)} placeholder="Scan or enter tin #" style={{ flex: 1, minWidth: 0, padding: "16px 14px", fontSize: 22, fontFamily: "monospace", fontWeight: 700, borderRadius: 16, border: "2px solid #d1d5db", outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => setScanning("deploy")} style={{ width: 60, background: brand, color: "white", borderRadius: 16, border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          </div>
        </div>

        {/* COMPLETE — big green button, requires BOTH tins */}
        <button onClick={completeStop} disabled={!collectTin.trim() || !deployTin.trim()} style={{
          width: "100%", padding: "22px 0", fontSize: 24, fontWeight: 900, borderRadius: 20,
          border: "none", cursor: (collectTin.trim() && deployTin.trim()) ? "pointer" : "default",
          background: (collectTin.trim() && deployTin.trim()) ? "#16a34a" : "#d1d5db",
          color: "white", flexShrink: 0,
          boxShadow: (collectTin.trim() && deployTin.trim()) ? "0 6px 20px rgba(22,163,74,0.3)" : "none",
          transition: "background 0.2s, box-shadow 0.2s",
        }}>
          {(collectTin.trim() && deployTin.trim()) ? "Complete Stop" : !collectTin.trim() && !deployTin.trim() ? "Enter both tin numbers" : !collectTin.trim() ? "Enter collect tin" : "Enter leave tin"}
        </button>

        {/* Bottom row */}
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={() => setScreen("skip")} style={{ flex: 1, padding: "14px 0", fontSize: 16, fontWeight: 700, borderRadius: 14, border: "2px solid #fcd34d", background: "#fffbeb", color: "#92400e", cursor: "pointer" }}>
            Skip
          </button>
          <button onClick={() => setScreen("stops")} style={{ flex: 1, padding: "14px 0", fontSize: 16, fontWeight: 700, borderRadius: 14, border: `2px solid ${brand}30`, background: brandLight, color: brand, cursor: "pointer" }}>
            All Stops
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared base styles ──────────────────────────────────────────
const S = {
  app: { width: "100%", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f3f4f6" },
  loginInput: { width: "100%", maxWidth: 320, padding: "18px 20px", fontSize: 18, borderRadius: 16, border: "2px solid #d1d5db", outline: "none", marginBottom: 12, boxSizing: "border-box" },
};
