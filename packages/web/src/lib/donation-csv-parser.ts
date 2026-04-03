export interface DonationRow {
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  amount: string;
  date: string;
  method: string;
  source?: string;
  campaignName?: string;
  reference?: string;
  notes?: string;
  giftAid?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function parseDonationCSV(csvContent: string): {
  headers: string[];
  rows: Record<string, string>[];
  parseErrors: ValidationError[];
} {
  const lines = csvContent.split("\n");
  const parseErrors: ValidationError[] = [];

  if (lines.length < 2) {
    return {
      headers: [],
      rows: [],
      parseErrors: [{ row: 0, field: "file", message: "CSV file is empty" }],
    };
  }

  // Parse header
  const headerLine = lines[0].trim();
  const headers = parseCSVLine(headerLine);

  if (headers.length === 0) {
    return {
      headers: [],
      rows: [],
      parseErrors: [{ row: 1, field: "header", message: "No headers found" }],
    };
  }

  // Parse data rows
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    const values = parseCSVLine(line);

    // Check column count
    if (values.length !== headers.length) {
      parseErrors.push({
        row: i + 1,
        field: "columns",
        message: `Expected ${headers.length} columns, got ${values.length}`,
      });
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push(row);
  }

  return { headers, rows, parseErrors };
}

export function validateDonationRow(
  row: Record<string, string>,
  rowNumber: number
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Required fields
  if (!row.contactEmail?.trim()) {
    errors.push({
      row: rowNumber,
      field: "contactEmail",
      message: "Email is required",
    });
  } else if (!isValidEmail(row.contactEmail)) {
    errors.push({
      row: rowNumber,
      field: "contactEmail",
      message: "Invalid email format",
    });
  }

  if (!row.contactFirstName?.trim()) {
    errors.push({
      row: rowNumber,
      field: "contactFirstName",
      message: "First name is required",
    });
  }

  if (!row.contactLastName?.trim()) {
    errors.push({
      row: rowNumber,
      field: "contactLastName",
      message: "Last name is required",
    });
  }

  if (!row.amount?.trim()) {
    errors.push({
      row: rowNumber,
      field: "amount",
      message: "Amount is required",
    });
  } else {
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push({
        row: rowNumber,
        field: "amount",
        message: "Amount must be a positive number",
      });
    }
  }

  if (!row.date?.trim()) {
    errors.push({
      row: rowNumber,
      field: "date",
      message: "Date is required",
    });
  } else if (!isValidDate(row.date)) {
    errors.push({
      row: rowNumber,
      field: "date",
      message: "Invalid date format (use YYYY-MM-DD)",
    });
  }

  if (!row.method?.trim()) {
    errors.push({
      row: rowNumber,
      field: "method",
      message: "Payment method is required",
    });
  } else if (!isValidPaymentMethod(row.method)) {
    errors.push({
      row: rowNumber,
      field: "method",
      message: `Invalid payment method. Use: CASH, CARD, BANK_TRANSFER, CHEQUE, ONLINE, STANDING_ORDER, DIRECT_DEBIT`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidPaymentMethod(method: string): boolean {
  const validMethods = [
    "CASH",
    "CARD",
    "BANK_TRANSFER",
    "CHEQUE",
    "ONLINE",
    "STANDING_ORDER",
    "DIRECT_DEBIT",
  ];
  return validMethods.includes(method.toUpperCase());
}
