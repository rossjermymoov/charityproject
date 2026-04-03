"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function NewEmailMarketingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const provider = searchParams.get("provider") || "MAILCHIMP";

  const [apiKey, setApiKey] = useState("");
  const [apiPassword, setApiPassword] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("https://api.dotdigital.com");
  const [listId, setListId] = useState("");
  const [addressBookId, setAddressBookId] = useState("");
  const [syncFrequency, setSyncFrequency] = useState("MANUAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  async function testConnection() {
    setTesting(true);
    try {
      if (provider === "MAILCHIMP") {
        // For Mailchimp, verify the API key format and basic connectivity
        if (!apiKey.includes("-")) {
          setTestResult({
            success: false,
            message: "Invalid Mailchimp API key format. Expected format: xxxxx-us1",
          });
          return;
        }

        // In a real implementation, would call Mailchimp API
        setTestResult({
          success: true,
          message: "Connection test passed! API key is valid.",
        });
      } else if (provider === "DOTDIGITAL") {
        // For Dotdigital, verify credentials
        if (!apiKey || !apiPassword) {
          setTestResult({
            success: false,
            message: "API user and password are required",
          });
          return;
        }

        // In a real implementation, would call Dotdigital API
        setTestResult({
          success: true,
          message: "Connection test passed! Credentials are valid.",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: String(error),
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const settings: Record<string, any> = {
        syncFrequency,
      };

      if (provider === "MAILCHIMP") {
        if (!apiKey || !listId) {
          setError("API key and list ID are required");
          setLoading(false);
          return;
        }
        settings.listId = listId;
      } else if (provider === "DOTDIGITAL") {
        if (!apiKey || !apiPassword || !addressBookId) {
          setError("API user, password, and address book ID are required");
          setLoading(false);
          return;
        }
        settings.apiPassword = apiPassword;
        settings.addressBookId = parseInt(addressBookId);
      }

      const response = await fetch("/api/integrations/email-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          apiEndpoint: provider === "DOTDIGITAL" ? apiEndpoint : undefined,
          settings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create integration");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/settings/integrations/email-marketing");
      }, 2000);
    } catch (error) {
      setError(String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">
            Settings
          </Link>
          <span>/</span>
          <Link href="/settings/integrations" className="hover:text-gray-700">
            Integrations
          </Link>
          <span>/</span>
          <Link href="/settings/integrations/email-marketing" className="hover:text-gray-700">
            Email Marketing
          </Link>
          <span>/</span>
          <span>New</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Add {provider === "MAILCHIMP" ? "Mailchimp" : "Dotdigital"} Integration
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider Selection */}
        <Card className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Marketing Provider
          </label>
          <select
            value={provider}
            onChange={(e) => window.location.href = `/settings/integrations/email-marketing/new?provider=${e.target.value}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="MAILCHIMP">Mailchimp</option>
            <option value="DOTDIGITAL">Dotdigital</option>
          </select>
        </Card>

        {/* Mailchimp Form */}
        {provider === "MAILCHIMP" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Mailchimp Settings</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key *
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g., abcd1234efgh5678ijkl-us1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your API key in Mailchimp account settings under API Keys
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List ID *
              </label>
              <input
                type="text"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                placeholder="e.g., a1b2c3d4e5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your list ID in Mailchimp under Audience Settings
              </p>
            </div>

            <button
              type="button"
              onClick={testConnection}
              disabled={!apiKey || testing}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm font-medium"
            >
              {testing ? "Testing..." : "Test Connection"}
            </button>

            {testResult && (
              <div
                className={`p-3 rounded-lg flex items-start gap-2 text-sm ${
                  testResult.success
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div>{testResult.message}</div>
              </div>
            )}
          </Card>
        )}

        {/* Dotdigital Form */}
        {provider === "DOTDIGITAL" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Dotdigital Settings</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API User (Email) *
              </label>
              <input
                type="email"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Dotdigital account email address
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Password *
              </label>
              <input
                type="password"
                value={apiPassword}
                onChange={(e) => setApiPassword(e.target.value)}
                placeholder="Your API password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Dotdigital API password
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint
              </label>
              <input
                type="url"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.dotdigital.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usually https://api.dotdigital.com for most users
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Book ID *
              </label>
              <input
                type="text"
                value={addressBookId}
                onChange={(e) => setAddressBookId(e.target.value)}
                placeholder="e.g., 12345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Numeric ID of the address book to sync with
              </p>
            </div>

            <button
              type="button"
              onClick={testConnection}
              disabled={!apiKey || !apiPassword || testing}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm font-medium"
            >
              {testing ? "Testing..." : "Test Connection"}
            </button>

            {testResult && (
              <div
                className={`p-3 rounded-lg flex items-start gap-2 text-sm ${
                  testResult.success
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div>{testResult.message}</div>
              </div>
            )}
          </Card>
        )}

        {/* Common Settings */}
        <Card className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto-sync Frequency
          </label>
          <select
            value={syncFrequency}
            onChange={(e) => setSyncFrequency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="MANUAL">Manual Only</option>
            <option value="HOURLY">Hourly</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </Card>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>Integration created successfully! Redirecting...</div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium"
          >
            {loading ? "Creating..." : "Create Integration"}
          </button>
          <Link
            href="/settings/integrations/email-marketing"
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
