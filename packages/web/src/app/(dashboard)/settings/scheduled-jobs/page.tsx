"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Power,
} from "lucide-react";
import { formatDistance } from "date-fns";

interface JobWithHistory {
  id: string;
  name: string;
  type: string;
  description: string | null;
  schedule: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunDuration: number | null;
  nextRunAt: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastRun: {
    id: string;
    jobId: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    duration: number | null;
    result: Record<string, unknown> | null;
    error: string | null;
  } | null;
}

export default function ScheduledJobsPage() {
  const [jobs, setJobs] = useState<JobWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/scheduled-jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunJob = async (jobId: string) => {
    setRunningJobId(jobId);
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}/run`, {
        method: "POST",
      });

      if (response.ok) {
        await fetchJobs();
      } else {
        alert("Failed to run job");
      }
    } catch (error) {
      console.error("Error running job:", error);
      alert("Error running job");
    } finally {
      setRunningJobId(null);
    }
  };

  const handleToggleActive = async (jobId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchJobs();
      } else {
        alert("Failed to toggle job status");
      }
    } catch (error) {
      console.error("Error toggling job status:", error);
      alert("Error toggling job status");
    }
  };

  const handleScheduleChange = async (
    jobId: string,
    newSchedule: string
  ) => {
    try {
      const response = await fetch(`/api/scheduled-jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: newSchedule || null }),
      });

      if (response.ok) {
        await fetchJobs();
      } else {
        alert("Failed to update schedule");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Error updating schedule");
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "SUCCESS":
        return (
          <CheckCircle className="h-4 w-4 text-green-600" />
        );
      case "FAILED":
      case "ERROR":
        return (
          <AlertCircle className="h-4 w-4 text-red-600" />
        );
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string | null): string => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-50 border-green-200";
      case "FAILED":
      case "ERROR":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Jobs</h1>
          <p className="text-gray-500 mt-1">
            Manage automated tasks and view execution history
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Loading scheduled jobs...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Jobs</h1>
          <p className="text-gray-500 mt-1">
            Manage automated tasks and view execution history
          </p>
        </div>
        <Button
          onClick={fetchJobs}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No scheduled jobs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className={`border-l-4 ${
                job.isActive ? "border-l-indigo-600" : "border-l-gray-300"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div>
                      <CardTitle className="text-lg">{job.name}</CardTitle>
                      {job.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {job.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleToggleActive(job.id, job.isActive)}
                      variant="outline"
                      size="sm"
                      className={
                        job.isActive ? "text-indigo-600" : "text-gray-400"
                      }
                      title={
                        job.isActive
                          ? "Click to disable"
                          : "Click to enable"
                      }
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleRunJob(job.id)}
                      disabled={runningJobId === job.id}
                      size="sm"
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {runningJobId === job.id ? "Running..." : "Run Now"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Schedule */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Schedule (Cron)
                    </label>
                    <input
                      type="text"
                      value={job.schedule || ""}
                      onChange={(e) =>
                        handleScheduleChange(job.id, e.target.value)
                      }
                      placeholder="0 9 * * * (9 AM daily)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      e.g., "0 9 * * *" for 9 AM daily
                    </p>
                  </div>

                  {/* Last Run Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Last Run Status
                    </label>
                    <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50">
                      {getStatusIcon(job.lastRunStatus)}
                      <span className="text-sm font-medium text-gray-900">
                        {job.lastRunStatus || "Never Run"}
                      </span>
                    </div>
                    {job.lastRunAt && (
                      <p className="text-xs text-gray-500">
                        {formatDistance(
                          new Date(job.lastRunAt),
                          new Date(),
                          { addSuffix: true }
                        )}
                      </p>
                    )}
                  </div>

                  {/* Last Run Duration */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Last Duration
                    </label>
                    <div className="p-2 rounded border border-gray-200 bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">
                        {job.lastRunDuration !== null
                          ? `${job.lastRunDuration}ms`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last Run Details */}
                {job.lastRun && (
                  <button
                    onClick={() =>
                      setExpandedJobId(
                        expandedJobId === job.id ? null : job.id
                      )
                    }
                    className="text-sm text-indigo-600 hover:text-indigo-700 mb-4"
                  >
                    {expandedJobId === job.id
                      ? "Hide Details"
                      : "Show Details"}
                  </button>
                )}

                {expandedJobId === job.id && job.lastRun && (
                  <div
                    className={`p-4 rounded border ${getStatusColor(
                      job.lastRun.status
                    )}`}
                  >
                    <h4 className="font-medium text-sm text-gray-900 mb-2">
                      Last Run Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-gray-900">
                          {job.lastRun.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-mono text-gray-900">
                          {new Date(job.lastRun.startedAt).toLocaleString()}
                        </span>
                      </div>
                      {job.lastRun.completedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-mono text-gray-900">
                            {new Date(job.lastRun.completedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {job.lastRun.duration && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-mono text-gray-900">
                            {job.lastRun.duration}ms
                          </span>
                        </div>
                      )}
                      {job.lastRun.error && (
                        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
                          <p className="text-xs font-medium text-red-900">
                            Error:
                          </p>
                          <p className="text-xs text-red-800 font-mono mt-1">
                            {job.lastRun.error}
                          </p>
                        </div>
                      )}
                      {job.lastRun.result && (
                        <div className="mt-3 p-2 bg-blue-100 border border-blue-200 rounded">
                          <p className="text-xs font-medium text-blue-900">
                            Result:
                          </p>
                          <pre className="text-xs text-blue-800 font-mono mt-1 overflow-auto max-h-40">
                            {JSON.stringify(job.lastRun.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-indigo-50 border border-indigo-100">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-indigo-900 mb-2">About Scheduled Jobs</h3>
          <ul className="text-sm text-indigo-800 space-y-1">
            <li>
              • Use cron expressions to schedule jobs (e.g., "0 9 * * *" for 9 AM daily)
            </li>
            <li>• Click "Run Now" to execute a job immediately</li>
            <li>• Enable/disable jobs using the toggle button</li>
            <li>• View detailed execution history for each job</li>
            <li>• Available jobs: Auto Renewal, Send Reminders, Email Marketing Sync, Webhook Processing, Report Generation, Token Cleanup</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
