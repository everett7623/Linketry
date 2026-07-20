import type { ImportAdapter, ImportValidationResult, NormalizedImportItem } from '@linketry/shared';
import { validateLongUrl, validateSlug } from '@linketry/shared';
import { detectBitlyCsv, detectShortIoCsv, parseBitlyCsv, parseShortIoCsv } from './mainstreamCore';

function validateImportItem(item: NormalizedImportItem): ImportValidationResult {
  const errors: string[] = [];
  const slugResult = validateSlug(item.slug);
  if (!slugResult.valid) errors.push(`Invalid slug: ${slugResult.error}`);
  const urlResult = validateLongUrl(item.longUrl);
  if (!urlResult.valid) errors.push(`Invalid URL: ${urlResult.error}`);
  return { valid: errors.length === 0, errors };
}

export const BitlyCsvAdapter: ImportAdapter = {
  source: 'bitly-csv',

  detect(input: unknown): boolean {
    return detectBitlyCsv(input);
  },

  async parse(input: unknown): Promise<NormalizedImportItem[]> {
    return parseBitlyCsv(input);
  },

  validate: validateImportItem,
};

export const ShortIoCsvAdapter: ImportAdapter = {
  source: 'shortio-csv',

  detect(input: unknown): boolean {
    return detectShortIoCsv(input);
  },

  async parse(input: unknown): Promise<NormalizedImportItem[]> {
    return parseShortIoCsv(input);
  },

  validate: validateImportItem,
};
