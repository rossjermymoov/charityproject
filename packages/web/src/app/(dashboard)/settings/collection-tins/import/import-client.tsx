"use client";

import { useState, useCallback, useMemo } from "react";
import { Upload, FileSpreadsheet, ArrowRight, Check, AlertTriangle, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { importLocations, type ImportRow, type ImportResult } from "./actions";

// The fields we need to map to
const TARGET_FIELDS = [
  { key: "tinNumber", label: "Tin Number / ID", required: false, description: "Unique tin identifier. Map this if each CSV row is a tin." },
  { key: "name", label: "Location Name", required: true, description: "Name of the business or venue" },
  { key: "address", label: "Address", required: false, description: "Street address" },
  { key: "city", label: "City / Town", required: false, description: "City or town name" },
  { key: "postcode", label: "Postcode", required: false, description: "UK postcode (used for geocoding)" },
  { key: "type", label: "Location Type", required: false, description: "SHOP, PUB, RESTAURANT, OFFICE, SCHOOL, CHURCH, OTHER" },
  { key: "contactName", label: "Contact Name", required: false, description: "Main contact person at location" },
  { key: "contactPhone", label: "Contact Phone", required: false, description: "Phone number" },
  { key: "notes", label: "Notes", required: false, description: "Any additional information" },
] as const;

type TargetKey = (typeof TARGET_FIELDS)[number]["key"];

type Step = "upload" | "mapping" | "preview" | "importing" | "done";

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && (i === 0 || line[i - 1] !== "\\")) {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function autoMap(csvHeaders: string[]): Record<TargetKey, string> {
  const mapping: Record<string, string> = {};

  const patterns: Record<TargetKey, RegExp[]> = {
    tinNumber: [/tin.?number/i, /tin.?id/i, /^tin$/i, /^id$/i, /^number$/i, /^ref$/i, /reference/i, /asset.?id/i, /serial/i],
    name: [/^name$/i, /location.?name/i, /business.?name/i, /venue/i, /company/i, /^site$/i, /^location$/i],
    address: [/^address$/i, /street/i, /address.?line/i, /^addr$/i, /address.?1/i],
    city: [/^city$/i, /^town$/i, /city.?town/i, /^locality$/i],
    postcode: [/post.?code/i, /^zip/i, /postal/i, /^pc$/i],
    type: [/^type$/i, /category/i, /location.?type/i, /^kind$/i],
    contactName: [/contact.?name/i, /^contact$/i, /person/i, /manager/i],
    contactPhone: [/phone/i, /tel/i, /mobile/i, /contact.?number/i],
    notes: [/^notes?$/i, /comment/i, /^info$/i, /description/i, /^details$/i],
  };

  for (const [targetKey, regexes] of Object.entries(patterns)) {
    for (const header of csvHeaders) {
      const match = regexes.some((r) => r.test(header));
      if (match && !Object.values(mapping).includes(header)) {
        mapping[targetKey] = header;
        break;
      }
    }
  }

  return mapping as Record<TargetKey, string>;
}

export default function ImportClient() {
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<TargetKey, string>>({} as any);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      const autoMapping = autoMap(headers);
      setMapping(autoMapping);
      setStep("mapping");
    };
    reader.readAsText(file);
  }, []);

  const handleMappingChange = (targetKey: TargetKey, csvColumn: string) => {
    setMapping((prev) => ({ ...prev, [targetKey]: csvColumn || "" }));
  };

  const getMappedRows = useCallback((): ImportRow[] => {
    return csvRows.map((row) => {
      const mapped: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        const csvCol = mapping[field.key];
        if (csvCol) {
          const colIdx = csvHeaders.indexOf(csvCol);
          if (colIdx >= 0 && row[colIdx]) {
            mapped[field.key] = row[colIdx];
          }
        }
      }
      return mapped as unknown as ImportRow;
    }).filter((row) => row.name && row.name.trim().length > 0);
  }, [csvRows, csvHeaders, mapping]);

  // Compute preview stats
  const previewStats = useMemo(() => {
    if (step !== "preview") return null;
    const rows = getMappedRows();
    const hasTins = !!mapping.tinNumber && rows.some((r) => r.tinNumber);
    const uniqueLocations = new Set(
      rows.map((r) => `${r.name?.trim().toLowerCase()}|||${(r.postcode || "").trim().toLowerCase()}`)
    );
    return {
      totalRows: rows.length,
      uniqueLocations: uniqueLocations.size,
      hasTins,
      tinCount: hasTins ? rows.filter((r) => r.tinNumber?.trim()).length : 0,
    };
  }, [step, getMappedRows, mapping.tinNumber]);

  const handleImport = async () => {
    setStep("importing");
    const rows = getMappedRows();
    const res = await importLocations(rows);
    setResult(res);
    setStep("done");
  };

  const nameIsMapped = !!mapping.name;
  const tinIsMapped = !!mapping.tinNumber;
  const previewRows = step === "preview" ? getMappedRows().slice(0, 10) : [];

  return (
    <div className="space-y-6">
      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Upload your CSV file</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md">
              Upload a CSV where each row is a tin (with tin IDs) or a location. If multiple tins share an address,
              they'll be grouped into one location automatically.
            </p>
            <label className="cursor-pointer">
              <input type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <FileSpreadsheet className="h-5 w-5" />
                Choose CSV File
              </div>
            </label>
            <p className="text-xs text-gray-400 mt-3">Supported: .csv, .tsv, .txt</p>
          </div>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === "mapping" && (
        <>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-800">{fileName}</p>
                <p className="text-xs text-blue-600">{csvRows.length} rows found, {csvHeaders.length} columns</p>
              </div>
              <Button
                variant="ghost" size="sm" className="ml-auto text-blue-600"
                onClick={() => { setStep("upload"); setCsvHeaders([]); setCsvRows([]); }}
              >
                Change file
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Map your columns</h3>
            <p className="text-sm text-gray-500 mb-4">
              Match each of our fields to a column in your CSV. "Location Name" is required.
              If you map "Tin Number", each row becomes a tin and rows sharing the same name + postcode are grouped into one location.
            </p>

            <div className="space-y-3">
              {TARGET_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-4">
                  <div className="w-48 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </p>
                    <p className="text-xs text-gray-400">{field.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  <select
                    value={mapping[field.key] || ""}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Don't import —</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                        {csvRows[0] ? ` (e.g. "${csvRows[0][csvHeaders.indexOf(h)]?.slice(0, 30) || ""}")` : ""}
                      </option>
                    ))}
                  </select>
                  {mapping[field.key] && (
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {tinIsMapped && (
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                <MapPin className="h-4 w-4" />
                <span>Tin mode: Rows sharing the same location name + postcode will be grouped into one location with multiple tins</span>
              </div>
            )}

            {!nameIsMapped && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span>You must map "Location Name" to proceed</span>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button disabled={!nameIsMapped} onClick={() => setStep("preview")}>
                Preview Import
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="ghost" onClick={() => { setStep("upload"); setCsvHeaders([]); setCsvRows([]); }}>
                Cancel
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && previewStats && (
        <>
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  {previewStats.hasTins
                    ? `${previewStats.tinCount} tins across ${previewStats.uniqueLocations} unique locations`
                    : `${previewStats.uniqueLocations} locations ready to import`}
                </p>
                <p className="text-xs text-green-600">
                  {previewStats.totalRows - previewStats.tinCount > 0 && previewStats.hasTins
                    ? `${previewStats.totalRows - previewStats.tinCount} rows without tin numbers will still create locations`
                    : csvRows.length - previewStats.totalRows > 0
                    ? `${csvRows.length - previewStats.totalRows} rows skipped (no location name)`
                    : "All rows valid"}
                </p>
              </div>
            </div>
          </Card>

          {previewStats.hasTins && previewStats.uniqueLocations < previewStats.totalRows && (
            <Card className="p-4 bg-indigo-50 border-indigo-200">
              <div className="flex items-center gap-2 text-sm text-indigo-800">
                <MapPin className="h-4 w-4" />
                <span>
                  {previewStats.totalRows} rows will be grouped into {previewStats.uniqueLocations} locations
                  (avg {Math.round(previewStats.totalRows / previewStats.uniqueLocations * 10) / 10} tins per location)
                </span>
              </div>
            </Card>
          )}

          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <MapPin className="h-4 w-4" />
              <span>New locations with address/postcode data will be automatically geocoded</span>
            </div>
          </Card>

          {/* Preview table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">#</th>
                    {TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                      <th key={f.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      {TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                        <td key={f.key} className="px-3 py-2 text-gray-900 max-w-[200px] truncate">
                          {(row as any)[f.key] || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {getMappedRows().length > 10 && (
              <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center border-t">
                Showing first 10 of {getMappedRows().length} rows
              </div>
            )}
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleImport}>
              Import {previewStats.hasTins ? `${previewStats.tinCount} Tins` : `${previewStats.uniqueLocations} Locations`}
            </Button>
            <Button variant="outline" onClick={() => setStep("mapping")}>
              Back to Mapping
            </Button>
          </div>
        </>
      )}

      {/* Step 4: Importing */}
      {step === "importing" && (
        <Card className="p-8 text-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-900">Importing...</p>
          <p className="text-sm text-gray-500 mt-1">
            Grouping locations and geocoding addresses. This may take a while — please don't close this page.
          </p>
        </Card>
      )}

      {/* Step 5: Done */}
      {step === "done" && result && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Import Complete</h3>
              <div className="flex flex-wrap gap-3 mt-2">
                <Badge className="bg-green-100 text-green-800">{result.locationsCreated} locations created</Badge>
                {result.tinsCreated > 0 && (
                  <Badge className="bg-green-100 text-green-800">{result.tinsCreated} tins created</Badge>
                )}
                {result.tinsSkipped > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">{result.tinsSkipped} tins skipped</Badge>
                )}
                {result.rowsSkipped > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">{result.rowsSkipped} rows skipped</Badge>
                )}
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-yellow-800 mb-2">Issues:</p>
              <ul className="space-y-1">
                {result.errors.slice(0, 20).map((err, i) => (
                  <li key={i} className="text-xs text-yellow-700">{err}</li>
                ))}
                {result.errors.length > 20 && (
                  <li className="text-xs text-yellow-600 font-semibold">
                    ...and {result.errors.length - 20} more
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <a href="/finance/collection-tins">
              <Button>View Tin Locations</Button>
            </a>
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setCsvHeaders([]);
                setCsvRows([]);
                setResult(null);
              }}
            >
              Import Another File
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
