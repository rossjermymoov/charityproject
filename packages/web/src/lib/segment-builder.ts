import type { AllFilters, SegmentFilters } from "@/types/segment";

/**
 * Build a Prisma where clause from segment filters
 */
export function buildSegmentWhere(filters: SegmentFilters): any {
  const { filters: conditions, matchType } = filters;

  if (conditions.length === 0) {
    return {};
  }

  const whereClauses = conditions.map((filter) => buildFilterClause(filter));

  if (matchType === "all") {
    return { AND: whereClauses };
  } else {
    return { OR: whereClauses };
  }
}

function buildFilterClause(filter: AllFilters): any {
  switch (filter.type) {
    case "donation":
      return buildDonationFilter(filter);
    case "tag":
      return buildTagFilter(filter);
    case "location":
      return buildLocationFilter(filter);
    case "event":
      return buildEventFilter(filter);
    case "membership":
      return buildMembershipFilter(filter);
    case "communication":
      return buildCommunicationFilter(filter);
    default:
      return {};
  }
}

function buildDonationFilter(filter: any): any {
  const donationWhere: any = {};

  if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
    donationWhere.amount = {};
    if (filter.minAmount !== undefined) {
      donationWhere.amount.gte = filter.minAmount;
    }
    if (filter.maxAmount !== undefined) {
      donationWhere.amount.lte = filter.maxAmount;
    }
  }

  if (filter.startDate || filter.endDate) {
    donationWhere.donatedAt = {};
    if (filter.startDate) {
      donationWhere.donatedAt.gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      donationWhere.donatedAt.lte = new Date(filter.endDate);
    }
  }

  // Return contacts that have donations matching the criteria
  return {
    donations: {
      some: donationWhere,
    },
  };
}

function buildTagFilter(filter: any): any {
  if (!filter.tagIds || filter.tagIds.length === 0) {
    return {};
  }

  return {
    tags: {
      some: {
        tagId: {
          in: filter.tagIds,
        },
      },
    },
  };
}

function buildLocationFilter(filter: any): any {
  const locationConditions = [];

  if (filter.cities && filter.cities.length > 0) {
    locationConditions.push({
      city: {
        in: filter.cities,
      },
    });
  }

  if (filter.postcodes && filter.postcodes.length > 0) {
    // Use startsWith for each postcode prefix so "SY11" matches "SY11 1NZ" etc.
    const postcodeConditions = filter.postcodes.map((pc: string) => ({
      postcode: {
        startsWith: pc.trim().toUpperCase(),
        mode: "insensitive" as const,
      },
    }));
    locationConditions.push(
      postcodeConditions.length === 1 ? postcodeConditions[0] : { OR: postcodeConditions }
    );
  }

  if (locationConditions.length === 0) {
    return {};
  }

  if (locationConditions.length === 1) {
    return locationConditions[0];
  }

  return { OR: locationConditions };
}

function buildEventFilter(filter: any): any {
  const eventWhere: any = {};

  if (filter.eventIds && filter.eventIds.length > 0) {
    eventWhere.eventId = { in: filter.eventIds };
  }

  return {
    eventAttendees: {
      some: eventWhere,
    },
  };
}

function buildMembershipFilter(filter: any): any {
  const membershipWhere: any = {};

  if (filter.membershipTypeIds && filter.membershipTypeIds.length > 0) {
    membershipWhere.membershipTypeId = { in: filter.membershipTypeIds };
  }

  if (filter.isActive !== undefined) {
    // A membership is active if it exists and renewal status is not EXPIRED/CANCELLED
    membershipWhere.status = filter.isActive
      ? { in: ["ACTIVE", "PENDING_RENEWAL"] }
      : { in: ["EXPIRED", "CANCELLED"] };
  }

  return {
    memberships: {
      some: membershipWhere,
    },
  };
}

function buildCommunicationFilter(filter: any): any {
  const consentWhere: any = {};

  if (filter.consentEmail !== undefined) {
    consentWhere.consentEmail = filter.consentEmail;
  }
  if (filter.consentPhone !== undefined) {
    consentWhere.consentPhone = filter.consentPhone;
  }
  if (filter.consentSms !== undefined) {
    consentWhere.consentSms = filter.consentSms;
  }
  if (filter.consentPost !== undefined) {
    consentWhere.consentPost = filter.consentPost;
  }

  return consentWhere;
}

/**
 * Validate segment filters
 */
export function validateSegmentFilters(filters: SegmentFilters): string[] {
  const errors: string[] = [];

  if (!filters.filters || filters.filters.length === 0) {
    errors.push("At least one filter is required");
  }

  if (!["all", "any"].includes(filters.matchType)) {
    errors.push("matchType must be 'all' or 'any'");
  }

  filters.filters.forEach((filter, index) => {
    switch (filter.type) {
      case "donation":
        if (
          filter.minAmount === undefined &&
          filter.maxAmount === undefined &&
          !filter.startDate &&
          !filter.endDate
        ) {
          errors.push(`Donation filter at index ${index} must have at least one criterion`);
        }
        break;
      case "tag":
        if (!filter.tagIds || filter.tagIds.length === 0) {
          errors.push(`Tag filter at index ${index} must have at least one tag`);
        }
        break;
      case "location":
        if (
          (!filter.cities || filter.cities.length === 0) &&
          (!filter.postcodes || filter.postcodes.length === 0)
        ) {
          errors.push(`Location filter at index ${index} must have cities or postcodes`);
        }
        break;
    }
  });

  return errors;
}
