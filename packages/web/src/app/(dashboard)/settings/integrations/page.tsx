import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

// ── Inline SVG Logos ──────────────────────────────────────────────

function SendGridLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#1A82E2" />
      <path d="M14 18h8v8h-8zM22 26h8v8h-8zM22 18h8v-8h8v8h-8v8h-8z" fill="#fff" />
    </svg>
  );
}

function MailchimpLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#FFE01B" />
      <text x="24" y="30" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#241C15">M</text>
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

function JustGivingLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#AD29B6" />
      <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#fff">JG</text>
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

// ── Page ──────────────────────────────────────────────────────────

export default async function IntegrationsPage() {
  await requireAuth();

  const activeEmailProvider = await prisma.emailProvider.findFirst({
    where: { isDefault: true, isActive: true },
    select: { provider: true, fromEmail: true },
  });

  const integrations = [
    {
      logo: SendGridLogo,
      title: "Email Providers",
      description: activeEmailProvider
        ? `${activeEmailProvider.provider} — ${activeEmailProvider.fromEmail}`
        : "Configure SendGrid, Amazon SES, Mailgun, or Mailchimp for transactional email",
      href: "/settings/integrations/email",
      status: activeEmailProvider ? "connected" : "not configured",
      category: "Email & Marketing",
    },
    {
      logo: MailchimpLogo,
      title: "Mailchimp Marketing",
      description: "Sync contacts with Mailchimp audiences, manage lists, and track campaign engagement",
      href: "/settings/integrations/mailchimp",
      status: "not configured",
      category: "Email & Marketing",
    },
    {
      logo: StripeLogo,
      title: "Payment Providers",
      description: "Accept online donations via Stripe, GoCardless direct debit, and other payment gateways",
      href: "/settings/integrations/payments",
      status: "not configured",
      category: "Payments & Donations",
    },
    {
      logo: GoCardlessLogo,
      title: "GoCardless",
      description: "Set up recurring direct debit donations and standing order collection",
      href: "/settings/integrations/gocardless",
      status: "not configured",
      category: "Payments & Donations",
    },
    {
      logo: JustGivingLogo,
      title: "JustGiving",
      description: "Link fundraising pages, import donations, and track campaign performance",
      href: "/settings/integrations/justgiving",
      status: "not configured",
      category: "Fundraising",
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {integrations
              .filter((item) => item.category === category)
              .map((item) => {
                const Logo = item.logo;
                return (
                  <Card key={item.title} className="p-0 hover:bg-gray-50 transition-colors overflow-hidden">
                    <Link href={item.href} className="block p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Logo className="h-10 w-10 flex-shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{item.title}</h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
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
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
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
