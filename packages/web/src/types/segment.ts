// Segment filter types
export interface SegmentFilter {
  type: "donation" | "tag" | "location" | "event" | "membership" | "communication";
}

export interface DonationFilter extends SegmentFilter {
  type: "donation";
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface TagFilter extends SegmentFilter {
  type: "tag";
  tagIds: string[];
}

export interface LocationFilter extends SegmentFilter {
  type: "location";
  cities?: string[];
  postcodes?: string[];
}

export interface EventFilter extends SegmentFilter {
  type: "event";
  eventIds?: string[];
  attended?: boolean;
}

export interface MembershipFilter extends SegmentFilter {
  type: "membership";
  membershipTypeIds?: string[];
  isActive?: boolean;
}

export interface CommunicationFilter extends SegmentFilter {
  type: "communication";
  consentEmail?: boolean;
  consentPhone?: boolean;
  consentSms?: boolean;
  consentPost?: boolean;
}

export type AllFilters = DonationFilter | TagFilter | LocationFilter | EventFilter | MembershipFilter | CommunicationFilter;

export interface SegmentFilters {
  filters: AllFilters[];
  matchType: "all" | "any"; // AND or OR logic
}

export interface SavedSegmentResponse {
  id: string;
  name: string;
  description?: string;
  filters: SegmentFilters;
  createdAt: string;
  updatedAt: string;
}

export interface SegmentPreviewResponse {
  count: number;
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    city?: string;
  }>;
}
