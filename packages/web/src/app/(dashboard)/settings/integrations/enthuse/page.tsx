import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, Zap, TrendingUp } from "lucide-react";

export default async function EnthusePage() {
  await requireAuth();

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://example.com"}/api/webhooks/enthuse`;

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
          <span>Enthuse</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/integrations"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enthuse</h1>
            <p className="text-gray-500 mt-1">
              Import fundraising donations from Enthuse campaigns
            </p>
          </div>
        </div>
      </div>

      {/* Connection Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <svg
              className="h-10 w-10 flex-shrink-0"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" rx="10" fill="#00B67A" />
              <text
                x="24"
                y="31"
                textAnchor="middle"
                fontSize="18"
                fontWeight="bold"
                fill="#fff"
              >
                ES
              </text>
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900">
                Connect Enthuse
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Import donations, fundraising page details, and donor information
                from your Enthuse campaigns.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                API Key
              </label>
              <Input
                type="password"
                placeholder="Your Enthuse API key"
                defaultValue=""
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from your Enthuse account settings
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Charity ID
              </label>
              <Input placeholder="Your Charity ID" defaultValue="" />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Enthuse dashboard
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Webhook URL
              </h4>
              <code className="text-xs bg-white p-3 rounded border border-gray-200 block break-all">
                {webhookUrl}
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Add this to your Enthuse app configuration for real-time donation
                notifications
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Test Connection
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              Connect Enthuse
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Donation Sync Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="mt-1 h-4 w-4 text-indigo-600"
            />
            <div>
              <p className="font-medium text-gray-900">
                Auto-import Donations
              </p>
              <p className="text-sm text-gray-500">
                Automatically import new donations from Enthuse campaigns
              </p>
            </div>
          </label>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Sync Frequency
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>Real-time (Webhook)</option>
              <option>Every 30 minutes</option>
              <option>Every hour</option>
              <option>Every 4 hours</option>
              <option>Daily</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="mt-1 h-4 w-4 text-indigo-600"
              />
              <div>
                <p className="font-medium text-gray-900">
                  Match Donors to Contacts
                </p>
                <p className="text-sm text-gray-500">
                  Automatically link donations to existing contact records
                </p>
              </div>
            </label>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 text-indigo-600"
              />
              <div>
                <p className="font-medium text-gray-900">
                  Import Fundraiser Details
                </p>
                <p className="text-sm text-gray-500">
                  Store fundraising page information and targets
                </p>
              </div>
            </label>
          </div>

          <div className="border-t pt-4 flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <Heart className="h-6 w-6 text-red-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">
            Donation Import
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Automatically import donations from all your Enthuse fundraising
            campaigns
          </p>
        </Card>
        <Card className="p-5">
          <TrendingUp className="h-6 w-6 text-blue-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">
            Campaign Tracking
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Monitor fundraising progress, targets, and performance metrics in
            real-time
          </p>
        </Card>
        <Card className="p-5">
          <Zap className="h-6 w-6 text-yellow-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">
            Real-time Sync
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Receive instant notifications when donations are received through
            Enthuse
          </p>
        </Card>
      </div>
    </div>
  );
}
