"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Play, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, Shield, Wrench } from "lucide-react";

type TestResult = {
  name: string;
  category: string;
  status: "PASS" | "FAIL" | "SKIP";
  detail: string;
  durationMs: number;
};

type TestReport = {
  summary: { total: number; passed: number; failed: number; skipped: number; durationMs: number };
  results: TestResult[];
  timestamp: string;
};

export default function TestAgentClient() {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<TestReport[]>([]);
  const [fixing, setFixing] = useState(false);
  const [fixResults, setFixResults] = useState<Array<{ name: string; status: string; detail: string }>>([]);

  const runTests = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/test-agent", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setReport(data);
        setHistory((prev) => [data, ...prev].slice(0, 10));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const failedTests = report ? report.results.filter((r) => r.status === "FAIL").map((r) => r.name) : [];

  const runFixes = async () => {
    setFixing(true);
    setFixResults([]);
    try {
      const res = await fetch("/api/test-agent/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testNames: failedTests }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setFixResults(data.fixes || []);
        // Auto re-run tests after fixes
        setTimeout(() => runTests(), 500);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFixing(false);
    }
  };

  // Group results by category
  const grouped = report
    ? report.results.reduce<Record<string, TestResult[]>>((acc, r) => {
        if (!acc[r.category]) acc[r.category] = [];
        acc[r.category].push(r);
        return acc;
      }, {})
    : {};

  const passRate = report ? Math.round((report.summary.passed / report.summary.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Test Agent</h1>
          <p className="text-gray-500 mt-1">
            Automated testing of all data entry flows and system integrity
          </p>
        </div>
      </div>

      {/* Run button and status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900">Run All Tests</p>
              <p className="text-sm text-gray-500">
                Creates test data, verifies all CRUD operations, checks integrity, then cleans up
              </p>
            </div>
          </div>
          <Button onClick={runTests} disabled={running} size="lg">
            {running ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Running tests...</>
            ) : (
              <><Play className="h-5 w-5 mr-2" /> Run Tests</>
            )}
          </Button>
        </div>

        {running && (
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                <Shield className="h-4 w-4 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-900">Testing in progress...</p>
                <p className="text-xs text-indigo-600">Creating test data, running checks, cleaning up</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </Card>

      {/* Results summary */}
      {report && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{report.summary.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total Tests</p>
            </Card>
            <Card className={`p-4 text-center ${report.summary.failed === 0 ? "bg-green-50 border-green-200" : ""}`}>
              <p className="text-3xl font-bold text-green-600">{report.summary.passed}</p>
              <p className="text-xs text-gray-500 mt-1">Passed</p>
            </Card>
            <Card className={`p-4 text-center ${report.summary.failed > 0 ? "bg-red-50 border-red-200" : ""}`}>
              <p className="text-3xl font-bold text-red-600">{report.summary.failed}</p>
              <p className="text-xs text-gray-500 mt-1">Failed</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{passRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Pass Rate</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{(report.summary.durationMs / 1000).toFixed(1)}s</p>
              <p className="text-xs text-gray-500 mt-1">Duration</p>
            </Card>
          </div>

          {/* Overall progress bar */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Test Suite Health</p>
              <p className="text-sm text-gray-500">
                {new Date(report.timestamp).toLocaleString("en-GB")}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className="flex h-4">
                <div
                  className="bg-green-500 h-4 transition-all"
                  style={{ width: `${(report.summary.passed / report.summary.total) * 100}%` }}
                />
                <div
                  className="bg-red-500 h-4 transition-all"
                  style={{ width: `${(report.summary.failed / report.summary.total) * 100}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Fix button when there are failures */}
          {failedTests.length > 0 && (
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">{failedTests.length} test{failedTests.length > 1 ? "s" : ""} failed</p>
                    <p className="text-sm text-red-700">
                      Auto-fix will attempt to repair data inconsistencies such as campaign totals and orphaned references.
                    </p>
                  </div>
                </div>
                <Button onClick={runFixes} disabled={fixing || running} variant="destructive">
                  {fixing ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Fixing...</>
                  ) : (
                    <><Wrench className="h-4 w-4 mr-2" /> Auto-Fix {failedTests.length} Issue{failedTests.length > 1 ? "s" : ""}</>
                  )}
                </Button>
              </div>
              {fixResults.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200 space-y-2">
                  {fixResults.map((fix, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {fix.status === "FIXED" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : fix.status === "SKIPPED" ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className={fix.status === "FIXED" ? "text-green-800" : "text-red-800"}>
                        {fix.name}: {fix.detail}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Results by category */}
          {Object.entries(grouped).map(([category, tests]) => {
            const catPassed = tests.filter((t) => t.status === "PASS").length;
            const catFailed = tests.filter((t) => t.status === "FAIL").length;

            return (
              <Card key={category} className="overflow-hidden">
                <div className={`px-6 py-3 flex items-center justify-between ${catFailed > 0 ? "bg-red-50" : "bg-green-50"}`}>
                  <div className="flex items-center gap-2">
                    {catFailed > 0 ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                  </div>
                  <Badge className={catFailed > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {catPassed}/{tests.length} passed
                  </Badge>
                </div>
                <div className="divide-y divide-gray-50">
                  {tests.map((test, i) => (
                    <div key={i} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {test.status === "PASS" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : test.status === "FAIL" ? (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{test.name}</p>
                          <p className={`text-xs truncate ${test.status === "FAIL" ? "text-red-600" : "text-gray-500"}`}>
                            {test.detail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {test.durationMs}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </>
      )}

      {/* Run history */}
      {history.length > 1 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Run History</h3>
          <div className="space-y-2">
            {history.map((run, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  {run.summary.failed === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">
                    {new Date(run.timestamp).toLocaleString("en-GB")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-600">{run.summary.passed} passed</span>
                  {run.summary.failed > 0 && (
                    <span className="text-xs text-red-600">{run.summary.failed} failed</span>
                  )}
                  <span className="text-xs text-gray-400">{(run.summary.durationMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
