import { prisma } from "@/lib/prisma";

interface ContactFilter {
  searchQuery?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface DonationFilter {
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

interface MembershipFilter {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface EventFilter {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Escape CSV field values properly
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Build CSV string from rows
 */
function buildCSV(headers: string[], rows: unknown[][]): string {
  const headerRow = headers.map(escapeCSVField).join(",");
  const dataRows = rows.map((row) => row.map(escapeCSVField).join(","));
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Export contacts to CSV
 */
export async function exportContacts(filters: ContactFilter): Promise<string> {
  const where: any = { isArchived: false };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.searchQuery) {
    where.OR = [
      { firstName: { contains: filters.searchQuery, mode: "insensitive" } },
      { lastName: { contains: filters.searchQuery, mode: "insensitive" } },
      { email: { contains: filters.searchQuery, mode: "insensitive" } },
      { phone: { contains: filters.searchQuery, mode: "insensitive" } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const headers = [
    "ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Address Line 1",
    "Address Line 2",
    "City",
    "Postcode",
    "Country",
    "Status",
    "Type",
    "Email Opt-In",
    "SMS Opt-In",
    "Post Opt-In",
    "Phone Opt-In",
    "Communication Frequency",
    "Is Lottery Member",
    "Created At",
  ];

  const rows = contacts.map((contact) => [
    contact.id,
    contact.firstName,
    contact.lastName,
    contact.email || "",
    contact.phone || "",
    contact.addressLine1 || "",
    contact.addressLine2 || "",
    contact.city || "",
    contact.postcode || "",
    contact.country || "",
    contact.status,
    contact.types.join("; "),
    contact.emailOptIn ? "Yes" : "No",
    contact.smsOptIn ? "Yes" : "No",
    contact.postOptIn ? "Yes" : "No",
    contact.phoneOptIn ? "Yes" : "No",
    contact.communicationFrequency || "",
    contact.isLotteryMember ? "Yes" : "No",
    contact.createdAt.toISOString(),
  ]);

  return buildCSV(headers, rows);
}

/**
 * Export donations to CSV
 */
export async function exportDonations(filters: DonationFilter): Promise<string> {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) {
      where.date.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.date.lte = filters.dateTo;
    }
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {};
    if (filters.minAmount !== undefined) {
      where.amount.gte = filters.minAmount;
    }
    if (filters.maxAmount !== undefined) {
      where.amount.lte = filters.maxAmount;
    }
  }

  const donations = await prisma.donation.findMany({
    where,
    include: {
      contact: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      campaign: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 10000,
  });

  const headers = [
    "ID",
    "Contact Name",
    "Contact Email",
    "Amount",
    "Currency",
    "Type",
    "Method",
    "Reference",
    "Date",
    "Campaign",
    "Gift Aid Claimable",
    "Gift Aid Claimed",
    "Status",
    "Notes",
    "Created At",
  ];

  const rows = donations.map((donation) => [
    donation.id,
    `${donation.contact.firstName} ${donation.contact.lastName}`,
    donation.contact.email || "",
    donation.amount,
    donation.currency,
    donation.type,
    donation.method || "",
    donation.reference || "",
    donation.date.toISOString().split("T")[0],
    donation.campaign?.name || "",
    donation.isGiftAidable ? "Yes" : "No",
    donation.giftAidClaimed ? "Yes" : "No",
    donation.status,
    donation.notes || "",
    donation.createdAt.toISOString(),
  ]);

  return buildCSV(headers, rows);
}

/**
 * Export memberships to CSV
 */
export async function exportMemberships(filters: MembershipFilter): Promise<string> {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.startDate = {};
    if (filters.dateFrom) {
      where.startDate.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.startDate.lte = filters.dateTo;
    }
  }

  const memberships = await prisma.membership.findMany({
    where,
    include: {
      contact: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      membershipType: {
        select: {
          name: true,
          price: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
    take: 10000,
  });

  const headers = [
    "ID",
    "Member Number",
    "Contact Name",
    "Contact Email",
    "Membership Type",
    "Price",
    "Status",
    "Start Date",
    "End Date",
    "Renewal Date",
    "Last Renewal Date",
    "Auto-Renew",
    "Created At",
  ];

  const rows = memberships.map((membership) => [
    membership.id,
    membership.memberNumber,
    `${membership.contact.firstName} ${membership.contact.lastName}`,
    membership.contact.email || "",
    membership.membershipType.name,
    membership.membershipType.price,
    membership.status,
    membership.startDate.toISOString().split("T")[0],
    membership.endDate.toISOString().split("T")[0],
    membership.renewalDate ? membership.renewalDate.toISOString().split("T")[0] : "",
    membership.lastRenewalDate ? membership.lastRenewalDate.toISOString().split("T")[0] : "",
    membership.autoRenew ? "Yes" : "No",
    membership.createdAt.toISOString(),
  ]);

  return buildCSV(headers, rows);
}

/**
 * Export events to CSV with attendee counts
 */
export async function exportEvents(filters: EventFilter): Promise<string> {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.startDate = {};
    if (filters.dateFrom) {
      where.startDate.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.startDate.lte = filters.dateTo;
    }
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      campaign: {
        select: {
          name: true,
        },
      },
      attendees: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
    take: 10000,
  });

  const headers = [
    "ID",
    "Name",
    "Type",
    "Description",
    "Status",
    "Start Date",
    "End Date",
    "Location",
    "Capacity",
    "Attendees",
    "Campaign",
    "Created At",
  ];

  const rows = events.map((event) => [
    event.id,
    event.name,
    event.type || "",
    event.description || "",
    event.status,
    event.startDate.toISOString().split("T")[0],
    event.endDate ? event.endDate.toISOString().split("T")[0] : "",
    event.location || "",
    event.capacity || "",
    event.attendees.length,
    event.campaign?.name || "",
    event.createdAt.toISOString(),
  ]);

  return buildCSV(headers, rows);
}
