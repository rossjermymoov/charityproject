import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { addEmailProvider } from "../email/actions";
import { ProviderList } from "../email/provider-list";

const RETURN_TO = "/settings/integrations/mailgun";

export default async function MailgunPage() {
  await requireAuth();

  const providers = await prisma.emailProvider.findMany({
    where: { provider: "MAILGUN" },
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
          <span>Mailgun</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#F06B54" />
              <path d="M24 12c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="#fff" />
              <circle cx="24" cy="24" r="4" fill="#fff" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mailgun</h1>
              <p className="text-gray-500 mt-1">
                Powerful email API for sending, receiving, and tracking transactional emails
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProviderList providers={providers} returnTo={RETURN_TO} />

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add Mailgun Configuration
          </h2>
          <form action={addEmailProvider} className="space-y-6">
            <input type="hidden" name="provider" value="MAILGUN" />
            <input type="hidden" name="returnTo" value={RETURN_TO} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Display Name" name="name" required placeholder="e.g. Production Mailgun" />
              <Input label="From Email" name="fromEmail" type="email" required placeholder="noreply@yourcharity.org" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="From Name" name="fromName" required placeholder="Your Charity Name" />
              <Input label="Reply-To Email (optional)" name="replyToEmail" type="email" placeholder="hello@yourcharity.org" />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700">Mailgun Credentials</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="API Key" name="apiKey" type="password" required placeholder="key-xxxxxxxxxxxxxxxx" />
                <Input label="Sending Domain" name="domain" required placeholder="mg.yourcharity.org" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select name="mgRegion" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="US">US</option>
                  <option value="EU">EU</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Find your API key at{" "}
                <a href="https://app.mailgun.com/settings/api_security" target="_blank" rel="noopener" className="text-indigo-600 underline">
                  Mailgun → Settings → API Security
                </a>
                . Your sending domain must be verified.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                <Plus className="h-4 w-4" /> Add Mailgun
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
