"use client";

import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Run {
  id: string;
  status: string;
  scheduledDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  route: { name: string; description: string | null };
  assignedTo?: { contact: { firstName: string; lastName: string } } | null;
  runStops: { id: string; status: string }[];
}

interface Props {
  user: { name: string; role: string };
  activeRuns: Run[];
  completedRuns: Run[];
}

export function MobileHome({ user, activeRuns, completedRuns }: Props) {
  const router = useRouter();
  const firstName = user.name?.split(" ")[0] || "Volunteer";
  const allRuns = [...activeRuns, ...completedRuns];

  const getProgress = (run: Run) => {
    const total = run.runStops.length;
    const done = run.runStops.filter((s) => s.status === "COMPLETED" || s.status === "SKIPPED").length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#f3f4f6" }}>
      {/* Header */}
      <div style={{
        background: "#4f46e5",
        color: "white",
        padding: "calc(env(safe-area-inset-top, 16px) + 16px) 24px 24px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.2)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>TC</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>Tin Collections</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Parity CRM</div>
            </div>
          </div>
          <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/mobile/login"); }} style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", padding: "8px 12px", background: "none", border: "none", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>Hey {firstName}!</div>
        <div style={{ fontSize: 16, opacity: 0.7, marginTop: 4 }}>
          {activeRuns.length > 0 ? `${activeRuns.length} active run${activeRuns.length > 1 ? "s" : ""}` : "No runs right now"}
        </div>
      </div>

      {/* Scrollable run list - this is the ONLY scrollable area */}
      <div style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch", padding: "20px 20px 100px" }}>
        {allRuns.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: "20vh" }}>
            <div style={{ fontSize: 80 }}>📦</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#111", marginTop: 16 }}>No runs assigned</div>
            <div style={{ fontSize: 18, color: "#888", marginTop: 8, padding: "0 16px" }}>Check back soon or contact your coordinator.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activeRuns.map((run) => {
              const { done, total, pct } = getProgress(run);
              const isActive = run.status === "IN_PROGRESS";
              return (
                <Link key={run.id} href={`/mobile/route/${run.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    background: "white",
                    borderRadius: 24,
                    padding: 24,
                    border: isActive ? "3px solid #4f46e5" : "1px solid #e5e7eb",
                    boxShadow: isActive ? "0 4px 20px rgba(79,70,229,0.15)" : "0 1px 4px rgba(0,0,0,0.05)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#111", flex: 1 }}>{run.route.name}</div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        padding: "6px 14px",
                        borderRadius: 20,
                        background: isActive ? "#fef3c7" : "#dbeafe",
                        color: isActive ? "#92400e" : "#1e40af",
                        flexShrink: 0,
                        marginLeft: 12,
                      }}>
                        {isActive ? "Active" : "Scheduled"}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, color: "#666", marginBottom: 16 }}>
                      {total} stops{run.scheduledDate ? ` · ${formatDate(run.scheduledDate)}` : ""}
                    </div>
                    {isActive && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                          <span>{done} of {total}</span>
                          <span>{pct}%</span>
                        </div>
                        <div style={{ height: 14, background: "#e5e7eb", borderRadius: 7, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "#4f46e5", borderRadius: 7, transition: "width 0.3s" }} />
                        </div>
                      </div>
                    )}
                    <div style={{
                      background: "#4f46e5",
                      color: "white",
                      textAlign: "center",
                      padding: "16px 0",
                      borderRadius: 16,
                      fontSize: 20,
                      fontWeight: 800,
                    }}>
                      {isActive ? "Continue Collection →" : "View Route →"}
                    </div>
                  </div>
                </Link>
              );
            })}

            {completedRuns.map((run) => (
              <div key={run.id} style={{
                background: "white",
                borderRadius: 20,
                padding: 20,
                border: "1px solid #e5e7eb",
                opacity: 0.6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#555" }}>{run.route.name}</div>
                  <div style={{ fontSize: 15, color: "#999", marginTop: 4 }}>{run.runStops.length} stops{run.completedAt ? ` · ${formatDate(run.completedAt)}` : ""}</div>
                </div>
                <div style={{ fontSize: 28, color: "#22c55e" }}>✓</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed bottom nav */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "white",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-around",
        padding: "12px 0",
        paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 12px)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#4f46e5", padding: "4px 24px" }}>
          <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>Home</span>
        </div>
        <button onClick={() => router.refresh()} style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#9ca3af", padding: "4px 24px", background: "none", border: "none", cursor: "pointer" }}>
          <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <span style={{ fontSize: 12, marginTop: 2 }}>Refresh</span>
        </button>
      </div>
    </div>
  );
}
