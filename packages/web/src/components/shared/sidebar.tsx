"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  UserCheck,
  Calendar,
  Clock,
  Radio,
  Bell,
  Settings,
  LayoutDashboard,
  Wrench,
  LogOut,
  PoundSterling,
  Heart,
  CalendarDays,
  Megaphone,
  Package,
  Flower2,
  GraduationCap,
  BarChart3,
  Shield,
  BookOpen,
  ShieldCheck,
  FileSearch,
  AlertTriangle,
  FileText,
  Database,
  Activity,
  ClipboardCheck,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },

  { name: "divider", href: "", icon: LayoutDashboard, label: "CRM" },
  { name: "Contacts", href: "/dashboard/crm/contacts", icon: Users },
  { name: "Organisations", href: "/dashboard/crm/organisations", icon: Building2 },

  { name: "divider", href: "", icon: LayoutDashboard, label: "Volunteers" },
  { name: "Volunteers", href: "/dashboard/volunteers", icon: UserCheck },
  { name: "Departments", href: "/dashboard/volunteers/departments", icon: Building2 },
  { name: "Skills", href: "/dashboard/volunteers/skills", icon: Wrench },
  { name: "Training", href: "/dashboard/volunteers/training", icon: GraduationCap },
  { name: "Assignments", href: "/dashboard/assignments", icon: Calendar },
  { name: "Hours", href: "/dashboard/volunteers/hours", icon: Clock },

  { name: "divider", href: "", icon: LayoutDashboard, label: "Finance" },
  { name: "Donations", href: "/dashboard/finance/donations", icon: PoundSterling },
  { name: "Gift Aid", href: "/dashboard/finance/gift-aid", icon: Heart },
  { name: "Ledger Codes", href: "/dashboard/finance/ledger-codes", icon: BookOpen },
  { name: "Collection Tins", href: "/dashboard/finance/collection-tins", icon: Package },
  { name: "Tribute Funds", href: "/dashboard/finance/tribute-funds", icon: Flower2 },

  { name: "divider", href: "", icon: LayoutDashboard, label: "Events & Marketing" },
  { name: "Events", href: "/dashboard/events", icon: CalendarDays },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },

  { name: "divider", href: "", icon: LayoutDashboard, label: "Communications" },
  { name: "Broadcasts", href: "/dashboard/broadcasts", icon: Radio },
  { name: "Reminders", href: "/dashboard/reminders", icon: Bell },

  { name: "divider", href: "", icon: LayoutDashboard, label: "Compliance (DPO)" },
  { name: "DPO Dashboard", href: "/dashboard/compliance", icon: ShieldCheck },
  { name: "DPIAs", href: "/dashboard/compliance/dpias", icon: FileSearch },
  { name: "Data Breaches", href: "/dashboard/compliance/breaches", icon: AlertTriangle },
  { name: "SARs", href: "/dashboard/compliance/sars", icon: FileText },
  { name: "ROPA", href: "/dashboard/compliance/ropa", icon: Database },
  { name: "Asset Register", href: "/dashboard/compliance/assets", icon: ClipboardCheck },
  { name: "Clinical Safety", href: "/dashboard/compliance/clinical-safety", icon: Activity },
  { name: "Consent Trail", href: "/dashboard/compliance/consent-trail", icon: Shield },

  { name: "divider", href: "", icon: LayoutDashboard, label: "Insights" },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Audit Log", href: "/dashboard/settings/audit-log", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">CO</span>
          </div>
          <span className="text-white font-semibold text-lg">CharityOS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item, idx) => {
          if (item.name === "divider") {
            return (
              <div key={idx} className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {item.label}
                </p>
              </div>
            );
          }

          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-700 p-3 space-y-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
