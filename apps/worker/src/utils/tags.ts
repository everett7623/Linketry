export function normalizeTags(input: string | string[]): string[] {
  return Array.isArray(input) ? input : String(input).split(',').map((t) => t.trim()).filter(Boolean);
}
