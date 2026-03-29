import { prisma } from "./prisma";

export interface FinancialYear {
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number; // 1-12
  endDay: number;
}

/**
 * Get system settings (creates default row if none exists).
 */
export async function getSystemSettings() {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: "default", financialYearEndMonth: 3, financialYearEndDay: 31 },
    });
  }

  return settings;
}

/**
 * Compute start/end dates for a financial year given the year-end setting.
 * Example: If FY ends 31 March, then FY 2025 = 1 Apr 2024 – 31 Mar 2025.
 */
export function getFinancialYearDates(
  fyLabel: number,
  endMonth: number,
  endDay: number
): { start: Date; end: Date } {
  // FY "2025" ends on endMonth/endDay of 2025, starts day-after of previous year
  const endDate = new Date(fyLabel, endMonth - 1, endDay, 23, 59, 59, 999);

  // Start is the day after the previous year's end
  const startDate = new Date(fyLabel - 1, endMonth - 1, endDay + 1, 0, 0, 0, 0);

  return { start: startDate, end: endDate };
}

/**
 * Get the current financial year label.
 * If FY ends March 31, then Jan–Mar 2026 is FY 2026, Apr–Dec 2026 is FY 2027.
 */
export function getCurrentFinancialYear(endMonth: number, endDay: number): number {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentDay = now.getDate();

  // If we're past the year-end date, we're in the NEXT financial year
  if (currentMonth > endMonth || (currentMonth === endMonth && currentDay > endDay)) {
    return now.getFullYear() + 1;
  }
  return now.getFullYear();
}
