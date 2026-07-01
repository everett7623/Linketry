export function parseCsvRows(input: string, opts: { lowercaseHeaders?: boolean } = {}): Record<string, string>[] {
  const lines = input.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const strip = (s: string) => s.trim().replace(/^"|"$/g, '');
  const headers = lines[0].split(',').map((h) => (opts.lowercaseHeaders ? strip(h).toLowerCase() : strip(h)));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(strip);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });
    rows.push(row);
  }
  return rows;
}
