/**
 * Bank Statement CSV Parser
 * Supports multiple bank formats and auto-detects delimiters
 */

export interface ParsedBankTransaction {
  date: Date;
  description: string;
  reference?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  balance?: number;
}

/**
 * Detect CSV delimiter by sampling the first line
 */
function detectDelimiter(firstLine: string): string {
  const delimiters = [',', '\t', ';', '|'];
  let maxCount = 0;
  let detectedDelimiter = ',';

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }

  return detectedDelimiter;
}

/**
 * Parse CSV content - handles quoted fields and escaped quotes
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse date in various formats
 */
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Try common formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // DD/MM/YYYY or MM/DD/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/, // DD-MM-YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
  ];

  for (const format of formats) {
    const match = dateString.trim().match(format);
    if (match) {
      let day: number, month: number, year: number;

      if (format === formats[0]) {
        // DD/MM/YYYY or MM/DD/YYYY (assume DD/MM for international)
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      } else if (format === formats[1]) {
        // YYYY-MM-DD
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
      } else if (format === formats[2]) {
        // DD-MM-YYYY
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      } else {
        // DD.MM.YYYY
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      }

      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

/**
 * Parse amount string (handles various formats with thousands separators)
 */
function parseAmount(amountString: string): number | null {
  if (!amountString) return null;

  // Remove common currency symbols
  let cleaned = amountString
    .replace(/[£€$¥]/g, '')
    .trim();

  // Handle parentheses for negative amounts
  let isNegative = false;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    isNegative = true;
    cleaned = cleaned.slice(1, -1);
  }

  // Handle minus sign
  if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.substring(1);
  }

  // Remove thousands separators (comma or period, depending on locale)
  // Assume the last decimal point/comma is the decimal separator
  let decimalIndex = Math.max(
    cleaned.lastIndexOf('.'),
    cleaned.lastIndexOf(',')
  );

  if (decimalIndex !== -1) {
    const potentialDecimal = cleaned[decimalIndex];
    const afterDecimal = cleaned.substring(decimalIndex + 1);

    // If exactly 2-3 digits after the separator, it's likely a decimal
    if (afterDecimal.length <= 3) {
      // Replace all other separators with empty
      cleaned = cleaned
        .substring(0, decimalIndex)
        .replace(/[,.]/g, '') +
        potentialDecimal +
        afterDecimal;
    } else {
      // It's a thousands separator, remove all separators
      cleaned = cleaned.replace(/[,.]/g, '');
    }
  }

  const amount = parseFloat(cleaned);
  if (isNaN(amount)) return null;

  return isNegative ? -amount : amount;
}

/**
 * Auto-detect column mapping from header row
 */
function detectColumnMapping(
  headers: string[]
): Record<string, number | undefined> {
  const mapping: Record<string, number | undefined> = {
    date: undefined,
    description: undefined,
    amount: undefined,
    reference: undefined,
    balance: undefined,
  };

  const lowerHeaders = headers.map((h) => h.toLowerCase());

  for (let i = 0; i < lowerHeaders.length; i++) {
    const header = lowerHeaders[i];

    // Match date columns
    if (
      !mapping.date &&
      (header.includes('date') ||
        header.includes('transaction date') ||
        header === 'td')
    ) {
      mapping.date = i;
    }

    // Match description columns
    if (
      !mapping.description &&
      (header.includes('description') ||
        header.includes('memo') ||
        header.includes('detail') ||
        header === 'desc')
    ) {
      mapping.description = i;
    }

    // Match amount columns
    if (
      !mapping.amount &&
      (header.includes('amount') ||
        header.includes('money in') ||
        header.includes('money out') ||
        header.includes('debit') ||
        header.includes('credit') ||
        header === 'amt')
    ) {
      mapping.amount = i;
    }

    // Match reference columns
    if (
      !mapping.reference &&
      (header.includes('reference') ||
        header.includes('ref') ||
        header.includes('check') ||
        header.includes('cheque') ||
        header === 'ref' ||
        header === 'chq')
    ) {
      mapping.reference = i;
    }

    // Match balance columns
    if (
      !mapping.balance &&
      (header.includes('balance') ||
        header.includes('running balance') ||
        header === 'bal')
    ) {
      mapping.balance = i;
    }
  }

  return mapping;
}

/**
 * Parse bank statement CSV
 * Supports multiple formats: UK banking format (Money In/Out), Amount format, etc.
 */
export function parseCSV(
  content: string,
  columnMapping?: Record<string, number>
): {
  transactions: ParsedBankTransaction[];
  mapping: Record<string, number | undefined>;
  errors: Array<{ row: number; error: string }>;
} {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length === 0) {
    return { transactions: [], mapping: {}, errors: [] };
  }

  // Detect delimiter
  const delimiter = detectDelimiter(lines[0]);

  // Parse header row
  const headers = parseCSVLine(lines[0], delimiter);
  let mapping = columnMapping || detectColumnMapping(headers);

  // Ensure we have required columns
  if (mapping.date === undefined || mapping.amount === undefined) {
    return {
      transactions: [],
      mapping,
      errors: [
        {
          row: 0,
          error:
            'Could not auto-detect date and amount columns. Please specify mapping.',
        },
      ],
    };
  }

  const transactions: ParsedBankTransaction[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    try {
      const fields = parseCSVLine(lines[i], delimiter);

      // Get date
      const dateStr = mapping.date !== undefined ? fields[mapping.date] : '';
      const date = parseDate(dateStr);
      if (!date) {
        errors.push({ row: i + 1, error: 'Invalid date format' });
        continue;
      }

      // Get description
      const description =
        mapping.description !== undefined ? fields[mapping.description] : '';
      if (!description) {
        errors.push({ row: i + 1, error: 'Missing description' });
        continue;
      }

      // Get amount (might be split into "money in" and "money out" columns)
      let amount: number | null = null;
      let type: 'CREDIT' | 'DEBIT' = 'CREDIT';

      const amountStr =
        mapping.amount !== undefined ? fields[mapping.amount] : '';
      amount = parseAmount(amountStr);

      // Handle UK format: separate "Money In" and "Money Out" columns
      if (amount === null || (amount === 0 && mapping.amount !== undefined)) {
        // Check if there are separate money in/out columns
        const moneyInIdx = headers.findIndex(
          (h) =>
            h.toLowerCase().includes('money in') ||
            h.toLowerCase().includes('credit')
        );
        const moneyOutIdx = headers.findIndex(
          (h) =>
            h.toLowerCase().includes('money out') ||
            h.toLowerCase().includes('debit')
        );

        if (moneyInIdx !== -1 && moneyOutIdx !== -1) {
          const moneyIn = parseAmount(fields[moneyInIdx]);
          const moneyOut = parseAmount(fields[moneyOutIdx]);

          if (moneyIn && moneyIn > 0) {
            amount = moneyIn;
            type = 'CREDIT';
          } else if (moneyOut && moneyOut > 0) {
            amount = moneyOut;
            type = 'DEBIT';
          }
        }
      }

      if (amount === null) {
        errors.push({ row: i + 1, error: 'Invalid or missing amount' });
        continue;
      }

      // Determine type based on amount sign
      if (amount < 0) {
        type = 'DEBIT';
        amount = Math.abs(amount);
      }

      // Get reference
      const reference =
        mapping.reference !== undefined ? fields[mapping.reference] : undefined;

      // Get balance
      let balance: number | undefined;
      if (mapping.balance !== undefined) {
        const balanceStr = fields[mapping.balance];
        const parsedBalance = parseAmount(balanceStr);
        if (parsedBalance !== null) {
          balance = parsedBalance;
        }
      }

      transactions.push({
        date,
        description,
        amount,
        type,
        reference,
        balance,
      });
    } catch (error) {
      errors.push({
        row: i + 1,
        error: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  return { transactions, mapping, errors };
}
