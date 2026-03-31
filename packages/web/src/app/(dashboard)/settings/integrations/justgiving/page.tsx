import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, TrendingUp, Link2 } from "lucide-react";

export default async function JustGivingPage() {
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
          <span>JustGiving</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">JustGiving</h1>
            <p className="text-gray-500 mt-1">
              Connect fundraising pages and import donations
            </p>
          </div>
        </div>
      </div>

      {/* Connection Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <svg className="h-10 w-10 flex-shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#AD29B6" />
              <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#fff">JG</text>
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900">Connect JustGiving</h3>
              <p className="text-sm text-gray-600 mt-1">
                Link your JustGiving charity account to automatically import fundraiser pages, donations, and Gift Aid declarations.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Charity ID" name="jgCharityId" placeholder="Your JustGiving Charity ID" />
            <Input label="API Key" name="jgApiKey" type="password" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            <p className="text-xs text-gray-500">
              Register for API access at{" "}
              <a href="https://developer.justgiving.com/" target="_blank" rel="noopener" className="text-indigo-600 underline">
                JustGiving Developer Portal
              </a>
              . You&apos;ll need your Charity ID from your JustGiving dashboard.
            </p>
          </div>

          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Connect JustGiving
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <Heart className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Donation Import</h4>
          <p className="text-xs text-gray-500 mt-1">Automatically import donations and match them to donor records in CharityOS</p>
        </Card>
        <Card className="p-5">
          <Link2 className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Fundraiser Tracking</h4>
          <p className="text-xs text-gray-500 mt-1">Monitor active fundraising pages, targets, and progress across all your campaigns</p>
        </Card>
        <Card className="p-5">
          <TrendingUp className="h-6 w-6 text-indigo-600 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Gift Aid Claims</h4>
          <p className="text-xs text-gray-500 mt-1">Import Gift Aid declarations from JustGiving to maximise your tax reclaims</p>
        </Card>
      </div>
    </div>
  );
}
