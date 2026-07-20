export const SHLINK_API_FETCH_MAX_ITEMS = 5_000;
export const SHLINK_API_FETCH_MAX_PAGES = 100;

export function shlinkApiFetchLimitError(
  fetchedCount: number,
  reportedTotalItems?: number
): string | undefined {
  const exceedsFetchedLimit = fetchedCount > SHLINK_API_FETCH_MAX_ITEMS;
  const exceedsReportedLimit =
    Number.isFinite(reportedTotalItems) &&
    Number(reportedTotalItems) > SHLINK_API_FETCH_MAX_ITEMS;

  return exceedsFetchedLimit || exceedsReportedLimit
    ? `Shlink API export exceeds the ${SHLINK_API_FETCH_MAX_ITEMS.toLocaleString('en-US')}-item API pull limit; export a file and import it in reviewed batches.`
    : undefined;
}

export function isShlinkApiPageComplete(input: {
  page: number;
  pageItemCount: number;
  pageSize: number;
  fetchedCount: number;
  pagesTotal?: number;
  totalItems?: number;
}): boolean {
  if (input.pageItemCount === 0) return true;
  if (input.pagesTotal && input.page >= input.pagesTotal) return true;
  if (!input.pagesTotal && input.pageItemCount < input.pageSize) return true;
  if (input.totalItems && input.fetchedCount >= input.totalItems) return true;
  return false;
}
