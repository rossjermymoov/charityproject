"use client";

import { formatDate, formatShortDate } from '@/lib/utils';

import { useState } from "react";
import Link from "next/link";

interface GeneratedLink {
  token: string;
  contactId: string;
  preferenceUrl: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function PreferencesSettingsPage() {
  const [contactId, setContactId] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(
    null
  );
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkContactIds, setBulkContactIds] = useState("");
  const [bulkResults, setBulkResults] = useState<GeneratedLink[]>([]);

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setGeneratedLink(null);
    setLoading(true);

    try {
      const response = await fetch("/api/preferences/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          expiresInDays:
            expiresInDays === "" ? null : parseInt(String(expiresInDays)),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to generate link");
        return;
      }

      const data = await response.json();
      setGeneratedLink(data);
      setSuccess(true);
      setContactId("");
      setExpiresInDays("");
    } catch (err) {
      setError("Failed to generate link. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setBulkResults([]);
    setLoading(true);

    try {
      const ids = bulkContactIds
        .split("\n")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (ids.length === 0) {
        setError("Please enter at least one contact ID");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/preferences/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: ids,
          expiresInDays:
            expiresInDays === "" ? null : parseInt(String(expiresInDays)),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to generate links");
        return;
      }

      const data = await response.json();
      setBulkResults(data.tokens);
      setSuccess(true);
      setBulkContactIds("");
      setExpiresInDays("");
    } catch (err) {
      setError("Failed to generate links. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadLinks = () => {
    if (!bulkResults.length) return;

    const csv = [
      ["Contact ID", "Preference URL", "Expires At", "Created At"],
      ...bulkResults.map((link) => [
        link.contactId,
        link.preferenceUrl,
        link.expiresAt || "Never",
        link.createdAt,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `preference-links-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Donor Preference Centre
          </h1>
          <p className="text-gray-600 mt-2">
            Generate links for donors to manage their communication preferences
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-8 flex gap-4 bg-white rounded-lg p-4">
          <button
            onClick={() => setBulkMode(false)}
            className={`px-4 py-2 rounded font-medium transition ${
              !bulkMode
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Single Contact
          </button>
          <button
            onClick={() => setBulkMode(true)}
            className={`px-4 py-2 rounded font-medium transition ${
              bulkMode
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Bulk Generate
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            ✓ Link generated successfully!
          </div>
        )}

        {/* Single Mode Form */}
        {!bulkMode && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <form onSubmit={handleGenerateLink} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Contact ID
                </label>
                <input
                  type="text"
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  placeholder="Enter contact ID (cuid format)"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Link Expiration (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={expiresInDays}
                    onChange={(e) =>
                      setExpiresInDays(
                        e.target.value === ""
                          ? ""
                          : Math.max(1, parseInt(e.target.value))
                      )
                    }
                    placeholder="Days until expiration"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <span className="flex items-center text-gray-600 text-sm">
                    days
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leave empty for no expiration
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? "Generating..." : "Generate Link"}
              </button>
            </form>

            {/* Generated Link Display */}
            {generatedLink && (
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Preference Link Generated
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedLink.preferenceUrl}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-sm"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(generatedLink.preferenceUrl)
                        }
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedLink.token}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(generatedLink.token)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {generatedLink.expiresAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expires At
                      </label>
                      <p className="text-gray-900">
                        {new Date(generatedLink.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk Mode Form */}
        {bulkMode && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <form onSubmit={handleBulkGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Contact IDs
                </label>
                <textarea
                  value={bulkContactIds}
                  onChange={(e) => setBulkContactIds(e.target.value)}
                  placeholder="Enter one contact ID per line"
                  required
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-2">
                  One contact ID per line (cuid format)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Link Expiration (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={expiresInDays}
                    onChange={(e) =>
                      setExpiresInDays(
                        e.target.value === ""
                          ? ""
                          : Math.max(1, parseInt(e.target.value))
                      )
                    }
                    placeholder="Days until expiration"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <span className="flex items-center text-gray-600 text-sm">
                    days
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leave empty for no expiration
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? "Generating..." : "Generate Links"}
              </button>
            </form>

            {/* Bulk Results Table */}
            {bulkResults.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generated Links ({bulkResults.length})
                  </h3>
                  <button
                    onClick={downloadLinks}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                  >
                    Download CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-900">
                          Contact ID
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">
                          Preference URL
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">
                          Expires
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">
                          Copy
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bulkResults.map((link) => (
                        <tr key={link.token} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-mono text-xs">
                            {link.contactId.substring(0, 12)}...
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs text-gray-600 truncate block max-w-xs">
                              {link.preferenceUrl}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-xs">
                            {link.expiresAt
                              ? formatDate(link.expiresAt)
                              : "Never"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                copyToClipboard(link.preferenceUrl)
                              }
                              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                            >
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">About this feature</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              • Generate unique links for donors to manage their communication
              preferences
            </li>
            <li>
              • Links can optionally expire after a specified number of days
            </li>
            <li>
              • Each link is unique to a contact and doesn't require login
            </li>
            <li>
              • Donors can update their email, SMS, post, and phone preferences
            </li>
            <li>• Links can be sent via email or included in correspondence</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
