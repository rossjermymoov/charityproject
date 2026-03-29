import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Mail, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function IntegrationsPage() {
  await requireAuth();

  const activeEmailProvider = await prisma.emailProvider.findFirst({
    where: { isDefault: true, isActive: true },
    select: { provider: true, fromEmail: true },
  });

  const integrations = [
    {
      icon: Mail,
      title: "Email Provider",
      description: activeEmailProvider
        ? `${activeEmailProvider.provider} — ${activeEmailProvider.fromEmail}`
        : "Configure SendGrid, Amazon SES, or Mailgun for sending emails",
      href: "/settings/integrations/email",
      status: activeEmailProvider ? "connected" : "not configured",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">Settings</Link>
          <span>/</span>
          <span>Integrations</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 mt-1">
          Connect third-party services to power email, notifications, and more
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {integrations.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="p-6 hover:bg-gray-50 transition-colors">
              <Link href={item.href}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Icon className="h-6 w-6 text-indigo-600 mt-1" />
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
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
