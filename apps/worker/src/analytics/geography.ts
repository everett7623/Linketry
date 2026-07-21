export interface CountryTraffic {
  country: string;
  clicks: number;
}

export interface GeographySummary {
  countries: CountryTraffic[];
  mappedClicks: number;
  unknownClicks: number;
}

const UNMAPPED_CODES = new Set(['A1', 'A2', 'T1', 'XX']);

export function normalizeGeography(rows: CountryTraffic[]): GeographySummary {
  const countryClicks = new Map<string, number>();
  let unknownClicks = 0;

  for (const row of rows) {
    const country = String(row.country ?? '')
      .trim()
      .toUpperCase();
    const clicks = Math.max(0, Number(row.clicks) || 0);
    if (!/^[A-Z]{2}$/.test(country) || UNMAPPED_CODES.has(country)) {
      unknownClicks += clicks;
      continue;
    }
    countryClicks.set(country, (countryClicks.get(country) ?? 0) + clicks);
  }

  const countries = [...countryClicks.entries()]
    .map(([country, clicks]) => ({ country, clicks }))
    .sort((left, right) => right.clicks - left.clicks || left.country.localeCompare(right.country));

  return {
    countries,
    mappedClicks: countries.reduce((total, item) => total + item.clicks, 0),
    unknownClicks,
  };
}

export function legacyTopCountries(geography: GeographySummary): CountryTraffic[] {
  const rows = [...geography.countries];
  if (geography.unknownClicks > 0) {
    rows.push({ country: 'Unknown', clicks: geography.unknownClicks });
  }
  return rows
    .sort((left, right) => right.clicks - left.clicks || left.country.localeCompare(right.country))
    .slice(0, 10);
}
