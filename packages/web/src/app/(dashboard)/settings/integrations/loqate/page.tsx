"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

function LoqateLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#003D82" />
      <text x="24" y="31" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#fff">Lq</text>
    </svg>
  );
}

export default function LoqateIntegrationPage() {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Fetch current configuration status on mount
  useState(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/settings/loqate-api-key");
        if (response.ok) {
          const data = (await response.json()) as { isConfigured?: boolean };
          setIsConfigured(data.isConfigured ?? false);
        }
      } catch (err) {
        console.error("Failed to fetch Loqate configuration status:", err);
      }
    };
    fetchStatus();
  });

  const handleSaveApiKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSaved(false);

    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/settings/loqate-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Failed to save API key");
      }

      setIsSaved(true);
      setIsConfigured(true);
      setApiKey("");

      // Clear success message after 5 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save API key";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">Settings</Link>
          <span>/</span>
          <Link href="/settings/integrations" className="hover:text-gray-700">Integrations</Link>
          <span>/</span>
          <span>Loqate</span>
        </div>
        <div className="flex items-center gap-3">
          <LoqateLogo className="h-12 w-12" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loqate Address Verification</h1>
            <p className="text-gray-500 mt-1">
              Enable address lookup and verification for contacts
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>

            {isConfigured && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Status:</span> API key is configured
                </p>
              </div>
            )}

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Loqate API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Loqate API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your API key is stored securely and never displayed
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {isSaved && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">API key saved successfully</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !apiKey.trim()}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Saving..." : "Save API Key"}
              </button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Get Your API Key</h2>
            <ol className="space-y-4 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">1</span>
                <span>Sign up for a Loqate account at <a href="https://www.loqate.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">www.loqate.com</a></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">2</span>
                <span>Navigate to your account dashboard and go to API Keys</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">3</span>
                <span>Create a new API key or copy an existing one</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">4</span>
                <span>Paste the API key above and click Save</span>
              </li>
            </ol>
          </Card>
        </div>

        {/* Features sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Real-time address lookup</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Address verification and standardization</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Autocomplete suggestions</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>UK address database</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Demo mode without API key</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Demo Mode</h3>
            <p className="text-sm text-gray-700 mb-3">
              Without an API key, Loqate runs in demo mode with sample UK addresses. This is useful for testing the feature before setting up a paid account.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
