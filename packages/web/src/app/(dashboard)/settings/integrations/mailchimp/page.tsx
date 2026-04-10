import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Plus, Users, RefreshCw, BarChart3 } from "lucide-react";
import { addEmailProvider } from "../email/actions";
import { ProviderList } from "../email/provider-list";

const RETURN_TO = "/settings/integrations/mailchimp";

export default async function MailchimpPage() {
  await requireAuth();

  const providers = await prisma.emailProvider.findMany({
    where: { provider: "MAILCHIMP" },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">Settings</Link>
          <span>/</span>
          <Link href="/settings/integrations" className="hover:text-gray-700">Integrations</Link>
          <span>/</span>
          <span>Mailchimp</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#FFE01B" />
              <text x="24" y="30" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#241C15">M</text>
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mailchimp</h1>
              <p className="text-gray-500 mt-1">
                Email marketing, audience management, and transactional email via Mandrill
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Transactional Email (Mandrill) ─────────────────────────── */}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Transactional Email (Mandrill)
        </h2>

        <ProviderList providers={providers} returnTo={RETURN_TO} />

        <Card className="mt-4">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add Mandrill Configuration
            </h2>
            <form action={addEmailProvider} className="space-y-6">
              <input type="hidden" name="provider" value="MAILCHIMP" />
              <input type="hidden" name="returnTo" value={RETURN_TO} />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Display Name" name="name" required placeholder="e.g. Mailchimp Transactional" />
                <Input label="From Email" name="fromEmail" type="email" required placeholder="noreply@yourcharity.org" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="From Name" name="fromName" required placeholder="Your Charity Name" />
                <Input label="Reply-To Email (optional)" name="replyToEmail" type="email" placeholder="hello@yourcharity.org" />
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700">Mandrill API Key</h3>
                <Input label="API Key" name="apiKey" type="password" required placeholder="xxxxxxxxxxxxxxxxxxxxxxxx" />
                <p className="text-xs text-gray-500">
                  Mailchimp uses{" "}
                  <a href="https://mandrillapp.com/settings" target="_blank" rel="noopener" className="text-indigo-600 underline">
                    Mandrill
                  </a>
                  {" "}for transactional email. You need a paid Mailchimp plan with the Transactional Email add-on.
                  Find your API key in Mandrill → Settings → SMTP &amp; API Info.
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                  <Plus className="h-4 w-4" /> Add Mandrill
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ─── Marketing / Audience Sync ──────────────────────────────── */}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Marketing &amp; Audience Sync
        </h2>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="10" fill="#FFE01B" />
                <text x="24" y="30" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#241C15">M</text>
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">Connect Mailchimp Audiences</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Enter your Mailchimp API key to sync contacts, manage audiences, and track campaign engagement directly from Parity CRM.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Mailchimp API Key"
                name="mcApiKey"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card className="p-5">
            <Users className="h-6 w-6 text-indigo-600 mb-2" />
            <h4 className="font-semibold text-gray-900 text-sm">Audience Sync</h4>
            <p className="text-xs text-gray-500 mt-1">Automatically sync Parity CRM contacts to Mailchimp audiences with tags and segments</p>
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
      </div>
    </div>
  );
}
