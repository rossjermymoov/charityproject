"use client";

import { useState, useRef } from "react";
import { Upload, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  id: string;
  filename: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  errors: ImportError[];
  createdAt: string;
  completedAt: string | null;
}

export default function DonationImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.name.toLowerCase().endsWith(".csv")) {
        setFile(droppedFile);
        setUploadError(null);
      } else {
        setUploadError("Please upload a CSV file");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/donations/import/template");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "donation-import-template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading template:", error);
      setUploadError("Failed to download template");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Please select a file");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/donations/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setUploadError(data.error || "Upload failed");
        setIsUploading(false);
        return;
      }

      const result = await response.json();
      setImportResult(result);

      // Poll for completion
      pollForCompletion(result.id);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload file");
      setIsUploading(false);
    }
  };

  const pollForCompletion = async (importId: string) => {
    const maxAttempts = 60; // Poll for up to 60 seconds
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/donations/import/${importId}`);
        if (!response.ok) throw new Error("Failed to fetch status");

        const result = await response.json();
        setImportResult(result);

        if (
          result.status === "COMPLETED" ||
          result.status === "FAILED" ||
          attempts >= maxAttempts
        ) {
          setIsUploading(false);
          return;
        }

        attempts++;
        setTimeout(poll, 1000); // Poll every second
      } catch (error) {
        console.error("Poll error:", error);
        setIsUploading(false);
      }
    };

    poll();
  };

  const groupErrorsByField = (errors: ImportError[]) => {
    const grouped: Record<string, ImportError[]> = {};
    errors.forEach((error) => {
      if (!grouped[error.field]) {
        grouped[error.field] = [];
      }
      grouped[error.field].push(error);
    });
    return grouped;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Import Donations
        </h1>
        <p className="text-gray-500 mt-1">
          Bulk upload donations from a CSV file
        </p>
      </div>

      {!importResult && (
        <Card className="p-6">
          <div className="space-y-6">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <h3 className="font-medium text-blue-900">CSV Template</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Download the template to see the required format
                </p>
              </div>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>

            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse your computer
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Select File
              </Button>

              {file && (
                <p className="text-sm text-gray-600 mt-4">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{uploadError}</p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-3 justify-between">
              <Link href="/finance/donations">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload & Process"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className="p-6">
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Import Results
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                File: <span className="font-medium">{importResult.filename}</span>
              </p>
            </div>

            {/* Status and Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900">
                  {importResult.totalRows}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {importResult.successRows}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {importResult.errorRows}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      importResult.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : importResult.status === "PROCESSING"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {importResult.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Error Details */}
            {importResult.errors.length > 0 && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-red-900 mb-4">
                  Errors ({importResult.errors.length})
                </h3>

                {importResult.status === "COMPLETED" ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(groupErrorsByField(importResult.errors)).map(
                      ([field, errors]) => (
                        <div key={field}>
                          <h4 className="font-medium text-red-800 text-sm mb-2">
                            {field}
                          </h4>
                          <ul className="space-y-1 text-sm text-red-700 ml-4 list-disc">
                            {errors.slice(0, 5).map((error, idx) => (
                              <li key={idx}>
                                Row {error.row}: {error.message}
                              </li>
                            ))}
                            {errors.length > 5 && (
                              <li className="font-medium">
                                +{errors.length - 5} more errors
                              </li>
                            )}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-700">
                    Processing... Errors will appear here when complete.
                  </p>
                )}
              </div>
            )}

            {/* Processing Message */}
            {isUploading && importResult.status === "PROCESSING" && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-blue-700">
                  Processing donations... ({importResult.processedRows}/{importResult.totalRows})
                </p>
              </div>
            )}

            {/* Success Message */}
            {!isUploading && importResult.status === "COMPLETED" && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0">
                  ✓
                </div>
                <div>
                  <h3 className="font-medium text-green-900">
                    Import completed successfully!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {importResult.successRows} donations have been created.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-between">
              <Link href="/finance/donations">
                <Button variant="outline">Back to Donations</Button>
              </Link>
              <Button
                onClick={() => {
                  setImportResult(null);
                  setFile(null);
                  setUploadError(null);
                }}
              >
                Import Another File
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
