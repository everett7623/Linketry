export const IMPORT_CONTENT_MAX_BYTES = 10 * 1024 * 1024;
export const IMPORT_ITEM_MAX_COUNT = 50_000;

export function importContentByteLength(content: string): number {
  return new TextEncoder().encode(content).byteLength;
}

export function isImportContentWithinLimit(content: string): boolean {
  return importContentByteLength(content) <= IMPORT_CONTENT_MAX_BYTES;
}

export function isImportItemCountWithinLimit(count: number): boolean {
  return Number.isInteger(count) && count >= 0 && count <= IMPORT_ITEM_MAX_COUNT;
}

export function formatImportContentLimit(): string {
  return `${IMPORT_CONTENT_MAX_BYTES / (1024 * 1024)} MiB`;
}

export function formatImportItemLimit(): string {
  return IMPORT_ITEM_MAX_COUNT.toLocaleString('en-US');
}
