import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { addEmailProvider } from "../email/actions";
import { ProviderList } from "../email/provider-list";

const RETURN_TO = "/settings/integrations/sendgrid";

export default async function SendGridPage() {
  await requireAuth();

  const providers = await prisma.emailProvider.findMany({
    where: { provider: "SENDGRID" },
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
          <span>SendGrid</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#1A82E2" />
              <path d="M14 18h8v8h-8zM22 26h8v8h-8zM22 18h8v-8h8v8h-8v8h-8z" fill="#fff" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SendGrid</h1>
              <p className="text-gray-500 mt-1">
                Cloud-based email delivery for transactional and marketing emails
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProviderList providers={providers} returnTo={RETURN_TO} />

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add SendGrid Configuration
          </h2>
          <form action={addEmailProvider} className="space-y-6">
            <input type="hidden" name="provider" value="SENDGRID" />
            <input type="hidden" name="returnTo" value={RETURN_TO} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Display Name" name="name" required placeholder="e.g. Production SendGrid" />
              <Input label="From Email" name="fromEmail" type="email" required placeholder="noreply@yourcharity.org" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="From Name" name="fromName" required placeholder="Your Charity Name" />
              <Input label="Reply-To Email (optional)" name="replyToEmail" type="email" placeholder="hello@yourcharity.org" />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700">SendGrid Credentials</h3>
              <Input label="API Key" name="apiKey" type="password" required placeholder="SG.xxxxxxxxxxxxxxxx" />
              <p className="text-xs text-gray-500">
                Create an API key at{" "}
                <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener" className="text-indigo-600 underline">
                  SendGrid Settings → API Keys
                </a>
                . Ensure it has &quot;Mail Send&quot; permission.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                <Plus className="h-4 w-4" /> Add SendGrid
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
