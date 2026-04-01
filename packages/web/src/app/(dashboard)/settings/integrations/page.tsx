import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

// ── Inline SVG Logos ──────────────────────────────────────────────

function MailchimpLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#FFE01B" />
      <text x="24" y="30" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#241C15">M</text>
    </svg>
  );
}

function AmazonSESLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#FF9900" />
      <path d="M14 28c4 3 10 4 16 2l1.5 2C25 35 17 34 12 30l2-2z" fill="#fff" />
      <path d="M33 28l-2-1.5c1.5-2 2-4 2-6.5 0-5-4-9-9-9s-9 4-9 9 4 9 9 9c2 0 4-.5 5.5-1.5l2 1.5c-2 1.5-4.5 2.5-7.5 2.5-7 0-12-5-12-11.5S17 9 24 9s12 5 12 11.5c0 3-1 5.5-3 7.5z" fill="#fff" />
    </svg>
  );
}

function SendGridLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#1A82E2" />
      <path d="M14 18h8v8h-8zM22 26h8v8h-8zM22 18h8v-8h8v8h-8v8h-8z" fill="#fff" />
    </svg>
  );
}

function MailgunLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#F06B54" />
      <path d="M24 12c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="#fff" />
      <circle cx="24" cy="24" r="4" fill="#fff" />
    </svg>
  );
}

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#635BFF" />
      <path d="M22.5 18.3c0-1.2 1-1.7 2.5-1.7 2.2 0 5 .7 7.2 1.9V12c-2.4-1-4.8-1.3-7.2-1.3-5.9 0-9.8 3.1-9.8 8.2 0 8 11 6.7 11 10.2 0 1.4-1.2 1.9-2.9 1.9-2.5 0-5.7-1-8.2-2.4v6.6c2.8 1.2 5.6 1.7 8.2 1.7 6 0 10.2-3 10.2-8.2C33.5 20.2 22.5 21.7 22.5 18.3z" fill="#fff" />
    </svg>
  );
}

function GoCardlessLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#1D1D3F" />
      <text x="24" y="31" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#2FCFA5">GC</text>
    </svg>
  );
}

function JustGivingLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#AD29B6" />
      <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#fff">JG</text>
    </svg>
  );
}

function HMRCLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#003078" />
      <path d="M24 10l-2 6h-6l5 3.5-2 6 5-3.5 5 3.5-2-6 5-3.5h-6z" fill="#fff" />
      <text x="24" y="38" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">HMRC</text>
    </svg>
  );
}

function DotdigitalLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#7C3AED" />
      <circle cx="24" cy="22" r="8" fill="#fff" />
      <circle cx="24" cy="22" r="4" fill="#7C3AED" />
      <text x="24" y="42" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#fff">dotdigital</text>
    </svg>
  );
}

function SageIntacctLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#00DC82" />
      <text x="24" y="28" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fff">sage</text>
      <text x="24" y="38" textAnchor="middle" fontSize="7" fill="#fff">intacct</text>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default async function IntegrationsPage() {
  await requireAuth();

  // Check which email providers are configured
  const configuredProviders = await prisma.emailProvider.findMany({
    where: { isActive: true },
    select: { provider: true, isDefault: true, fromEmail: true },
  });

  const providerStatus = (type: string) => {
    const found = configuredProviders.filter((p) => p.provider === type);
    if (found.length === 0) return { status: "not configured", description: "" };
    const def = found.find((p) => p.isDefault);
    return {
      status: "connected",
      description: def ? `Default — ${def.fromEmail}` : `${found.length} configured`,
    };
  };

  const mailchimp = providerStatus("MAILCHIMP");
  const ses = providerStatus("SES");
  const sendgrid = providerStatus("SENDGRID");
  const mailgun = providerStatus("MAILGUN");
  const dotdigital = providerStatus("DOTDIGITAL");

  const integrations = [
    {
      logo: MailchimpLogo,
      title: "Mailchimp",
      description: mailchimp.status === "connected"
        ? mailchimp.description
        : "Email marketing, audience sync, and transactional email via Mandrill",
      href: "/settings/integrations/mailchimp",
      status: mailchimp.status,
      category: "Email & Marketing",
    },
    {
      logo: AmazonSESLogo,
      title: "Amazon SES",
      description: ses.status === "connected"
        ? ses.description
        : "AWS Simple Email Service for high-volume, cost-effective delivery",
      href: "/settings/integrations/ses",
      status: ses.status,
      category: "Email & Marketing",
    },
    {
      logo: SendGridLogo,
      title: "SendGrid",
      description: sendgrid.status === "connected"
        ? sendgrid.description
        : "Cloud-based email delivery for transactional and marketing emails",
      href: "/settings/integrations/sendgrid",
      status: sendgrid.status,
      category: "Email & Marketing",
    },
    {
      logo: MailgunLogo,
      title: "Mailgun",
      description: mailgun.status === "connected"
        ? mailgun.description
        : "Powerful email API for sending, receiving, and tracking emails",
      href: "/settings/integrations/mailgun",
      status: mailgun.status,
      category: "Email & Marketing",
    },
    {
      logo: DotdigitalLogo,
      title: "Dotdigital",
      description: dotdigital.status === "connected"
        ? dotdigital.description
        : "Omnichannel marketing automation with email, SMS, and audience management",
      href: "/settings/integrations/dotdigital",
      status: dotdigital.status,
      category: "Email & Marketing",
    },
    {
      logo: StripeLogo,
      title: "Stripe",
      description: "Accept card payments, Apple Pay, and Google Pay for online donations",
      href: "/settings/integrations/payments",
      status: "not configured",
      category: "Payment Providers",
    },
    {
      logo: GoCardlessLogo,
      title: "GoCardless",
      description: "Collect recurring donations via Direct Debit",
      href: "/settings/integrations/gocardless",
      status: "not configured",
      category: "Payment Providers",
    },
    {
      logo: JustGivingLogo,
      title: "JustGiving",
      description: "Link fundraising pages, import donations, and track campaign performance",
      href: "/settings/integrations/justgiving",
      status: "not configured",
      category: "Fundraising",
    },
    {
      logo: HMRCLogo,
      title: "HMRC Gift Aid",
      description: "Submit Gift Aid claims directly to HMRC Charities Online and track status",
      href: "/settings/integrations/hmrc",
      status: "not configured",
      category: "Tax & Compliance",
    },
    {
      logo: SageIntacctLogo,
      title: "Sage Intacct",
      description: "Cloud accounting integration for syncing donations to GL and managing finances",
      href: "/settings/integrations/sage-intacct",
      status: "not configured",
      category: "Accounting & Finance",
    },
  ];

  const categories = Array.from(new Set(integrations.map((i) => i.category)));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">Settings</Link>
          <span>/</span>
          <span>Integrations</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 mt-1">
          Connect third-party services to power email, payments, fundraising, and marketing
        </p>
      </div>

      {categories.map((category) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {integrations
              .filter((item) => item.category === category)
              .map((item) => {
                const Logo = item.logo;
                return (
                  <Card key={item.title} className="p-0 hover:bg-gray-50 transition-colors overflow-hidden">
                    <Link href={item.href} className="block p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Logo className="h-10 w-10 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{item.title}</h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                                  item.status === "connected"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1 ml-2" />
                      </div>
                    </Link>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
