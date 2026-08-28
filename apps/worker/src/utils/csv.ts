/**
 * CSV field encoding for Admin exports.
 *
 * Beyond RFC 4180 quoting, cells are neutralized against spreadsheet formula
 * injection: exports carry visitor-controlled text (referer, user agent, fetched
 * page titles), and a value such as `=HYPERLINK(...)` or `=cmd|...` would execute
 * when the file is opened in Excel / Google Sheets.
 */

/** Leading characters a spreadsheet may treat as the start of a formula. */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/** Plain integers and decimals (including a leading minus) are safe to pass through. */
function isPlainNumber(text: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(text.trim());
}

export function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);

  if (FORMULA_LEAD.test(text) && !isPlainNumber(text)) {
    // Prefix with a single quote and force-quote so every spreadsheet renders it as text.
    return `"'${text.replace(/"/g, '""')}"`;
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function csvRow(values: Array<string | number | null | undefined>): string {
  return values.map(csvCell).join(',');
}
