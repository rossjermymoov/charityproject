"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Xero Logo ────────────────────────────────────────────────────

function XeroLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="10" fill="#003A70" />
      <text x="24" y="31" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">
        X
      </text>
    </svg>
  );
}

// ── Main Page ────────────────────────────────────────────────────

interface XeroConfig {
  isConnected: boolean;
  tenantId: string | null;
  lastSyncAt: string | null;
  clientId: string | null;
  hasAccessToken: boolean;
  tokenExpiresAt: string | null;
}

export default function XeroPage() {
  const [config, setConfig] = useState<XeroConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState<"DONATIONS" | "CONTACTS">("DONATIONS");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/integrations/xero");
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (err) {
        console.error("Failed to fetch Xero config:", err);
        setError("Failed to load Xero configuration");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Check for OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      setSuccess("Xero successfully connected!");
      // Reload config
      setTimeout(() => {
        window.location.href = "/settings/integrations/xero";
      }, 1500);
    }
    if (params.get("error")) {
      setError(decodeURIComponent(params.get("error") || ""));
    }
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setError(null);

    try {
      const response = await fetch("/api/integrations/xero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      });

      if (response.ok) {
        setSuccess("Configuration saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
        // Reload config
        const configResponse = await fetch("/api/integrations/xero");
        const newConfig = await configResponse.json();
        setConfig(newConfig);
      } else {
        const error = await response.json();
        setError(error.error || "Failed to save configuration");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleConnectOAuth = async () => {
    setConnectingOAuth(true);
    setError(null);

    try {
      const response = await fetch("/api/integrations/xero/auth");
      if (response.ok) {
        const data = await response.json();
        // Redirect to Xero OAuth
        window.location.href = data.authUrl;
      } else {
        const error = await response.json();
        setError(error.error || "Failed to start OAuth flow");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start OAuth flow");
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Xero?")) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/integrations/xero/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        setSuccess("Xero disconnected successfully!");
        setTimeout(() => {
          window.location.href = "/settings/integrations/xero";
        }, 1500);
      } else {
        const error = await response.json();
        setError(error.error || "Failed to disconnect");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (type: "DONATIONS" | "CONTACTS") => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/integrations/xero/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(
          `${type} sync completed: ${data.syncedCount} synced, ${data.failedCount} failed`
        );
        setTimeout(() => setSuccess(null), 5000);
      } else {
        const error = await response.json();
        setError(error.error || "Sync failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-5 w-5 bg-gray-300 rounded"></div>
          <div className="h-8 w-48 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
          <span>Xero</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/integrations"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Xero Accounting</h1>
            <p className="text-gray-500 mt-1">
              Sync donations, contacts, and financial data to Xero
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Success</h3>
            <p className="text-sm text-green-800 mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
              config?.isConnected
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            {config?.isConnected ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3
                className={`font-semibold ${
                  config?.isConnected ? "text-green-900" : "text-amber-900"
                }`}
              >
                {config?.isConnected ? "Connected" : "Not Connected"}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  config?.isConnected ? "text-green-800" : "text-amber-800"
                }`}
              >
                {config?.isConnected
                  ? `Connected to tenant ${config.tenantId || "unknown"}`
                  : "Configure your credentials and connect to Xero"}
              </p>
              {config?.isConnected && config?.lastSyncAt && (
                <p className="text-xs text-green-700 mt-1">
                  Last sync: {new Date(config.lastSyncAt).toLocaleString()}
                </p>
              )}
            </div>
            {config?.isConnected && (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
              >
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <XeroLogo className="h-10 w-10 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900">API Credentials</h3>
              <p className="text-sm text-gray-600 mt-1">
                Get these from your Xero Developer Portal at{" "}
                <a
                  href="https://developer.xero.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline"
                >
                  developer.xero.com
                </a>
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Your Xero Client ID"
                disabled={savingConfig}
              />
              <Input
                label="Client Secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Your Xero Client Secret"
                disabled={savingConfig}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={savingConfig || !clientId || !clientSecret}
                className="gap-2"
              >
                {savingConfig && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </div>
          </form>

          {config?.clientId && !config?.isConnected && (
            <Button
              onClick={handleConnectOAuth}
              disabled={connectingOAuth}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {connectingOAuth && <Loader2 className="h-4 w-4 animate-spin" />}
              Connect to Xero
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Account Mappings Section */}
      {config?.isConnected && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">Account Mappings</h3>
              <p className="text-sm text-gray-600 mt-1">
                Map your DeepCharity ledger codes to Xero account codes
              </p>
            </div>
            <Link
              href="/settings/integrations/xero/mappings"
              className="inline-block"
            >
              <Button variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Manage Mappings
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Sync Controls */}
      {config?.isConnected && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">Sync Data</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manually trigger sync of donations and contacts to Xero
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleSync("DONATIONS")}
                disabled={syncing}
                className="gap-2"
              >
                {syncing && syncType === "DONATIONS" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Sync Donations
              </Button>
              <Button
                onClick={() => handleSync("CONTACTS")}
                disabled={syncing}
                className="gap-2"
              >
                {syncing && syncType === "CONTACTS" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Sync Contacts
              </Button>
            </div>

            <Link href="/settings/integrations/xero/logs">
              <Button variant="outline" className="w-full">
                View Sync History
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
