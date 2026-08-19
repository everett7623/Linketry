/**
 * Clipboard writes reject on denied permission, an unfocused document, or an
 * insecure context. Callers need the outcome so they never claim a copy that
 * did not happen.
 */
export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
