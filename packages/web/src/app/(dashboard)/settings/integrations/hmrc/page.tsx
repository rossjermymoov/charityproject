import { requireAuth, requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Crown, Info } from "lucide-react";
import { saveHmrcSettings } from "./actions";

export default async function HmrcPage() {
  await requireRole(["ADMIN"]);

  const settings = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const isConnected =
    settings.hmrcEnabled && settings.hmrcCharityRef && settings.hmrcGatewayUser;

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
          <span>HMRC Gift Aid</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            {/* HMRC Crown Logo */}
            <svg
              className="h-12 w-12 flex-shrink-0"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" rx="10" fill="#003078" />
              {/* Crown shape */}
              <g fill="white">
                <circle cx="12" cy="30" r="2" />
                <circle cx="36" cy="30" r="2" />
                {/* Crown points */}
                <polygon points="8,28 14,18 16,26 24,14 32,26 34,18 40,28" />
                {/* Crown band */}
                <rect x="8" y="30" width="32" height="4" rx="1" />
              </g>
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HMRC Gift Aid</h1>
              <p className="text-gray-500 mt-1">
                Submit Gift Aid claims directly to HMRC Charities Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Connection Status</p>
              <p className="mt-1">
                {isConnected ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-green-700 font-medium">Connected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                    <span className="text-gray-600">Not configured</span>
                  </span>
                )}
              </p>
            </div>
            {isConnected && (
              <div className="text-right text-sm">
                <p className="text-gray-500">Charity Ref:</p>
                <p className="font-mono font-medium text-gray-900">
                  {settings.hmrcCharityRef}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-2">What this integration enables:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Submit Gift Aid claims directly to HMRC Charities Online</li>
                <li>Automatically compile eligible donations from your records</li>
                <li>Track claim status and HMRC responses in real-time</li>
                <li>Support for Gift Aid Small Donations Scheme (GASDS)</li>
                <li>Full audit trail of submissions and responses (6+ year retention)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5" /> HMRC Credentials
          </h2>
          <form action={saveHmrcSettings} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="HMRC Charity Reference"
                name="hmrcCharityRef"
                defaultValue={settings.hmrcCharityRef || ""}
                placeholder="e.g. XR12345"
                required={settings.hmrcEnabled}
                maxLength={20}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700">Government Gateway</h3>
              <div>
                <Input
                  label="Government Gateway User ID"
                  name="hmrcGatewayUser"
                  defaultValue={settings.hmrcGatewayUser || ""}
                  placeholder="Your Government Gateway account username"
                  required={settings.hmrcEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">Your login username for HMRC Government Gateway</p>
              </div>
              <div>
                <Input
                  label="Government Gateway Password"
                  name="hmrcGatewayPassword"
                  type="password"
                  defaultValue={settings.hmrcGatewayPassword || ""}
                  placeholder="••••••••"
                  required={settings.hmrcEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">Your Government Gateway account password (stored encrypted)</p>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700">Advanced Settings</h3>
              <div>
                <Input
                  label="Software Vendor Sender ID (optional)"
                  name="hmrcSenderId"
                  defaultValue={settings.hmrcSenderId || ""}
                  placeholder="Leave blank for default"
                />
                <p className="text-xs text-gray-500 mt-1">Required if submitting on behalf of a software vendor</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="hmrcEnabled"
                  defaultChecked={settings.hmrcEnabled}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Enable HMRC Gift Aid Submission
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-7">
                When disabled, claims will be saved as drafts only. Enable to activate
                submission to HMRC.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/settings/integrations">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                <Crown className="h-4 w-4" /> Save HMRC Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need help?</h3>
          <p className="text-sm text-gray-600 mb-3">
            For information about setting up HMRC Gift Aid submission online, visit the official
            HMRC guidance pages.
          </p>
          <div className="flex gap-3">
            <a
              href="https://www.gov.uk/guidance/submit-gift-aid-claims-online"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              HMRC Gift Aid Claims →
            </a>
            <a
              href="https://www.gov.uk/guidance/charities-online"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              Charities Online →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
