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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">CharityOS</h1>
          <Link
            href="/mobile/login"
            className="text-indigo-200 text-sm hover:text-white"
            onClick={async (e) => {
              e.preventDefault();
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/mobile/login");
            }}
          >
            Sign out
          </Link>
        </div>
        <p className="text-indigo-100 text-lg">Hey {firstName}!</p>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* In Progress - show prominently */}
        {inProgressRuns.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              In Progress
            </h2>
            {inProgressRuns.map((run) => {
              const { done, total, pct } = getProgress(run);
              return (
                <Link
                  key={run.id}
                  href={`/mobile/route/${run.id}`}
                  className="block mb-3"
                >
                  <div className="bg-white rounded-2xl shadow-sm border-2 border-indigo-500 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {run.route.name}
                        </h3>
                        {run.startedAt && (
                          <p className="text-sm text-gray-500">
                            Started {formatDate(run.startedAt)}
                          </p>
                        )}
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        In Progress
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>
                          {done} of {total} stops
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-indigo-500 h-3 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center mt-3">
                      <span className="text-indigo-600 font-semibold text-sm">
                        Continue Collection →
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
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Upcoming Runs
            </h2>
            <div className="space-y-3">
              {scheduledRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/mobile/route/${run.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {run.route.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {run.runStops.length} stops
                          {run.scheduledDate &&
                            ` · ${formatDate(run.scheduledDate)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Scheduled
                        </span>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
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
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No runs assigned
            </h2>
            <p className="text-gray-500">
              You don&apos;t have any collection runs scheduled yet. Check back
              soon or contact your coordinator.
            </p>
          </div>
        )}

        {/* Recent completions */}
        {completedRuns.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Recently Completed
            </h2>
            <div className="space-y-2">
              {completedRuns.map((run) => (
                <div
                  key={run.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-700">
                        {run.route.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {run.runStops.length} stops · Completed{" "}
                        {formatDate(run.completedAt)}
                      </p>
                    </div>
                    <span className="text-green-500">✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav hint */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-pb">
        <div className="flex justify-around">
          <div className="flex flex-col items-center text-indigo-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-medium mt-1">Home</span>
          </div>
          <button
            onClick={() => router.refresh()}
            className="flex flex-col items-center text-gray-400"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-xs mt-1">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
