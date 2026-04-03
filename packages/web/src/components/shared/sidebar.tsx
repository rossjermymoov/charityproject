"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/shared/branding-provider";
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
  Mail,
  Merge,
  Target,
  Zap,
  Handshake,
  MessageCircle,
  Wallet,
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
      { name: "Duplicates", href: "/crm/duplicates", icon: Merge },
      { name: "Segments", href: "/crm/segments", icon: Zap },
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
      { name: "Major Gifts Pipeline", href: "/finance/pipeline", icon: Target },
      { name: "Donations", href: "/finance/donations", icon: PoundSterling },
      { name: "Payments", href: "/finance/payments", icon: CreditCard },
      { name: "Subscriptions", href: "/finance/subscriptions", icon: RefreshCw },
      { name: "Memberships", href: "/finance/memberships", icon: BadgeCheck },
      { name: "Renewal Dashboard", href: "/finance/memberships/renewals", icon: RefreshCw },
      { name: "Gift Aid", href: "/finance/gift-aid", icon: Heart },
      { name: "Grants", href: "/finance/grants", icon: Landmark },
      { name: "Partnerships", href: "/finance/partnerships", icon: Handshake },
      { name: "Pledges", href: "/finance/pledges", icon: PoundSterling },
      { name: "Legacies", href: "/finance/legacies", icon: Flower2 },
      { name: "Ledger Codes", href: "/finance/ledger-codes", icon: BookOpen },
      { name: "SORP Reports", href: "/finance/reports", icon: BarChart3 },
      { name: "Fund Accounting", href: "/finance/funds", icon: Wallet },
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
    label: "Communications",
    icon: Mail,
    roles: ALL_STAFF,
    items: [
      { name: "SMS", href: "/communications/sms", icon: MessageCircle },
    ],
  },
  {
    label: "Tools",
    icon: FileInput,
    roles: ALL_STAFF,
    items: [
      { name: "Form Builder", href: "/settings/forms", icon: FileInput },
      { name: "Automations", href: "/settings/automations", icon: Wrench },
      { name: "Email Templates", href: "/settings/email-templates", icon: Mail },
      { name: "Webhooks", href: "/settings/webhooks", icon: Zap },
      { name: "Tasks", href: "/tasks", icon: ClipboardCheck },
      { name: "Task Rules", href: "/settings/task-rules", icon: Wrench },
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Report Builder", href: "/reports/builder", icon: BarChart3 },
      { name: "Board Reports", href: "/reports/board", icon: FileText },
      { name: "Data Export", href: "/reports/export", icon: FileInput },
      { name: "Campaign ROI", href: "/reports/campaign-roi", icon: Target },
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
  const branding = useBranding();

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
    <div
      className="flex h-full w-64 flex-col"
      style={{ backgroundColor: branding.sidebarColour }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.orgName}
              className="h-8 w-8 rounded-lg object-contain"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: branding.primaryColour }}
            >
              <span className="text-white font-bold text-sm">
                {branding.orgName.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-white font-semibold text-lg">{branding.orgName}</span>
        </Link>
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
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  color: active ? "#ffffff" : branding.sidebarTextColour,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
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
                <div
                  className="ml-2 mt-0.5 space-y-0.5 pl-2 mb-1"
                  style={{ borderLeft: `1px solid ${branding.sidebarTextColour}40` }}
                >
                  {section.items.map((item) => {
                    const itemActive = isItemActive(item.href, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: itemActive ? `${branding.primaryColour}30` : "transparent",
                          color: itemActive ? "#ffffff" : branding.sidebarTextColour,
                        }}
                        onMouseEnter={(e) => {
                          if (!itemActive) {
                            e.currentTarget.style.backgroundColor = `${branding.primaryColour}20`;
                            e.currentTarget.style.color = "#ffffff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!itemActive) {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = branding.sidebarTextColour;
                          }
                        }}
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
      <div className="p-3 space-y-1" style={{ borderTop: `1px solid ${branding.sidebarTextColour}30` }}>
        {userRole === "ADMIN" && (
          <Link
            href="/settings/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: branding.sidebarTextColour }}
          >
            <UserCog className="h-5 w-5" />
            User Management
          </Link>
        )}
        {["ADMIN", "STAFF"].includes(userRole) && (
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: branding.sidebarTextColour }}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        )}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: branding.sidebarTextColour }}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
