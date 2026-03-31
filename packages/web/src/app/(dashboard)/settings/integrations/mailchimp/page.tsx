import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RefreshCw, Users, BarChart3 } from "lucide-react";

export default async function MailchimpMarketingPage() {
  await requireAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">Settings</Link>
          <span>/</span>
          <Link href="/settings/integrations" className="hover:text-gray-700">Integrations</Link>
          <span>/</span>
          <span>Mailchimp Marketing</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mailchimp Marketing</h1>
            <p className="text-gray-500 mt-1">
              Sync your contacts with Mailchimp audiences for email marketing campaigns
            </p>
          </div>
        </div>
      </div>

      {/* Connection Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="h-8 w-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="10" fill="#FFE01B" />
                <text x="24" y="30" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#241C15">M</text>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Connect Your Mailchimp Account</h3>
              <p className="text-sm text-gray-600 mt-1">
                Enter your Mailchimp API key to sync contacts, manage audiences, and track campaign performance directly from CharityOS.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Mailchimp API Key"
              name="apiKey"
              type="password"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-usXX"
            />
            <p className="text-xs text-gray-500">
              Find your API key at{" "}
              <a href="https://us1.admin.mailchimp.com/account/api/" target="_blank" rel="noopener" className="text-indigo-600 underline">
                Mailchimp → Account → Extras → API Keys
              </a>
              . The suffix (e.g. -us12) tells us which data centre to use.
            </p>
          </div>

          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Connect Mailchimp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <Users className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Audience Sync</h4>
          <p className="text-xs text-gray-500 mt-1">Automatically sync CharityOS contacts to Mailchimp audiences with tags and segments</p>
        </Card>
        <Card className="p-5">
          <RefreshCw className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Two-Way Sync</h4>
          <p className="text-xs text-gray-500 mt-1">Keep contact data up to date in both systems with automatic bi-directional syncing</p>
        </Card>
        <Card className="p-5">
          <BarChart3 className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Campaign Insights</h4>
          <p className="text-xs text-gray-500 mt-1">View campaign open rates, click rates, and engagement metrics on contact profiles</p>
        </Card>
      </div>

      <Card className="p-6 bg-blue-50 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">About this integration</h3>
        <p className="text-sm text-blue-800">
          The Mailchimp Marketing integration syncs your contacts and their communication preferences.
          This is separate from transactional email — to send system emails (receipts, notifications) via Mailchimp,
          configure Mandrill in the Email Providers section.
        </p>
      </Card>
    </div>
  );
}
