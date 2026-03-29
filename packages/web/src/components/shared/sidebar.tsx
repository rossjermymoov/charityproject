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
  MapPin,
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
  UserCog,
  CreditCard,
  RefreshCw,
  BadgeCheck,
  Landmark,
  Briefcase,
  FileInput,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  roles?: string[];
}

const ALL_STAFF = ["ADMIN", "STAFF"];

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ALL_STAFF },

  // Donor portal
  { name: "divider", href: "", icon: LayoutDashboard, label: "My Account", roles: ["DONOR"] },
  { name: "My Donations", href: "/my/donations", icon: PoundSterling, roles: ["DONOR"] },
  { name: "My Gift Aid", href: "/my/gift-aid", icon: Heart, roles: ["DONOR"] },

  // Volunteer portal
  { name: "divider", href: "", icon: LayoutDashboard, label: "My Portal", roles: ["VOLUNTEER"] },
  { name: "My Broadcasts", href: "/my/broadcasts", icon: Radio, roles: ["VOLUNTEER"] },
  { name: "My Assignments", href: "/my/assignments", icon: Calendar, roles: ["VOLUNTEER"] },
  { name: "My Hours", href: "/my/hours", icon: Clock, roles: ["VOLUNTEER"] },
  { name: "My Training", href: "/my/training", icon: GraduationCap, roles: ["VOLUNTEER"] },

  // CRM
  { name: "divider", href: "", icon: LayoutDashboard, label: "CRM", roles: ALL_STAFF },
  { name: "Contacts", href: "/crm/contacts", icon: Users, roles: ALL_STAFF },
  { name: "Organisations", href: "/crm/organisations", icon: Building2, roles: ALL_STAFF },

  // Volunteers
  { name: "divider", href: "", icon: LayoutDashboard, label: "Volunteers", roles: ALL_STAFF },
  { name: "Volunteers", href: "/volunteers", icon: UserCheck, roles: ALL_STAFF },
  { name: "Departments", href: "/volunteers/departments", icon: Building2, roles: ALL_STAFF },
  { name: "Skills", href: "/volunteers/skills", icon: Wrench, roles: ALL_STAFF },
  { name: "Training", href: "/volunteers/training", icon: GraduationCap, roles: ALL_STAFF },
  { name: "Assignments", href: "/assignments", icon: Calendar, roles: ALL_STAFF },
  { name: "Log Hours", href: "/volunteers/hours", icon: Clock, roles: ALL_STAFF },

  // Finance
  { name: "divider", href: "", icon: LayoutDashboard, label: "Finance", roles: ALL_STAFF },
  { name: "Donations", href: "/finance/donations", icon: PoundSterling, roles: ALL_STAFF },
  { name: "Payments", href: "/finance/payments", icon: CreditCard, roles: ALL_STAFF },
  { name: "Subscriptions", href: "/finance/subscriptions", icon: RefreshCw, roles: ALL_STAFF },
  { name: "Memberships", href: "/finance/memberships", icon: BadgeCheck, roles: ALL_STAFF },
  { name: "Gift Aid", href: "/finance/gift-aid", icon: Heart, roles: ALL_STAFF },
  { name: "Grants", href: "/finance/grants", icon: Landmark, roles: ALL_STAFF },
  { name: "Legacies", href: "/finance/legacies", icon: Flower2, roles: ALL_STAFF },
  { name: "Ledger Codes", href: "/finance/ledger-codes", icon: BookOpen, roles: ALL_STAFF },
  { name: "Collection Tins", href: "/finance/collection-tins", icon: Package, roles: ALL_STAFF },
  { name: "Tin Locations", href: "/finance/collection-tins/locations", icon: MapPin, roles: ALL_STAFF },
  { name: "Tin Reports", href: "/finance/collection-tins/reports", icon: BarChart3, roles: ALL_STAFF },
  { name: "Tribute Funds", href: "/finance/tribute-funds", icon: Flower2, roles: ALL_STAFF },

  // Cases
  { name: "divider", href: "", icon: LayoutDashboard, label: "Case Management", roles: ALL_STAFF },
  { name: "Cases", href: "/cases", icon: Briefcase, roles: ALL_STAFF },

  // Events & Marketing
  { name: "divider", href: "", icon: LayoutDashboard, label: "Events & Marketing", roles: ALL_STAFF },
  { name: "Events", href: "/events", icon: CalendarDays, roles: ALL_STAFF },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone, roles: ALL_STAFF },

  // Communications
  { name: "divider", href: "", icon: LayoutDashboard, label: "Communications", roles: ALL_STAFF },
  { name: "Broadcasts", href: "/broadcasts", icon: Radio, roles: ALL_STAFF },
  { name: "Reminders", href: "/reminders", icon: Bell, roles: ALL_STAFF },

  // Compliance
  { name: "divider", href: "", icon: LayoutDashboard, label: "Compliance (DPO)", roles: ALL_STAFF },
  { name: "DPO Dashboard", href: "/compliance", icon: ShieldCheck, roles: ALL_STAFF },
  { name: "DPIAs", href: "/compliance/dpias", icon: FileSearch, roles: ALL_STAFF },
  { name: "Data Breaches", href: "/compliance/breaches", icon: AlertTriangle, roles: ALL_STAFF },
  { name: "SARs", href: "/compliance/sars", icon: FileText, roles: ALL_STAFF },
  { name: "ROPA", href: "/compliance/ropa", icon: Database, roles: ALL_STAFF },
  { name: "Asset Register", href: "/compliance/assets", icon: ClipboardCheck, roles: ALL_STAFF },
  { name: "Clinical Safety", href: "/compliance/clinical-safety", icon: Activity, roles: ALL_STAFF },
  { name: "Consent Trail", href: "/compliance/consent-trail", icon: Shield, roles: ALL_STAFF },

  // Forms
  { name: "divider", href: "", icon: LayoutDashboard, label: "Forms", roles: ALL_STAFF },
  { name: "Form Builder", href: "/settings/forms", icon: FileInput, roles: ALL_STAFF },

  // Insights
  { name: "divider", href: "", icon: LayoutDashboard, label: "Insights", roles: ALL_STAFF },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ALL_STAFF },
  { name: "Audit Log", href: "/settings/audit-log", icon: Shield, roles: ALL_STAFF },
];

export function Sidebar({ userRole = "STAFF" }: { userRole?: string }) {
  const pathname = usePathname();

  const filteredNav = navigation.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  // Remove orphaned dividers
  const cleanedNav = filteredNav.filter((item, idx) => {
    if (item.name !== "divider") return true;
    const next = filteredNav[idx + 1];
    if (!next || next.name === "divider") return false;
    return true;
  });

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">CO</span>
          </div>
          <span className="text-white font-semibold text-lg">CharityOS</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {cleanedNav.map((item, idx) => {
          if (item.name === "divider") {
            return (
              <div key={idx} className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {item.label}
                </p>
              </div>
            );
          }

          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");

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

      <div className="border-t border-gray-700 p-3 space-y-1">
        {userRole === "ADMIN" && (
          <Link
            href="/settings/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <UserCog className="h-5 w-5" />
            User Management
          </Link>
        )}
        {["ADMIN", "STAFF"].includes(userRole) && (
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        )}
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
