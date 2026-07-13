export const IMPORT_WRITE_BATCH_SIZE = 25;

export function chunkImportItems<T>(items: T[], batchSize = IMPORT_WRITE_BATCH_SIZE): T[][] {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error('Import batch size must be a positive integer');
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }
  return batches;
}
