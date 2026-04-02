/**
 * GASDS (Gift Aid Small Donations Scheme) utilities
 * UK Charity Commission guidelines for small cash/contactless donations
 */

/**
 * Calculate UK tax year from a date
 * Tax year runs 6 April to 5 April
 * e.g. 2025-04-06 to 2026-04-05 is tax year "2025-26"
 */
export function getTaxYearFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Before April 6 → previous year's tax year
  if (month < 4 || (month === 4 && day < 6)) {
    return `${year - 1}-${String(year).slice(2)}`;
  }

  // April 6 onwards → current year's tax year
  return `${year}-${String(year + 1).slice(2)}`;
}

/**
 * Get the start and end dates for a UK tax year
 * e.g. "2025-26" returns 2025-04-06 to 2026-04-05
 */
export function getTaxYearDateRange(taxYear: string): [Date, Date] {
  const [startYear, endYearStr] = taxYear.split("-");
  const startYearNum = parseInt(startYear);
  const endYearNum = startYearNum + 1;

  const start = new Date(`${startYearNum}-04-06`);
  const end = new Date(`${endYearNum}-04-05T23:59:59`);

  return [start, end];
}

/**
 * Calculate GASDS claim amount (25% of donations)
 * Rounds to 2 decimal places
 */
export function calculateClaimAmount(totalDonations: number): number {
  return Math.round(totalDonations * 0.25 * 100) / 100;
}

/**
 * Validate a donation amount for GASDS
 * Must be positive and <= £30
 */
export function validateGasdsAmount(amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: "Amount must be greater than £0" };
  }

  if (amount > 30) {
    return { valid: false, error: "Amount must not exceed £30" };
  }

  return { valid: true };
}

/**
 * Split a large tin return into GASDS-eligible chunks (max £30 each)
 * Used when importing collection tin returns
 */
export function splitTinReturnIntoChunks(totalAmount: number): number[] {
  if (totalAmount <= 0) return [];

  const chunks: number[] = [];
  const fullChunks = Math.floor(totalAmount / 30);
  const remainder = totalAmount % 30;

  // Add full £30 chunks
  for (let i = 0; i < fullChunks; i++) {
    chunks.push(30);
  }

  // Add remainder if any
  if (remainder > 0) {
    chunks.push(remainder);
  }

  return chunks;
}

/**
 * Format a tax year string for display
 * e.g. "2025-26" becomes "2025/26" or "6 Apr 2025 - 5 Apr 2026"
 */
export function formatTaxYear(taxYear: string, format: "short" | "long" = "short"): string {
  if (format === "short") {
    return taxYear.replace("-", "/");
  }

  const [startYear, endYearStr] = taxYear.split("-");
  const startYearNum = parseInt(startYear);
  const endYearNum = startYearNum + 1;

  return `6 Apr ${startYearNum} - 5 Apr ${endYearNum}`;
}

/**
 * Generate the next tax year string
 * e.g. "2025-26" returns "2026-27"
 */
export function getNextTaxYear(taxYear: string): string {
  const [startYear] = taxYear.split("-");
  const startYearNum = parseInt(startYear);
  return `${startYearNum + 1}-${String(startYearNum + 2).slice(2)}`;
}

/**
 * Generate the previous tax year string
 * e.g. "2025-26" returns "2024-25"
 */
export function getPreviousTaxYear(taxYear: string): string {
  const [startYear] = taxYear.split("-");
  const startYearNum = parseInt(startYear);
  return `${startYearNum - 1}-${String(startYearNum).slice(2)}`;
}

/**
 * Calculate the GASDS annual limit based on regular Gift Aid
 * Limit = min(£8,000, 10 × regular Gift Aid claimed in the tax year)
 */
export function calculateGasdsLimit(regularGiftAidClaimed: number): number {
  const calculatedLimit = regularGiftAidClaimed * 10;
  return Math.min(8000, calculatedLimit);
}
