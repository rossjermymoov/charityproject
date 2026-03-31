import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { addEmailProvider } from "../email/actions";
import { ProviderList } from "../email/provider-list";

const RETURN_TO = "/settings/integrations/ses";

export default async function AmazonSESPage() {
  await requireAuth();

  const providers = await prisma.emailProvider.findMany({
    where: { provider: "SES" },
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
          <span>Amazon SES</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#FF9900" />
              <path d="M14 28c4 3 10 4 16 2l1.5 2C25 35 17 34 12 30l2-2z" fill="#fff" />
              <path d="M33 28l-2-1.5c1.5-2 2-4 2-6.5 0-5-4-9-9-9s-9 4-9 9 4 9 9 9c2 0 4-.5 5.5-1.5l2 1.5c-2 1.5-4.5 2.5-7.5 2.5-7 0-12-5-12-11.5S17 9 24 9s12 5 12 11.5c0 3-1 5.5-3 7.5z" fill="#fff" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Amazon SES</h1>
              <p className="text-gray-500 mt-1">
                AWS Simple Email Service for high-volume, cost-effective email delivery
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProviderList providers={providers} returnTo={RETURN_TO} />

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add Amazon SES Configuration
          </h2>
          <form action={addEmailProvider} className="space-y-6">
            <input type="hidden" name="provider" value="SES" />
            <input type="hidden" name="returnTo" value={RETURN_TO} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Display Name" name="name" required placeholder="e.g. Production SES" />
              <Input label="From Email" name="fromEmail" type="email" required placeholder="noreply@yourcharity.org" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="From Name" name="fromName" required placeholder="Your Charity Name" />
              <Input label="Reply-To Email (optional)" name="replyToEmail" type="email" placeholder="hello@yourcharity.org" />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700">AWS Credentials</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="AWS Access Key ID" name="accessKeyId" type="password" required placeholder="AKIA..." />
                <Input label="AWS Secret Access Key" name="secretAccessKey" type="password" required placeholder="wJal..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AWS Region</label>
                <select name="region" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="eu-west-1">EU (Ireland) — eu-west-1</option>
                  <option value="eu-west-2">EU (London) — eu-west-2</option>
                  <option value="us-east-1">US East (N. Virginia) — us-east-1</option>
                  <option value="us-west-2">US West (Oregon) — us-west-2</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore) — ap-southeast-1</option>
                  <option value="ap-southeast-2">Asia Pacific (Sydney) — ap-southeast-2</option>
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Create IAM credentials with <code>ses:SendEmail</code> and <code>ses:SendRawEmail</code> permissions.
                Ensure your From address is verified in SES.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                <Plus className="h-4 w-4" /> Add Amazon SES
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
