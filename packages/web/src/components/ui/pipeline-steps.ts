/**
 * Helper functions for building timeline steps from grant/legacy data.
 * Separated from the client component so they can be used in server components.
 */

export interface TimelineStep {
  key: string;
  label: string;
  date?: string | null;
}

const fmt = (d?: Date | null) =>
  d
    ? d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
    : null;

export function getGrantSteps(grant: {
  status: string;
  applicationDeadline?: Date | null;
  submittedDate?: Date | null;
  decisionDate?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
}): TimelineStep[] {
  return [
    { key: "IDENTIFIED", label: "Identified", date: null },
    { key: "RESEARCHING", label: "Researching", date: null },
    { key: "APPLYING", label: "Applying", date: fmt(grant.applicationDeadline) },
    { key: "SUBMITTED", label: "Submitted", date: fmt(grant.submittedDate) },
    { key: "SUCCESSFUL", label: "Awarded", date: fmt(grant.decisionDate) },
    { key: "REPORTING", label: "Reporting", date: fmt(grant.startDate) },
    { key: "COMPLETED", label: "Completed", date: fmt(grant.endDate) },
  ];
}

export function getLegacySteps(legacy: {
  status: string;
  dateNotified?: Date | null;
  probateGranted?: Date | null;
  dateReceived?: Date | null;
}): TimelineStep[] {
  return [
    { key: "NOTIFIED", label: "Notified", date: fmt(legacy.dateNotified) },
    { key: "INVESTIGATING", label: "Investigating", date: null },
    { key: "PROBATE", label: "Probate", date: fmt(legacy.probateGranted) },
    { key: "AWAITING_PAYMENT", label: "Awaiting Payment", date: null },
    { key: "RECEIVED", label: "Received", date: fmt(legacy.dateReceived) },
    { key: "CLOSED", label: "Closed", date: null },
  ];
}
