import { redirect } from "next/navigation";
import type { SessionUser } from "./auth";

// Map URL path prefixes to allowed roles
const ROUTE_RULES: Array<{ prefix: string; roles: string[] }> = [
  // Admin-only
  { prefix: "/settings", roles: ["ADMIN"] },
  // Staff/Admin sections
  { prefix: "/crm", roles: ["ADMIN", "STAFF"] },
  { prefix: "/volunteers", roles: ["ADMIN", "STAFF"] },
  { prefix: "/finance", roles: ["ADMIN", "STAFF"] },
  { prefix: "/events", roles: ["ADMIN", "STAFF"] },
  { prefix: "/communications", roles: ["ADMIN", "STAFF"] },
  { prefix: "/compliance", roles: ["ADMIN", "STAFF"] },
  { prefix: "/insights", roles: ["ADMIN", "STAFF"] },
  // Volunteer-only
  { prefix: "/my/broadcasts", roles: ["VOLUNTEER"] },
  { prefix: "/my/assignments", roles: ["VOLUNTEER"] },
  { prefix: "/my/hours", roles: ["VOLUNTEER"] },
  { prefix: "/my/training", roles: ["VOLUNTEER"] },
  // Broadcasts — volunteers can respond, staff/admin can manage
  { prefix: "/broadcasts", roles: ["ADMIN", "STAFF", "VOLUNTEER"] },
  // Donor-only
  { prefix: "/my/donations", roles: ["DONOR"] },
  { prefix: "/my/gift-aid", roles: ["DONOR"] },
];

/**
 * Check if the current user's role allows access to the given pathname.
 * Redirects to appropriate home page if access denied.
 */
export function guardRoute(session: SessionUser, pathname: string): void {
  for (const rule of ROUTE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      if (!rule.roles.includes(session.role)) {
        // Redirect to role-appropriate home
        redirect(getHomeForRole(session.role));
      }
      return;
    }
  }

  // Dashboard (root "/") is only for ADMIN/STAFF — redirect others to their portal
  if (pathname === "/") {
    if (!["ADMIN", "STAFF"].includes(session.role)) {
      redirect(getHomeForRole(session.role));
    }
  }
}

export function getHomeForRole(role: string): string {
  switch (role) {
    case "DONOR":
      return "/my/donations";
    case "VOLUNTEER":
      return "/my/assignments";
    default:
      return "/";
  }
}
