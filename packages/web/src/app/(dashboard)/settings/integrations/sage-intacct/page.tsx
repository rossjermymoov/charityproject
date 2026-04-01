import { requireRole } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { saveSageSettings } from "./actions";

// ── Sage Intacct Logo ────────────────────────────────────────────

function SageIntacctLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="10" fill="#00DC82" />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontSize="18"
        fontWeight="bold"
        fill="white"
      >
        SI
      </text>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default async function SageIntacctPage() {
  const user = await requireRole(["ADMIN"]);

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
  });

  const isConnected =
    settings?.sageEnabled &&
    settings?.sageCompanyId &&
    settings?.sageSenderId &&
    settings?.sageUserId;

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
          <span>Sage Intacct</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/integrations"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sage Intacct</h1>
            <p className="text-gray-500 mt-1">
              Cloud financial management for nonprofits
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
              isConnected
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            {isConnected ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3
                className={`font-semibold ${
                  isConnected ? "text-green-900" : "text-amber-900"
                }`}
              >
                {isConnected ? "Connected" : "Not Connected"}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  isConnected ? "text-green-800" : "text-amber-800"
                }`}
              >
                {isConnected
                  ? `Connected to company ${settings?.sageCompanyId}`
                  : "Configure your credentials below to enable syncing"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Form */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <SageIntacctLogo className="h-10 w-10 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900">API Credentials</h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure your Sage Intacct Web Services credentials. These are
                found in your Sage Intacct company settings under Web Services.
              </p>
            </div>
          </div>

          <form action={saveSageSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Company ID"
                name="sageCompanyId"
                defaultValue={settings?.sageCompanyId || ""}
                placeholder="e.g. MyCharity"
                required
              />
              <Input
                label="Sender ID (Web Services User)"
                name="sageSenderId"
                defaultValue={settings?.sageSenderId || ""}
                placeholder="e.g. ws_user"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Sender Password"
                name="sageSenderPassword"
                type="password"
                defaultValue={settings?.sageSenderPassword || ""}
                placeholder="••••••••"
              />
              <Input
                label="User ID (API User)"
                name="sageUserId"
                defaultValue={settings?.sageUserId || ""}
                placeholder="e.g. api_user"
                required
              />
            </div>

            <div>
              <Input
                label="User Password"
                name="sageUserPassword"
                type="password"
                defaultValue={settings?.sageUserPassword || ""}
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="sageEnabled"
                name="sageEnabled"
                defaultChecked={settings?.sageEnabled || false}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
              />
              <label htmlFor="sageEnabled" className="text-sm text-gray-700">
                Enable Sage Intacct sync
              </label>
            </div>

            <p className="text-xs text-gray-500">
              Passwords are encrypted before being stored. Find your credentials
              at:{" "}
              <a
                href="https://login.intacct.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline"
              >
                Sage Intacct Login → Settings → Web Services
              </a>
            </p>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" type="button" disabled>
                Test Connection
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Features */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Sync Donations to GL
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically post donation income as journal entries to your
                  Sage GL
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Map Account Codes
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Link donation types and campaigns to Sage GL accounts and
                  dimensions
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Dimension Support
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Tag journal entries with departments, locations, and projects
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Batch & Real-Time Sync
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Choose between real-time posting or batched daily/weekly sync
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Account Mappings & Sync Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/settings/integrations/sage-intacct/mappings">
          <Card className="p-5 hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Account Mappings</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Configure which GL accounts receive each donation type
                </p>
              </div>
              <Settings className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </div>
          </Card>
        </Link>

        <Link href="/settings/integrations/sage-intacct/sync">
          <Card className="p-5 hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Sync Dashboard</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Monitor sync status and view sync history
                </p>
              </div>
              <Settings className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
