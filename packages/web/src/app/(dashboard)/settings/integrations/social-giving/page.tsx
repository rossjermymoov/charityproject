import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, Share2, TrendingUp } from "lucide-react";

export default async function SocialGivingIntegrationPage() {
  await requireAuth();

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
          <span>Social Media Giving</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/integrations"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Social Media Giving
            </h1>
            <p className="text-gray-500 mt-1">
              Connect Facebook and Instagram fundraisers to import donations
            </p>
          </div>
        </div>
      </div>

      {/* Facebook Fundraiser */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" rx="10" fill="#1877F2" />
              <path
                d="M26 38v-9h3l0.5-3.5h-3.5v-2c0-1 0.3-1.7 1.7-1.7h1.8v-3c-0.3 0-1.5-0.1-2.8-0.1-2.8 0-4.7 1.7-4.7 4.8v2.6h-3v3.5h3v9h3.5z"
                fill="#fff"
              />
            </svg>
            <h3 className="font-semibold text-gray-900">
              Facebook Fundraisers
            </h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              App ID
            </label>
            <Input placeholder="Your Facebook App ID" defaultValue="" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              App Secret
            </label>
            <Input type="password" placeholder="xxxxxxxxxxxxxxxx" defaultValue="" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Page Access Token
            </label>
            <Input
              type="password"
              placeholder="EAABs..."
              defaultValue=""
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your token from{" "}
              <a
                href="https://developers.facebook.com/"
                target="_blank"
                rel="noopener"
                className="text-blue-600 underline"
              >
                Facebook Developers
              </a>
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline">Test Connection</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Connect Facebook
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instagram Giving */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="ig-gradient"
                  x1="0%"
                  y1="100%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#FD5949" />
                  <stop offset="5%" stopColor="#D6249F" />
                  <stop offset="45%" stopColor="#529B2F" />
                </linearGradient>
              </defs>
              <rect width="48" height="48" rx="10" fill="url(#ig-gradient)" />
              <circle cx="24" cy="24" r="7" fill="#fff" />
              <circle cx="34" cy="14" r="1.5" fill="#fff" />
              <rect
                x="16"
                y="16"
                width="16"
                height="16"
                rx="4"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              />
            </svg>
            <h3 className="font-semibold text-gray-900">Instagram Giving</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Business Account ID
            </label>
            <Input placeholder="Your Instagram Business Account ID" defaultValue="" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Access Token
            </label>
            <Input type="password" placeholder="EAABs..." defaultValue="" />
            <p className="text-xs text-gray-500 mt-1">
              Use the same token from your Facebook App configuration
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline">Test Connection</Button>
            <Button className="bg-pink-600 hover:bg-pink-700">
              Connect Instagram
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
                Automatically import donations from Facebook and Instagram
                fundraisers
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
                  Automatically link donations to existing contact records by
                  email
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
            Fundraiser Donations
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Automatically import donations from Facebook and Instagram
            fundraisers
          </p>
        </Card>
        <Card className="p-5">
          <Share2 className="h-6 w-6 text-pink-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Social Tracking</h4>
          <p className="text-xs text-gray-500 mt-1">
            Track which fundraisers are performing best and who is fundraising
            for you
          </p>
        </Card>
        <Card className="p-5">
          <TrendingUp className="h-6 w-6 text-blue-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">
            Donor Insights
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Identify peer-to-peer fundraisers and track social media donation
            trends
          </p>
        </Card>
      </div>
    </div>
  );
}
