"use client";

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

  const inProgressRuns = activeRuns.filter((r) => r.status === "IN_PROGRESS");
  const scheduledRuns = activeRuns.filter((r) => r.status === "SCHEDULED");

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getProgress = (run: Run) => {
    const total = run.runStops.length;
    const done = run.runStops.filter(
      (s) => s.status === "COMPLETED" || s.status === "SKIPPED"
    ).length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-24">
      {/* Header - big, bold, app-like */}
      <div className="bg-indigo-600 text-white px-6 pt-14 pb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold">CO</span>
            </div>
            <span className="text-lg font-bold">CharityOS</span>
          </div>
          <button
            className="text-indigo-200 text-base px-3 py-2 rounded-lg active:bg-white/10"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/mobile/login");
            }}
          >
            Sign out
          </button>
        </div>
        <p className="text-indigo-100 text-2xl font-semibold mt-4">Hey {firstName}!</p>
        <p className="text-indigo-200 text-base mt-1">
          {activeRuns.length > 0
            ? `You have ${activeRuns.length} active run${activeRuns.length > 1 ? "s" : ""}`
            : "No runs assigned right now"}
        </p>
      </div>

      <div className="px-5 py-6 space-y-8">
        {/* In Progress - show prominently */}
        {inProgressRuns.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4">
              In Progress
            </h2>
            {inProgressRuns.map((run) => {
              const { done, total, pct } = getProgress(run);
              return (
                <Link
                  key={run.id}
                  href={`/mobile/route/${run.id}`}
                  className="block mb-4"
                >
                  <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-500 p-6 active:scale-[0.98] transition-transform">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {run.route.name}
                        </h3>
                        {run.startedAt && (
                          <p className="text-base text-gray-500 mt-1">
                            Started {formatDate(run.startedAt)}
                          </p>
                        )}
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1.5 rounded-full">
                        Active
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-base text-gray-600 mb-2">
                        <span className="font-medium">
                          {done} of {total} stops
                        </span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-indigo-500 h-4 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-indigo-600 text-white text-center py-3.5 rounded-xl mt-4">
                      <span className="font-bold text-lg">
                        Continue Collection
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Scheduled runs */}
        {scheduledRuns.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4">
              Upcoming Runs
            </h2>
            <div className="space-y-4">
              {scheduledRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/mobile/route/${run.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 active:scale-[0.98] transition-transform">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {run.route.name}
                        </h3>
                        <p className="text-base text-gray-500 mt-1">
                          {run.runStops.length} stops
                          {run.scheduledDate &&
                            ` · ${formatDate(run.scheduledDate)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1.5 rounded-full">
                          Scheduled
                        </span>
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {activeRuns.length === 0 && (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No runs assigned
            </h2>
            <p className="text-lg text-gray-500 px-4">
              You don&apos;t have any collection runs scheduled yet. Check back
              soon or contact your coordinator.
            </p>
          </div>
        )}

        {/* Recent completions */}
        {completedRuns.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4">
              Recently Completed
            </h2>
            <div className="space-y-3">
              {completedRuns.map((run) => (
                <div
                  key={run.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 opacity-70"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-700">
                        {run.route.name}
                      </h3>
                      <p className="text-base text-gray-400 mt-1">
                        {run.runStops.length} stops · Completed{" "}
                        {formatDate(run.completedAt)}
                      </p>
                    </div>
                    <span className="text-green-500 text-2xl">✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 safe-area-pb" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
        <div className="flex justify-around py-3">
          <div className="flex flex-col items-center text-indigo-600 px-6 py-1">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm font-semibold mt-1">Home</span>
          </div>
          <button
            onClick={() => router.refresh()}
            className="flex flex-col items-center text-gray-400 px-6 py-1 active:text-gray-600"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm mt-1">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
