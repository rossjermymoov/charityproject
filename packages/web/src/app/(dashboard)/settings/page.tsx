import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  FileText,
  Zap,
  Users,
  Calendar,
  Store,
  Palette,
  Target,
  Activity,
  Coins,
  Clock,
  User,
  Building2,
  FileImage,
} from "lucide-react";
import HeadOfficeForm from "./head-office-form";
import LetterheadForm from "./letterhead-form";

export default async function SettingsPage() {
  const user = await requireAuth();

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { headOfficeAddress: true, headOfficeLat: true, headOfficeLng: true, letterheadImage: true },
  });

  const settingsLinks = [
    { icon: Calendar, title: "Financial Year", href: "/settings/financial-year", color: "text-blue-600 bg-blue-50" },
    { icon: Target, title: "Event Targets", href: "/settings/events", color: "text-orange-600 bg-orange-50" },
    { icon: Coins, title: "Collection Tins", href: "/settings/collection-tins", color: "text-amber-600 bg-amber-50" },
    { icon: Store, title: "Shops", href: "/settings/shops", color: "text-emerald-600 bg-emerald-50" },
    { icon: Palette, title: "Branding", href: "/settings/branding", color: "text-pink-600 bg-pink-50" },
    { icon: Shield, title: "Audit Log", href: "/settings/audit-log", color: "text-slate-600 bg-slate-50" },
    { icon: FileText, title: "Data Retention", href: "/settings/data-retention", color: "text-violet-600 bg-violet-50" },
    { icon: Zap, title: "Integrations", href: "/settings/integrations", color: "text-yellow-600 bg-yellow-50" },
    { icon: Users, title: "Users", href: "/settings/users", color: "text-indigo-600 bg-indigo-50" },
    { icon: Activity, title: "Test Agent", href: "/settings/test-agent", color: "text-rose-600 bg-rose-50" },
    { icon: Clock, title: "Scheduled Jobs", href: "/settings/scheduled-jobs", color: "text-cyan-600 bg-cyan-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization&apos;s configuration and policies</p>
      </div>

      {/* Top row: Current User + Head Office + Letterhead */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current User — compact */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
              <User className="h-4 w-4 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Current User</h3>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{user.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900 truncate ml-2">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Role</span>
              <Badge className="bg-teal-100 text-teal-800 text-xs">{user.role}</Badge>
            </div>
          </div>
        </Card>

        {/* Head Office — compact */}
        <Card className="p-4">
          <HeadOfficeForm
            currentAddress={settings?.headOfficeAddress || null}
            lat={settings?.headOfficeLat || null}
            lng={settings?.headOfficeLng || null}
          />
        </Card>

        {/* Letterhead — compact */}
        <Card className="p-4">
          <LetterheadForm currentImage={settings?.letterheadImage || null} />
        </Card>
      </div>

      {/* Settings grid — compact tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          const [textColor, bgColor] = link.color.split(" ");
          return (
            <Link key={link.title} href={link.href}>
              <Card className="p-4 h-full transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group">
                <div className="flex flex-col items-center text-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${textColor}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-tight">
                    {link.title}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Help — compact inline */}
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm">
        <span className="text-indigo-600 font-medium">Need help?</span>
        <span className="text-indigo-700">Contact your system administrator for GDPR, data retention, or account queries.</span>
      </div>
    </div>
  );
}
