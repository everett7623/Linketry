export const SHLINK_API_FETCH_MAX_ITEMS = 5_000;
export const SHLINK_API_FETCH_MAX_PAGES = 100;
/** 单页请求（含重定向与响应体读取）的超时；Admin 端整次拉取的上限是 60 秒。 */
export const SHLINK_API_PAGE_TIMEOUT_MS = 10_000;

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
