/**
 * HMRC Gift Aid Integration Utilities
 * For submitting Gift Aid claims to HMRC via Government Gateway
 */

// ── HMRC Endpoints ──────────────────────────────────────────────

export const HMRC_ENDPOINTS = {
  // Production endpoint (not yet implemented — use test endpoint in development)
  production: "https://www.hmrc.gov.uk/charities/online/",

  // Government Gateway test endpoint
  test: "https://secure.uat.gateway.hmrc.gov.uk/charities/",

  // Government Gateway production endpoint
  gateway: "https://gateway.hmrc.gov.uk/",
};

// ── Constants ──────────────────────────────────────────────────

export const HMRC_CLAIM_REFERENCE_PREFIX = "GA";
export const HMRC_CLAIM_REFERENCE_YEAR_FORMAT = "YYYY"; // Full 4-digit year
export const HMRC_CLAIM_REFERENCE_NUMBER_FORMAT = "NNN"; // 3-digit sequence number

// ── Gift Aid Calculation ────────────────────────────────────────

/**
 * Calculate Gift Aid (basic rate relief)
 * Basic formula: 25% of donation amount
 * This assumes donor is a basic rate taxpayer
 */
export function calculateGiftAid(amount: number): number {
  return Math.round((amount * 0.25) * 100) / 100; // 25% with rounding
}

/**
 * Generate a claim reference in format: GA-YYYY-NNN
 * Where NNN is a sequence number padded with zeros
 * Requires the sequence number — call from database lookup
 */
export function generateClaimReference(year: number, sequenceNumber: number): string {
  const paddedSequence = String(sequenceNumber).padStart(3, "0");
  return `${HMRC_CLAIM_REFERENCE_PREFIX}-${year}-${paddedSequence}`;
}

/**
 * Get next claim reference based on year and existing claims
 * Call from server action with year and count of claims in that year
 */
export function getNextClaimReference(year: number, countInYear: number): string {
  return generateClaimReference(year, countInYear + 1);
}

// ── Donor Validation ────────────────────────────────────────────

export interface DonorValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate donor has required information for Gift Aid claim
 * Requires: name, UK postcode, and active Gift Aid declaration
 */
export function validateDonorForClaim(contact: {
  firstName?: string | null;
  lastName?: string | null;
  postcode?: string | null;
}): DonorValidation {
  const errors: string[] = [];

  if (!contact.firstName || !contact.lastName) {
    errors.push("Donor must have a full name");
  }

  if (!contact.postcode) {
    errors.push("Donor must have a UK postcode");
  }

  // Basic postcode validation (UK format)
  if (contact.postcode && !isValidUKPostcode(contact.postcode)) {
    errors.push("Postcode does not appear to be a valid UK format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Basic UK postcode validation (not exhaustive)
 * UK postcodes format: A9 9AA, A9A 9AA, A99 9AA, AA9 9AA, AA9A 9AA, AA99 9AA
 */
export function isValidUKPostcode(postcode: string): boolean {
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
  return ukPostcodeRegex.test(postcode.trim().toUpperCase());
}

// ── HMRC XML Submission ────────────────────────────────────────

export interface HMRCSubmissionData {
  charityRef: string; // HMRC Charity Reference e.g. XR12345
  gatewayUser: string; // Government Gateway User ID
  submissionId: string; // Unique submission ID
  claimReference: string; // GA-YYYY-NNN
  periodStart: Date;
  periodEnd: Date;
  donations: Array<{
    donorName: string;
    donorPostcode: string;
    donationAmount: number;
    donationDate: Date;
    giftAidAmount: number;
  }>;
  totalDonations: number;
  totalGiftAid: number;
  gasdsAmount?: number; // Gift Aid Small Donations Scheme amount
}

/**
 * Build GovTalk XML submission for HMRC
 *
 * TODO: Implement full GovTalk XML protocol
 * - Wrap with GovTalkMessage envelope
 * - Include IRmark digital signature header
 * - Serialize donation items as XML
 * - Add headers: SenderId, Class, CorrelationId, SubmissionTime
 * - Encrypt sensitive fields (charity ref, postcode)
 * - Support GASDS (Gift Aid Small Donations Scheme) entries
 *
 * Reference: https://www.gov.uk/guidance/submit-gift-aid-claims-online
 */
export function buildGovTalkXml(data: HMRCSubmissionData): string {
  // Placeholder implementation
  const timestamp = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<GovTalkMessage xmlns="http://www.govtalk.gov.uk/tm/schema/v1.0">
  <EnvelopeVersion>1.0</EnvelopeVersion>
  <Header>
    <MessageDetails>
      <Class>IRSA</Class>
      <Qualifier>request</Qualifier>
      <Function>submit</Function>
      <CorrelationId>${data.submissionId}</CorrelationId>
      <Transformation>
        <Generated>
          <At>${timestamp}</At>
        </Generated>
      </Transformation>
      <ResponseRequired>yes</ResponseRequired>
      <Version>1.0</Version>
    </MessageDetails>
    <SenderDetails>
      <IDAuthentication>
        <SenderID>${data.gatewayUser}</SenderID>
        <Authentication>
          <Method>clear</Method>
          <Password>***ENCRYPTED***</Password>
        </Authentication>
      </IDAuthentication>
      <SenderId>${data.charityRef}</SenderId>
      <MailboxID>${data.charityRef}</MailboxID>
    </SenderDetails>
  </Header>
  <Body>
    <SubmitGiftAidClaim>
      <ClaimReference>${data.claimReference}</ClaimReference>
      <PeriodStart>${data.periodStart.toISOString().split("T")[0]}</PeriodStart>
      <PeriodEnd>${data.periodEnd.toISOString().split("T")[0]}</PeriodEnd>
      <TotalDonations>${data.totalDonations}</TotalDonations>
      <TotalGiftAid>${data.totalGiftAid}</TotalGiftAid>
      <Donations>
        ${data.donations.map((d) => `
        <Donation>
          <DonorName>${escapeXml(d.donorName)}</DonorName>
          <DonorPostcode>${escapeXml(d.donorPostcode)}</DonorPostcode>
          <Amount>${d.donationAmount}</Amount>
          <Date>${d.donationDate.toISOString().split("T")[0]}</Date>
          <GiftAid>${d.giftAidAmount}</GiftAid>
        </Donation>
        `).join("")}
      </Donations>
      ${data.gasdsAmount ? `<GASDSAmount>${data.gasdsAmount}</GASDSAmount>` : ""}
    </SubmitGiftAidClaim>
  </Body>
</GovTalkMessage>`;
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate IRmark digital signature
 *
 * TODO: Implement IRmark (IRSA Request Mark) signature
 * - This is a SHA1-based digital signature that HMRC uses
 * - Requires signing certain XML fields with a private key
 * - Part of the Government Gateway authentication
 * - Reference: GovTalk specification
 *
 * For now, returns placeholder
 */
export function generateIRmark(xmlContent: string, charityRef: string): string {
  // Placeholder implementation — TODO: implement real IRmark signing
  // In production, would use Node.js crypto module or a dedicated signing library
  // This is just a mock for development
  const content = xmlContent + charityRef;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `IRmark-placeholder-${Math.abs(hash).toString(16).substring(0, 16)}`;
}

// ── Types ──────────────────────────────────────────────────────

export interface HMRCClaimStatus {
  reference: string;
  status: "DRAFT" | "READY" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "PARTIAL";
  correlationId?: string;
  hmrcReference?: string;
  lastPolledAt?: Date;
  responseXml?: string;
}
