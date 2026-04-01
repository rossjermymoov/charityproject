import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { addEmailProvider } from "../email/actions";
import { ProviderList } from "../email/provider-list";

const RETURN_TO = "/settings/integrations/dotdigital";

export default async function DotdigitalPage() {
  await requireAuth();

  const providers = await prisma.emailProvider.findMany({
    where: { provider: "DOTDIGITAL" },
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
          <span>Dotdigital</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#7C3AED" />
              <circle cx="24" cy="22" r="8" fill="#fff" />
              <circle cx="24" cy="22" r="4" fill="#7C3AED" />
              <text x="24" y="42" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#fff">dotdigital</text>
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dotdigital</h1>
              <p className="text-gray-500 mt-1">
                Omnichannel marketing automation with email, SMS, and audience management
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProviderList providers={providers} returnTo={RETURN_TO} />

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add Dotdigital Configuration
          </h2>
          <form action={addEmailProvider} className="space-y-6">
            <input type="hidden" name="provider" value="DOTDIGITAL" />
            <input type="hidden" name="returnTo" value={RETURN_TO} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Display Name" name="name" required placeholder="e.g. Production Dotdigital" />
              <Input label="From Email" name="fromEmail" type="email" required placeholder="noreply@yourcharity.org" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="From Name" name="fromName" required placeholder="Your Charity Name" />
              <Input label="Reply-To Email (optional)" name="replyToEmail" type="email" placeholder="hello@yourcharity.org" />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700">Dotdigital API Credentials</h3>
              <Input label="API User Email" name="apiKey" type="text" required placeholder="apiuser-xxxxxxxx@apiconnector.com" />
              <p className="text-xs text-gray-500">
                Your API user email address. Create one at{" "}
                <a href="https://login.dotdigital.com" target="_blank" rel="noopener" className="text-indigo-600 underline">
                  Dotdigital
                </a>
                {" "}→ Settings → Access → API users.
              </p>
              <Input label="API Password" name="domain" type="password" required placeholder="Your API user password" />
              <p className="text-xs text-gray-500">
                The password you set when creating the API user (min 8 characters).
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Region</label>
                <select
                  name="region"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  defaultValue="r1"
                >
                  <option value="r1">Europe (r1-api.dotdigital.com)</option>
                  <option value="r2">North America (r2-api.dotdigital.com)</option>
                  <option value="r3">Asia Pacific (r3-api.dotdigital.com)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the region that matches your Dotdigital account. Check your login URL to determine this.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                <Plus className="h-4 w-4" /> Add Dotdigital
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
