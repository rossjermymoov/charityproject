import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  FileText,
  Zap,
  Users,
  Calendar,
  Store,
  Palette,
  ChevronRight,
  Target,
} from "lucide-react";

export default async function SettingsPage() {
  const user = await requireAuth();

  const settingsLinks = [
    {
      icon: Calendar,
      title: "Financial Year End",
      description: "Set your organisation's financial year end date for reporting and forecasting",
      href: "/settings/financial-year",
    },
    {
      icon: Target,
      title: "Events Targets",
      description: "Set annual income, cost budget, and profit targets for your events programme",
      href: "/settings/events",
    },
    {
      icon: Store,
      title: "Shops & Locations",
      description: "Manage shop locations and generate QR codes for Retail Gift Aid",
      href: "/settings/shops",
    },
    {
      icon: Palette,
      title: "Branding",
      description: "White-label the system with your logo, colours, and organisation name",
      href: "/settings/branding",
    },
    {
      icon: Shield,
      title: "Audit Log",
      description: "Review all system activities and changes",
      href: "/settings/audit-log",
    },
    {
      icon: FileText,
      title: "Data Retention Policies",
      description: "Manage how long data is kept before archiving or deletion",
      href: "/settings/data-retention",
    },
    {
      icon: Zap,
      title: "Integrations",
      description: "Email providers, API connections, and third-party services",
      href: "/settings/integrations",
    },
    {
      icon: Users,
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      href: "/settings/users",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your organization's configuration and policies
        </p>
      </div>

      {/* Current user info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current User
        </h2>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="text-gray-900">{user.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Role</p>
            <p className="text-gray-900">{user.role}</p>
          </div>
        </div>
      </Card>

      {/* Settings sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Card
              key={link.title}
              className="p-6 transition-colors hover:bg-gray-50"
            >
              <Link href={link.href}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Icon className="h-6 w-6 text-indigo-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {link.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {link.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Help section */}
      <Card className="p-6 bg-indigo-50 border border-indigo-100">
        <h2 className="text-lg font-semibold text-indigo-900 mb-2">
          Need help?
        </h2>
        <p className="text-sm text-indigo-800 mb-4">
          For questions about data retention, GDPR compliance, or account settings,
          please contact your system administrator.
        </p>
      </Card>
    </div>
  );
}
