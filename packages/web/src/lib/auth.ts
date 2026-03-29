import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    contactId: user.contactId,
  };
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  contactId: string | null;
};

// Role constants
export const ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  VOLUNTEER: "VOLUNTEER",
  DONOR: "DONOR",
} as const;

// Which roles can access which sections
export const ROLE_ACCESS = {
  // Admin and Staff see everything
  dashboard: ["ADMIN", "STAFF"],
  crm: ["ADMIN", "STAFF"],
  volunteers: ["ADMIN", "STAFF"],
  finance: ["ADMIN", "STAFF"],
  events: ["ADMIN", "STAFF"],
  communications: ["ADMIN", "STAFF"],
  compliance: ["ADMIN", "STAFF"],
  insights: ["ADMIN", "STAFF"],
  settings: ["ADMIN"],
  userManagement: ["ADMIN"],
  // Volunteer-specific
  myAssignments: ["VOLUNTEER"],
  myHours: ["VOLUNTEER"],
  myTraining: ["VOLUNTEER"],
  // Donor-specific
  myDonations: ["DONOR"],
  myGiftAid: ["DONOR"],
} as const;

export function canAccess(role: string, section: keyof typeof ROLE_ACCESS): boolean {
  return (ROLE_ACCESS[section] as readonly string[]).includes(role);
}
