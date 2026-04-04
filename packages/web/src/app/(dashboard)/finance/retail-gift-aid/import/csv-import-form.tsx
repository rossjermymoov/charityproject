"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  Download,
  Loader2,
} from "lucide-react";

interface CsvRow {
  [key: string]: string;
}

interface ParsedDonation {
  rowNumber: number;
  firstName: string;
  lastName: string;
  amount: number;
  date: string;
  rawName: string;
  matchedContactId: string | null;
  matchedContactName: string | null;
  matchStatus: "matched" | "multiple" | "unmatched" | "error";
  error?: string;
}

interface MatchResult {
  donations: ParsedDonation[];
  matched: number;
  unmatched: number;
  errors: number;
  totalAmount: number;
}

type Step = "upload" | "map" | "preview" | "importing" | "done";

export function CsvImportForm() {
  const [step, setStep] = useState<Step>("upload");
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  // Column mappings
  const [nameCol, setNameCol] = useState("");
  const [firstNameCol, setFirstNameCol] = useState("");
  const [lastNameCol, setLastNameCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [dateCol, setDateCol] = useState("");
  const [useSplitName, setUseSplitName] = useState(false);

  // Preview / results
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      setError("CSV must have a header row and at least one data row.");
      return;
    }

    // Parse header
    const headerLine = lines[0];
    const hdrs = parseCSVLine(headerLine);
    setHeaders(hdrs);

    // Auto-detect column mappings
    for (const h of hdrs) {
      const lower = h.toLowerCase().trim();
      if (lower.includes("first") && lower.includes("name")) setFirstNameCol(h);
      else if (lower.includes("last") && lower.includes("name")) setLastNameCol(h);
      else if (lower === "name" || lower === "donor" || lower === "donor name" || lower === "customer" || lower === "customer name") setNameCol(h);
      else if (lower.includes("amount") || lower.includes("total") || lower.includes("proceeds") || lower.includes("price") || lower.includes("sale")) setAmountCol(h);
      else if (lower.includes("date") || lower.includes("sold") || lower.includes("sale date")) setDateCol(h);
    }

    // Check if there are separate first/last name columns
    const hasFirstLast = hdrs.some(h => h.toLowerCase().includes("first")) && hdrs.some(h => h.toLowerCase().includes("last"));
    setUseSplitName(hasFirstLast);

    // Parse data rows
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseCSVLine(lines[i]);
      const row: CsvRow = {};
      hdrs.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }

    setCsvData(rows);
    setError("");
    setStep("map");
  }, []);

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function readFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  }

  async function handlePreview() {
    setLoading(true);
    setError("");

    try {
      // Build the donations array to send to the API for matching
      const donations = csvData.map((row, idx) => {
        let firstName = "";
        let lastName = "";

        if (useSplitName) {
          firstName = row[firstNameCol]?.trim() || "";
          lastName = row[lastNameCol]?.trim() || "";
        } else {
          const fullName = row[nameCol]?.trim() || "";
          const parts = fullName.split(/\s+/);
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ") || "";
        }

        const rawAmount = row[amountCol]?.replace(/[£$,]/g, "").trim() || "0";
        const amount = parseFloat(rawAmount);
        const date = row[dateCol]?.trim() || "";

        return { rowNumber: idx + 2, firstName, lastName, amount, date, rawName: useSplitName ? `${firstName} ${lastName}` : row[nameCol]?.trim() || "" };
      });

      const res = await fetch("/api/retail-gift-aid/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donations }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to preview import");
        return;
      }

      const result: MatchResult = await res.json();
      setMatchResult(result);
      setStep("preview");
    } catch {
      setError("Failed to preview import. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!matchResult) return;
    setStep("importing");
    setError("");

    try {
      const matched = matchResult.donations.filter((d) => d.matchStatus === "matched");
      const res = await fetch("/api/retail-gift-aid/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donations: matched }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to import donations");
        setStep("preview");
        return;
      }

      const result = await res.json();
      setImportResult(result);
      setStep("done");
    } catch {
      setError("Failed to import. Please try again.");
      setStep("preview");
    }
  }

  // Step 1: Upload
  if (step === "upload") {
    return (
      <Card>
        <CardContent className="p-8">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition-colors"
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your CSV file here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Upload a CSV export from your EPOS system
            </p>
            <label className="inline-block cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm">
                Choose File
              </span>
            </label>
          </div>

          {error && (
            <p className="mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Required CSV Columns</h3>
            <p className="text-sm text-gray-600">
              Based on the HMRC retail Gift Aid submission requirements, your CSV needs these columns:
            </p>
            <ul className="mt-2 text-sm text-gray-600 space-y-1 ml-4 list-disc">
              <li><strong>Donor name</strong> — full name or separate first/last name columns (must match a contact in the CRM with a retail Gift Aid declaration)</li>
              <li><strong>Sale amount</strong> — the net proceeds from the sale of donated goods (in GBP)</li>
              <li><strong>Sale date</strong> — when the goods were sold (DD/MM/YYYY or YYYY-MM-DD)</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              The donor&apos;s postcode and address come from their contact record in the CRM — they are not needed in the CSV.
            </p>
          </div>

          <div className="mt-4">
            <a
              href="/api/retail-gift-aid/import/template"
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
            >
              <Download className="h-4 w-4" />
              Download CSV template
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Map columns
  if (step === "map") {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Map Columns</h2>
              <p className="text-sm text-gray-500">
                <FileText className="h-4 w-4 inline mr-1" />
                {fileName} — {csvData.length} rows found
              </p>
            </div>
            <button
              onClick={() => { setStep("upload"); setCsvData([]); setHeaders([]); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useSplitName}
                  onChange={(e) => setUseSplitName(e.target.checked)}
                  className="rounded"
                />
                Separate first name and last name columns
              </label>
            </div>

            {useSplitName ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name Column *</label>
                  <select
                    value={firstNameCol}
                    onChange={(e) => setFirstNameCol(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select column...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name Column *</label>
                  <select
                    value={lastNameCol}
                    onChange={(e) => setLastNameCol(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select column...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name Column *</label>
                <select
                  value={nameCol}
                  onChange={(e) => setNameCol(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select column...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount Column *</label>
                <select
                  value={amountCol}
                  onChange={(e) => setAmountCol(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select column...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date Column *</label>
                <select
                  value={dateCol}
                  onChange={(e) => setDateCol(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select column...</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preview first 5 rows */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview (first 5 rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {headers.map((h) => (
                      <th key={h} className="pb-2 pr-3 text-left text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {headers.map((h) => (
                        <td key={h} className="py-2 pr-3 text-gray-700">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => { setStep("upload"); setCsvData([]); setHeaders([]); }}
            >
              Back
            </Button>
            <Button
              onClick={handlePreview}
              disabled={loading || (!useSplitName && !nameCol) || (useSplitName && (!firstNameCol || !lastNameCol)) || !amountCol || !dateCol}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Matching donors...
                </>
              ) : (
                "Preview & Match Donors"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Preview matches
  if (step === "preview" && matchResult) {
    const { donations, matched, unmatched, errors, totalAmount } = matchResult;

    return (
      <Card>
        <CardContent className="p-8">
          <h2 className="text-lg font-semibold mb-4">Review Import</h2>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{matched}</p>
              <p className="text-xs text-green-600">Matched</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-700">{unmatched}</p>
              <p className="text-xs text-amber-600">Unmatched</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700">{errors}</p>
              <p className="text-xs text-red-600">Errors</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <FileText className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-700">£{totalAmount.toFixed(2)}</p>
              <p className="text-xs text-purple-600">Total (matched)</p>
            </div>
          </div>

          {unmatched > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
              <strong>{unmatched} donation{unmatched > 1 ? "s" : ""}</strong> could not be matched to
              a contact in the CRM. These will be skipped. Ensure these donors exist in the CRM with
              a retail Gift Aid declaration before re-importing.
            </div>
          )}

          {/* Donation table */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b text-left text-xs text-gray-500 uppercase">
                  <th className="p-3">Row</th>
                  <th className="p-3">CSV Name</th>
                  <th className="p-3">Matched Contact</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d, i) => (
                  <tr key={i} className={`border-b last:border-0 ${d.matchStatus !== "matched" ? "bg-gray-50" : ""}`}>
                    <td className="p-3 text-gray-500">{d.rowNumber}</td>
                    <td className="p-3 font-medium">{d.rawName}</td>
                    <td className="p-3">
                      {d.matchedContactName ? (
                        <span className="text-green-700">{d.matchedContactName}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3">£{d.amount.toFixed(2)}</td>
                    <td className="p-3 text-gray-600">{d.date}</td>
                    <td className="p-3">
                      {d.matchStatus === "matched" && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Matched</span>
                      )}
                      {d.matchStatus === "unmatched" && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">No match</span>
                      )}
                      {d.matchStatus === "multiple" && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Multiple matches</span>
                      )}
                      {d.matchStatus === "error" && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full" title={d.error}>Error</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <p className="mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep("map")}>
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={matched === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Import {matched} Matched Donation{matched !== 1 ? "s" : ""}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 4: Importing
  if (step === "importing") {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-lg font-semibold text-gray-900">Importing donations...</h2>
          <p className="text-sm text-gray-500 mt-2">Please wait while we create the donation records.</p>
        </CardContent>
      </Card>
    );
  }

  // Step 5: Done
  if (step === "done" && importResult) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete</h2>
          <p className="text-gray-600 mb-6">
            Successfully imported <strong>{importResult.imported}</strong> retail donation{importResult.imported !== 1 ? "s" : ""}.
            {importResult.skipped > 0 && (
              <span className="text-amber-600"> {importResult.skipped} skipped (duplicates or errors).</span>
            )}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => { setStep("upload"); setCsvData([]); setHeaders([]); setMatchResult(null); setImportResult(null); }}>
              Import More
            </Button>
            <a href="/finance/retail-gift-aid">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Back to Retail Gift Aid
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
