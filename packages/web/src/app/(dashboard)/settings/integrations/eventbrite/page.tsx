import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Users, Zap } from "lucide-react";

export default async function EventbriteIntegrationPage() {
  await requireAuth();

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://example.com"}/api/webhooks/eventbrite`;

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
          <span>Eventbrite</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/integrations"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Eventbrite</h1>
            <p className="text-gray-500 mt-1">
              Connect and sync event attendees and ticket sales
            </p>
          </div>
        </div>
      </div>

      {/* Connection Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <svg
              className="h-10 w-10 flex-shrink-0"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" rx="10" fill="#F05537" />
              <text
                x="24"
                y="31"
                textAnchor="middle"
                fontSize="20"
                fontWeight="bold"
                fill="#fff"
              >
                EB
              </text>
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900">
                Connect Eventbrite
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Sync your events, ticket sales, and attendee information directly
                to your charity CRM.
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
                placeholder="xxxxxxxxxxxx"
                defaultValue=""
              />
              <p className="text-xs text-gray-500 mt-1">
                Your personal API key from Eventbrite account settings
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Organization ID
              </label>
              <Input placeholder="123456789" defaultValue="" />
              <p className="text-xs text-gray-500 mt-1">
                Found in your Eventbrite dashboard URL
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
                Add this URL to your Eventbrite app settings under Webhooks
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Test Connection
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Connect Eventbrite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Sync Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="mt-1 h-4 w-4 text-indigo-600"
            />
            <div>
              <p className="font-medium text-gray-900">Auto-import Events</p>
              <p className="text-sm text-gray-500">
                Automatically sync new events from Eventbrite to your event
                calendar
              </p>
            </div>
          </label>

          <div className="border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="mt-1 h-4 w-4 text-indigo-600"
              />
              <div>
                <p className="font-medium text-gray-900">Sync Attendees</p>
                <p className="text-sm text-gray-500">
                  Import ticket holders as contacts and link them to events
                </p>
              </div>
            </label>
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
                  Sync Ticket Sales as Donations
                </p>
                <p className="text-sm text-gray-500">
                  Record ticket purchases as donations with attendee name and
                  email
                </p>
              </div>
            </label>
          </div>

          <div className="border-t pt-4 flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <Calendar className="h-6 w-6 text-orange-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Event Sync</h4>
          <p className="text-xs text-gray-500 mt-1">
            Automatically import your Eventbrite events into your charity
            calendar
          </p>
        </Card>
        <Card className="p-5">
          <Users className="h-6 w-6 text-orange-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">
            Attendee Import
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Create contacts from ticket holders and track event attendance
          </p>
        </Card>
        <Card className="p-5">
          <Zap className="h-6 w-6 text-orange-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">
            Real-time Updates
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Receive instant webhook notifications for new tickets and
            cancellations
          </p>
        </Card>
      </div>
    </div>
  );
}
