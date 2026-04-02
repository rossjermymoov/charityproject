"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Mapping {
  id: string;
  ledgerCodeId: string;
  ledgerCode: string;
  ledgerCodeName: string;
  xeroAccountCode: string;
  xeroAccountName: string | null;
  createdAt: string;
}

interface LedgerCode {
  id: string;
  code: string;
  name: string;
}

interface XeroAccount {
  code: string;
  name: string;
  type: string;
}

export default function MappingsPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [ledgerCodes, setLedgerCodes] = useState<LedgerCode[]>([]);
  const [xeroAccounts, setXeroAccounts] = useState<XeroAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedLedgerCode, setSelectedLedgerCode] = useState("");
  const [selectedXeroAccount, setSelectedXeroAccount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load mappings
        const mappingsRes = await fetch("/api/integrations/xero/mappings");
        if (mappingsRes.ok) {
          const data = await mappingsRes.json();
          setMappings(data.mappings);
        }

        // Load ledger codes
        const ledgerRes = await fetch("/api/ledger-codes");
        if (ledgerRes.ok) {
          const data = await ledgerRes.json();
          setLedgerCodes(data.codes || []);
        }

        // Load Xero accounts
        const accountsRes = await fetch("/api/integrations/xero/accounts");
        if (accountsRes.ok) {
          const data = await accountsRes.json();
          setXeroAccounts(data.accounts || []);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load configuration data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFetchAccounts = async () => {
    setFetching(true);
    setError(null);

    try {
      const response = await fetch("/api/integrations/xero/accounts");
      if (response.ok) {
        const data = await response.json();
        setXeroAccounts(data.accounts || []);
        setSuccess("Xero chart of accounts loaded successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || "Failed to fetch accounts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
    } finally {
      setFetching(false);
    }
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedgerCode || !selectedXeroAccount) {
      setError("Please select both a ledger code and Xero account");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const xeroAccountName =
        xeroAccounts.find((a) => a.code === selectedXeroAccount)?.name || null;

      const response = await fetch("/api/integrations/xero/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ledgerCodeId: selectedLedgerCode,
          xeroAccountCode: selectedXeroAccount,
          xeroAccountName,
        }),
      });

      if (response.ok) {
        setSuccess("Mapping saved successfully!");
        setShowForm(false);
        setSelectedLedgerCode("");
        setSelectedXeroAccount("");
        setTimeout(() => setSuccess(null), 3000);

        // Reload mappings
        const mappingsRes = await fetch("/api/integrations/xero/mappings");
        if (mappingsRes.ok) {
          const data = await mappingsRes.json();
          setMappings(data.mappings);
        }
      } else {
        const error = await response.json();
        setError(error.error || "Failed to save mapping");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-300 rounded"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
          <Link href="/settings/integrations/xero" className="hover:text-gray-700">
            Xero
          </Link>
          <span>/</span>
          <span>Account Mappings</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/integrations/xero"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Mappings</h1>
            <p className="text-gray-500 mt-1">
              Map your ledger codes to Xero account codes
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Fetch Accounts Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleFetchAccounts}
            disabled={fetching}
            className="gap-2"
          >
            {fetching && <Loader2 className="h-4 w-4 animate-spin" />}
            Fetch Xero Chart of Accounts
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            {xeroAccounts.length > 0
              ? `Loaded ${xeroAccounts.length} accounts`
              : "No accounts loaded yet"}
          </p>
        </CardContent>
      </Card>

      {/* Add Mapping Form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <h3 className="font-semibold text-gray-900">New Mapping</h3>
            <form onSubmit={handleSaveMapping} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ledger Code
                </label>
                <select
                  value={selectedLedgerCode}
                  onChange={(e) => setSelectedLedgerCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a ledger code</option>
                  {ledgerCodes.map((code) => (
                    <option key={code.id} value={code.id}>
                      {code.code} - {code.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xero Account
                </label>
                <select
                  value={selectedXeroAccount}
                  onChange={(e) => setSelectedXeroAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a Xero account</option>
                  {xeroAccounts.map((account) => (
                    <option key={account.code} value={account.code}>
                      {account.code} - {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={saving || !selectedLedgerCode || !selectedXeroAccount}
                  className="gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Mapping
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedLedgerCode("");
                    setSelectedXeroAccount("");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Mapping Button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Mapping
        </Button>
      )}

      {/* Mappings Table */}
      {mappings.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Ledger Code
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Xero Account
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((mapping) => (
                    <tr key={mapping.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {mapping.ledgerCode}
                          </p>
                          <p className="text-xs text-gray-500">
                            {mapping.ledgerCodeName}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {mapping.xeroAccountCode}
                          </p>
                          <p className="text-xs text-gray-500">
                            {mapping.xeroAccountName}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-500">No mappings configured yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
