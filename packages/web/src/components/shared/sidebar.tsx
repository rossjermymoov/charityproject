"use client";

import { useState } from "react";
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
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  icon: LucideIcon;
  roles: string[];
  items: NavItem[];
}

const ALL_STAFF = ["ADMIN", "STAFF"];

const sections: NavSection[] = [
  {
    label: "Operations",
    icon: LayoutDashboard,
    roles: ALL_STAFF,
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Broadcasts", href: "/broadcasts", icon: Radio },
      { name: "Reminders", href: "/reminders", icon: Bell },
    ],
  },
  {
    label: "My Account",
    icon: PoundSterling,
    roles: ["DONOR"],
    items: [
      { name: "My Donations", href: "/my/donations", icon: PoundSterling },
      { name: "My Gift Aid", href: "/my/gift-aid", icon: Heart },
    ],
  },
  {
    label: "My Portal",
    icon: UserCheck,
    roles: ["VOLUNTEER"],
    items: [
      { name: "My Broadcasts", href: "/my/broadcasts", icon: Radio },
      { name: "My Assignments", href: "/my/assignments", icon: Calendar },
      { name: "My Hours", href: "/my/hours", icon: Clock },
      { name: "My Training", href: "/my/training", icon: GraduationCap },
    ],
  },
  {
    label: "People",
    icon: Users,
    roles: ALL_STAFF,
    items: [
      { name: "Contacts", href: "/crm/contacts", icon: Users },
      { name: "Organisations", href: "/crm/organisations", icon: Building2 },
      { name: "Volunteers", href: "/volunteers", icon: UserCheck },
      { name: "Departments", href: "/volunteers/departments", icon: Building2 },
      { name: "Skills", href: "/volunteers/skills", icon: Wrench },
      { name: "Training", href: "/volunteers/training", icon: GraduationCap },
      { name: "Assignments", href: "/assignments", icon: Calendar },
      { name: "Log Hours", href: "/volunteers/hours", icon: Clock },
    ],
  },
  {
    label: "Finance",
    icon: PoundSterling,
    roles: ALL_STAFF,
    items: [
      { name: "Donations", href: "/finance/donations", icon: PoundSterling },
      { name: "Payments", href: "/finance/payments", icon: CreditCard },
      { name: "Subscriptions", href: "/finance/subscriptions", icon: RefreshCw },
      { name: "Memberships", href: "/finance/memberships", icon: BadgeCheck },
      { name: "Gift Aid", href: "/finance/gift-aid", icon: Heart },
      { name: "Grants", href: "/finance/grants", icon: Landmark },
      { name: "Legacies", href: "/finance/legacies", icon: Flower2 },
      { name: "Ledger Codes", href: "/finance/ledger-codes", icon: BookOpen },
      { name: "Collection Tins", href: "/finance/collection-tins", icon: Package },
      { name: "Tin Locations", href: "/finance/collection-tins/locations", icon: MapPin },
      { name: "Tin Reports", href: "/finance/collection-tins/reports", icon: BarChart3 },
      { name: "Tribute Funds", href: "/finance/tribute-funds", icon: Flower2 },
    ],
  },
  {
    label: "Cases",
    icon: Briefcase,
    roles: ALL_STAFF,
    items: [
      { name: "Cases", href: "/cases", icon: Briefcase },
    ],
  },
  {
    label: "Events & Marketing",
    icon: CalendarDays,
    roles: ALL_STAFF,
    items: [
      { name: "Events", href: "/events", icon: CalendarDays },
      { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    ],
  },
  {
    label: "Compliance",
    icon: ShieldCheck,
    roles: ALL_STAFF,
    items: [
      { name: "DPO Dashboard", href: "/compliance", icon: ShieldCheck },
      { name: "DPIAs", href: "/compliance/dpias", icon: FileSearch },
      { name: "Data Breaches", href: "/compliance/breaches", icon: AlertTriangle },
      { name: "SARs", href: "/compliance/sars", icon: FileText },
      { name: "ROPA", href: "/compliance/ropa", icon: Database },
      { name: "Asset Register", href: "/compliance/assets", icon: ClipboardCheck },
      { name: "Clinical Safety", href: "/compliance/clinical-safety", icon: Activity },
      { name: "Consent Trail", href: "/compliance/consent-trail", icon: Shield },
    ],
  },
  {
    label: "Tools",
    icon: FileInput,
    roles: ALL_STAFF,
    items: [
      { name: "Form Builder", href: "/settings/forms", icon: FileInput },
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Audit Log", href: "/settings/audit-log", icon: Shield },
    ],
  },
];

function isItemActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function isSectionActive(section: NavSection, pathname: string) {
  return section.items.some((item) => isItemActive(item.href, pathname));
}

export function Sidebar({ userRole = "STAFF" }: { userRole?: string }) {
  const pathname = usePathname();

  const filteredSections = sections.filter((section) =>
    section.roles.includes(userRole)
  );

  // Auto-expand the section containing the active page; all others collapsed
  const initialOpen: Record<string, boolean> = {};
  filteredSections.forEach((section) => {
    initialOpen[section.label] = isSectionActive(section, pathname);
  });

  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen);

  const toggle = (label: string) =>
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }));

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

      {/* Collapsible sections */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        {filteredSections.map((section) => {
          const isOpen = !!open[section.label];
          const active = isSectionActive(section, pathname);

          return (
            <div key={section.label}>
              <button
                onClick={() => toggle(section.label)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                <section.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
                  {section.label}
                </span>
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              </button>

              {isOpen && (
                <div className="ml-2 mt-0.5 space-y-0.5 border-l border-gray-700 pl-2 mb-1">
                  {section.items.map((item) => {
                    const itemActive = isItemActive(item.href, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                          itemActive
                            ? "bg-gray-800 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
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
