/**
 * JustGiving API Client
 *
 * Endpoints used:
 * - GET /v1/fundraising/pages/{pageShortName}          → page details + totals
 * - GET /v1/fundraising/pages/{pageShortName}/donations → paginated donations
 *
 * Auth: x-api-key header with your JG App ID
 * Docs: https://developer.justgiving.com/apidocs/documentation
 */

const JG_BASE_URL =
  process.env.JUSTGIVING_SANDBOX === "true"
    ? "https://api.sandbox.justgiving.com"
    : "https://api.justgiving.com";

const JG_API_KEY = process.env.JUSTGIVING_API_KEY || "";

export interface JGDonation {
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

export interface JGPageDetails {
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

export function parseJGDate(dateStr: string): Date {
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

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && (parts[0] === "page" || parts[0] === "fundraising")) {
      return parts[1];
    }
    if (parts.length === 1) {
      return parts[0];
    }
  } catch {
    // Not a URL, treat as slug
  }

  return trimmed;
}

/**
 * Build the full JustGiving page URL from a slug.
 */
export function buildJGUrl(slug: string): string {
  return `https://www.justgiving.com/fundraising/${slug}`;
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
      next: { revalidate: 0 },
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

/**
 * Transform a JG donation into our FundraisingDonation format.
 */
export function transformDonation(jgDonation: JGDonation) {
  return {
    externalId: String(jgDonation.id),
    donorDisplayName: jgDonation.donorDisplayName || null,
    amount: jgDonation.amount || jgDonation.donorLocalAmount || 0,
    currencyCode: jgDonation.currencyCode || jgDonation.donorLocalCurrencyCode || "GBP",
    donationDate: parseJGDate(jgDonation.donationDate),
    message: jgDonation.message || null,
    estimatedTaxReclaim: jgDonation.estimatedTaxReclaim || null,
    isGiftAidEligible: (jgDonation.estimatedTaxReclaim || 0) > 0,
    imageUrl: jgDonation.image || null,
    rawData: JSON.stringify(jgDonation),
  };
}
