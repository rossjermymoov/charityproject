import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Mail, Plus, Trash2, Star, Send, CheckCircle, XCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { testEmailProvider } from "@/lib/email-providers";

export default async function EmailProvidersPage() {
  const user = await requireAuth();

  const providers = await prisma.emailProvider.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });

  async function addProvider(formData: FormData) {
    "use server";
    const session = await requireAuth();

    const provider = formData.get("provider") as string;
    const name = formData.get("name") as string;
    const fromEmail = formData.get("fromEmail") as string;
    const fromName = formData.get("fromName") as string;
    const replyToEmail = (formData.get("replyToEmail") as string) || null;

    const data: any = {
      name,
      provider,
      fromEmail,
      fromName,
      replyToEmail,
      createdById: session.id,
    };

    if (provider === "SENDGRID") {
      data.apiKey = formData.get("apiKey") as string;
    } else if (provider === "SES") {
      data.accessKeyId = formData.get("accessKeyId") as string;
      data.secretAccessKey = formData.get("secretAccessKey") as string;
      data.region = formData.get("region") as string;
    } else if (provider === "MAILGUN") {
      data.apiKey = formData.get("apiKey") as string;
      data.domain = formData.get("domain") as string;
      data.region = formData.get("mgRegion") as string || "US";
    } else if (provider === "MAILCHIMP") {
      data.apiKey = formData.get("apiKey") as string;
    }

    // If no other providers exist, make this the default
    const existingCount = await prisma.emailProvider.count();
    if (existingCount === 0) {
      data.isDefault = true;
    }

    await prisma.emailProvider.create({ data });
    redirect("/settings/integrations/email");
  }

  async function removeProvider(formData: FormData) {
    "use server";
    await requireAuth();
    const id = formData.get("id") as string;
    await prisma.emailProvider.delete({ where: { id } });
    revalidatePath("/settings/integrations/email");
  }

  async function setDefault(formData: FormData) {
    "use server";
    await requireAuth();
    const id = formData.get("id") as string;

    // Unset all defaults first
    await prisma.emailProvider.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set the new default
    await prisma.emailProvider.update({
      where: { id },
      data: { isDefault: true },
    });

    revalidatePath("/settings/integrations/email");
  }

  async function sendTestEmail(formData: FormData) {
    "use server";
    await requireAuth();
    const id = formData.get("id") as string;

    const provider = await prisma.emailProvider.findUnique({ where: { id } });
    if (!provider) return;

    const result = await testEmailProvider(provider);

    await prisma.emailProvider.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestResult: result.success ? "success" : result.error || "Unknown error",
      },
    });

    revalidatePath("/settings/integrations/email");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">Settings</Link>
          <span>/</span>
          <Link href="/settings/integrations" className="hover:text-gray-700">Integrations</Link>
          <span>/</span>
          <span>Email</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Providers</h1>
            <p className="text-gray-500 mt-1">
              Configure your email delivery service. Broadcasts and notifications will be sent through the default provider.
            </p>
          </div>
        </div>
      </div>

      {/* Existing Providers */}
      {providers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Configured Providers</h2>
          {providers.map((p) => (
            <Card key={p.id} className={`p-5 ${p.isDefault ? "ring-2 ring-indigo-500" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    p.provider === "SENDGRID" ? "bg-blue-100" :
                    p.provider === "SES" ? "bg-orange-100" :
                    p.provider === "MAILCHIMP" ? "bg-yellow-100" :
                    "bg-red-100"
                  }`}>
                    <Mail className={`h-5 w-5 ${
                      p.provider === "SENDGRID" ? "text-blue-600" :
                      p.provider === "SES" ? "text-orange-600" :
                      p.provider === "MAILCHIMP" ? "text-yellow-600" :
                      "text-red-600"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {p.provider}
                      </span>
                      {p.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                          <Star className="h-3 w-3" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {p.fromName} &lt;{p.fromEmail}&gt;
                      {p.replyToEmail && ` • Reply-to: ${p.replyToEmail}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Added by {p.createdBy.name}
                      {p.lastTestedAt && (
                        <>
                          {" • Last tested: "}
                          {p.lastTestResult === "success" ? (
                            <span className="text-green-600 inline-flex items-center gap-0.5">
                              <CheckCircle className="h-3 w-3 inline" /> Passed
                            </span>
                          ) : (
                            <span className="text-red-600 inline-flex items-center gap-0.5">
                              <XCircle className="h-3 w-3 inline" /> {p.lastTestResult}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={sendTestEmail}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" variant="outline" size="sm" className="gap-1">
                      <Send className="h-3 w-3" /> Test
                    </Button>
                  </form>
                  {!p.isDefault && (
                    <form action={setDefault}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" variant="outline" size="sm" className="gap-1">
                        <Star className="h-3 w-3" /> Make Default
                      </Button>
                    </form>
                  )}
                  <form action={removeProvider}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Provider */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add Email Provider
          </h2>
          <form action={addProvider} className="space-y-6">
            {/* Provider Selection */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <select
                name="provider"
                required
                id="providerSelect"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SENDGRID">SendGrid</option>
                <option value="SES">Amazon SES</option>
                <option value="MAILGUN">Mailgun</option>
                <option value="MAILCHIMP">Mailchimp (Mandrill)</option>
              </select>
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Display Name" name="name" required placeholder="e.g. Production SendGrid" />
              <Input label="From Email" name="fromEmail" type="email" required placeholder="noreply@yourcharity.org" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="From Name" name="fromName" required placeholder="Your Charity Name" />
              <Input label="Reply-To Email (optional)" name="replyToEmail" type="email" placeholder="hello@yourcharity.org" />
            </div>

            {/* Provider-specific: SendGrid */}
            <fieldset id="sendgridFields" className="space-y-4 border-t pt-4">
              <legend className="text-sm font-semibold text-gray-700">SendGrid Credentials</legend>
              <Input label="API Key" name="apiKey" type="password" placeholder="SG.xxxxxxxxxxxxxxxx" />
              <p className="text-xs text-gray-500">
                Create an API key at{" "}
                <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener" className="text-indigo-600 underline">
                  SendGrid Settings → API Keys
                </a>
                . Ensure it has "Mail Send" permission.
              </p>
            </fieldset>

            {/* Provider-specific: SES */}
            <fieldset id="sesFields" className="space-y-4 border-t pt-4">
              <legend className="text-sm font-semibold text-gray-700">Amazon SES Credentials</legend>
              <div className="grid grid-cols-2 gap-4">
                <Input label="AWS Access Key ID" name="accessKeyId" type="password" placeholder="AKIA..." />
                <Input label="AWS Secret Access Key" name="secretAccessKey" type="password" placeholder="wJal..." />
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
            </fieldset>

            {/* Provider-specific: Mailgun */}
            <fieldset id="mailgunFields" className="space-y-4 border-t pt-4">
              <legend className="text-sm font-semibold text-gray-700">Mailgun Credentials</legend>
              <div className="grid grid-cols-2 gap-4">
                <Input label="API Key" name="apiKey" type="password" placeholder="key-xxxxxxxxxxxxxxxx" />
                <Input label="Sending Domain" name="domain" placeholder="mg.yourcharity.org" />
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
            </fieldset>

            {/* Provider-specific: Mailchimp (Mandrill) */}
            <fieldset id="mailchimpFields" className="space-y-4 border-t pt-4">
              <legend className="text-sm font-semibold text-gray-700">Mailchimp / Mandrill Credentials</legend>
              <Input label="Mandrill API Key" name="apiKey" type="password" placeholder="xxxxxxxxxxxxxxxxxxxxxxxx" />
              <p className="text-xs text-gray-500">
                Mailchimp uses{" "}
                <a href="https://mandrillapp.com/settings" target="_blank" rel="noopener" className="text-indigo-600 underline">
                  Mandrill
                </a>
                {" "}for transactional email. You need a paid Mailchimp plan with the Transactional Email add-on.
                Find your API key in Mandrill → Settings → SMTP & API Info.
              </p>
            </fieldset>

            <div className="flex justify-end">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                <Plus className="h-4 w-4" /> Add Provider
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info box */}
      <Card className="p-6 bg-blue-50 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <p className="text-sm text-blue-800">
          All broadcast notifications, volunteer alerts, and system emails are sent through your default email provider.
          You can configure multiple providers and switch between them. Use the "Test" button to verify your credentials
          are working before making a provider the default.
        </p>
      </Card>
    </div>
  );
}
