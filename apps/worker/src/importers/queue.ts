export async function runAfterImportQueueBoundary<T>(
  startProcessing: () => Promise<void>,
  processImport: () => Promise<T>
): Promise<T> {
  await startProcessing();
  return processImport();
}
