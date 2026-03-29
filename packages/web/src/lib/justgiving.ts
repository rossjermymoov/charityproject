/**
 * JustGiving API Client
 *
 * Endpoints used:
 * - GET /v1/fundraising/pages/{pageShortName}          → page details + totals
 * - GET /v1/fundraising/pages/{pageShortName}/donations → paginated donations
 * - GET /v1/event/{eventId}                            → event info + linked pages
 *
 * Auth: x-api-key header with your JG App ID
 * Docs: https://developer.justgiving.com/apidocs/documentation
 */

const JG_BASE_URL =
  process.env.JUSTGIVING_SANDBOX === "true"
    ? "https://api.sandbox.justgiving.com"
    : "https://api.justgiving.com";

const JG_API_KEY = process.env.JUSTGIVING_API_KEY || "";

interface JGDonation {
  id: number;
  donorDisplayName: string;
  donorLocalAmount: number;
  donorLocalCurrencyCode: string;
  amount: number;
  currencyCode: string;
  donationDate: string; // "/Date(1234567890000+0000)/"
  message: string | null;
  estimatedTaxReclaim: number;
  status: string;
  thirdPartyReference: string | null;
  charityId: number;
  image: string | null;
}

interface JGDonationsResponse {
  donations: JGDonation[];
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalResults: number;
  };
}

interface JGPageDetails {
  pageId: number;
  pageShortName: string;
  title: string;
  eventName: string | null;
  eventId: number | null;
  targetAmount: number;
  totalRaisedOnline: number;
  totalRaisedOffline: number;
  totalRaisedSms: number;
  grandTotalRaisedExcludingGiftAid: number;
  grandTotalGiftAid: number;
  totalEstimatedGiftAid: number;
  status: string;
  owner: string | null;
  currencyCode: string;
  currencySymbol: string;
  pageCreatedDate: string;
  activityCharityCreated: string | null;
  charityId: number;
}

interface JGEventDetails {
  id: number;
  name: string;
  description: string | null;
  completionDate: string | null;
  expiryDate: string | null;
  startDate: string | null;
  eventType: string | null;
  location: string | null;
  numberOfFundraisingPagesForEvent: number;
}

function parseJGDate(dateStr: string): Date {
  // JG dates come as "/Date(1234567890000+0000)/" or ISO strings
  const msMatch = dateStr.match(/\/Date\((\d+)/);
  if (msMatch) {
    return new Date(parseInt(msMatch[1]));
  }
  return new Date(dateStr);
}

/**
 * Extract page slug from a JustGiving URL.
 * Supports:
 * - https://www.justgiving.com/page/john-smith-midnight-walk
 * - https://www.justgiving.com/fundraising/john-smith-midnight-walk
 * - john-smith-midnight-walk (just the slug)
 */
export function extractJGSlug(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();

  // Full URL
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    // /page/slug or /fundraising/slug
    if (parts.length >= 2 && (parts[0] === "page" || parts[0] === "fundraising")) {
      return parts[1];
    }
    // just /slug
    if (parts.length === 1) {
      return parts[0];
    }
  } catch {
    // Not a URL, treat as slug
  }

  return trimmed;
}

async function jgFetch<T>(path: string): Promise<T | null> {
  if (!JG_API_KEY) {
    console.warn("[justgiving] No API key configured (JUSTGIVING_API_KEY)");
    return null;
  }

  try {
    const res = await fetch(`${JG_BASE_URL}${path}`, {
      headers: {
        "x-api-key": JG_API_KEY,
        Accept: "application/json",
      },
      next: { revalidate: 0 }, // no cache
    });

    if (!res.ok) {
      console.error(`[justgiving] API error ${res.status} for ${path}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`[justgiving] Fetch error for ${path}:`, error);
    return null;
  }
}

/** Get fundraising page details including total raised */
export async function getPageDetails(
  pageSlug: string
): Promise<JGPageDetails | null> {
  return jgFetch<JGPageDetails>(`/v1/fundraising/pages/${pageSlug}`);
}

/** Get all donations for a fundraising page (handles pagination) */
export async function getPageDonations(
  pageSlug: string,
  maxPages = 10
): Promise<JGDonation[]> {
  const allDonations: JGDonation[] = [];
  let pageNum = 1;

  while (pageNum <= maxPages) {
    const data = await jgFetch<JGDonationsResponse>(
      `/v1/fundraising/pages/${pageSlug}/donations?pageNum=${pageNum}&pageSize=50`
    );

    if (!data || !data.donations || data.donations.length === 0) break;

    allDonations.push(...data.donations);

    if (pageNum >= (data.pagination?.totalPages || 1)) break;
    pageNum++;
  }

  return allDonations;
}

/** Get JustGiving event details */
export async function getEventDetails(
  eventId: string
): Promise<JGEventDetails | null> {
  return jgFetch<JGEventDetails>(`/v1/event/${eventId}`);
}

/**
 * Transform a JG donation into our internal format.
 * Returns fields ready for JustGivingDonation model creation.
 */
export function transformDonation(
  jgDonation: JGDonation,
  eventId: string
) {
  return {
    eventId,
    justGivingId: String(jgDonation.id),
    donorName: jgDonation.donorDisplayName || null,
    amount: jgDonation.amount || jgDonation.donorLocalAmount || 0,
    currencyCode: jgDonation.currencyCode || jgDonation.donorLocalCurrencyCode || "GBP",
    donationDate: parseJGDate(jgDonation.donationDate),
    message: jgDonation.message || null,
    estimatedTaxReclaim: jgDonation.estimatedTaxReclaim || null,
    isGiftAidEligible: (jgDonation.estimatedTaxReclaim || 0) > 0,
    status: "RECEIVED",
    source: "JUSTGIVING",
    rawData: JSON.stringify(jgDonation),
  };
}

export { parseJGDate };
export type { JGDonation, JGPageDetails, JGEventDetails };
