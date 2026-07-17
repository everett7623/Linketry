export interface ConversionInput {
  eventId: string | null;
  eventName: string;
  value: number | null;
  currency: string | null;
  metadata: string | null;
}

export interface ConversionFilterShape {
  country?: string;
  device?: string;
  browser?: string;
  referer?: string;
}

export function parseConversionInput(input: unknown): {
  value?: ConversionInput;
  error?: string;
} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Conversion body must be a JSON object' };
  }
  const body = input as Record<string, unknown>;
  const eventId = optionalIdentifier(body.event_id, 'event_id', 120);
  if (eventId.error) return { error: eventId.error };

  const eventName = typeof body.event_name === 'string' ? body.event_name.trim() : '';
  if (!/^[a-zA-Z0-9_.:-]{1,80}$/.test(eventName)) {
    return {
      error:
        'event_name must be 1-80 characters using letters, numbers, dot, underscore, colon, or dash',
    };
  }

  const value = parseOptionalNumber(body.value);
  if (value.error) return { error: value.error };

  const currency =
    typeof body.currency === 'string' && body.currency.trim()
      ? body.currency.trim().toUpperCase()
      : null;
  if (currency && !/^[A-Z0-9]{2,12}$/.test(currency)) {
    return { error: 'currency must be 2-12 uppercase letters or numbers' };
  }

  const metadata = stringifyMetadata(body.metadata);
  if (metadata.error) return { error: metadata.error };

  return {
    value: {
      eventId: eventId.value,
      eventName,
      value: value.value,
      currency,
      metadata: metadata.value,
    },
  };
}

export function conversionAttributionAvailable(filters: ConversionFilterShape): boolean {
  return !filters.country && !filters.device && !filters.browser && !filters.referer;
}

export function calculateConversionEventRate(
  conversions: number | null,
  totalClicks: number,
  botClicks: number,
  attributionAvailable: boolean
): number | null {
  if (!attributionAvailable || conversions === null) return null;
  const eligibleClicks = Math.max(0, totalClicks - botClicks);
  if (eligibleClicks === 0) return 0;
  return Number(((conversions / eligibleClicks) * 100).toFixed(2));
}

function optionalIdentifier(
  value: unknown,
  field: string,
  maxLength: number
): { value: string | null; error?: string } {
  if (value === undefined || value === null || value === '') return { value: null };
  const text = typeof value === 'string' ? value.trim() : '';
  const pattern = new RegExp(`^[a-zA-Z0-9_.:-]{1,${maxLength}}$`);
  if (!pattern.test(text)) {
    return {
      value: null,
      error: `${field} must be 1-${maxLength} characters using letters, numbers, dot, underscore, colon, or dash`,
    };
  }
  return { value: text };
}

function parseOptionalNumber(value: unknown): { value: number | null; error?: string } {
  if (value === undefined || value === null || value === '') return { value: null };
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return { value: null, error: 'value must be a number' };
  return { value: parsed };
}

function stringifyMetadata(value: unknown): { value: string | null; error?: string } {
  if (value === undefined || value === null || value === '') return { value: null };
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (text.length > 4000) {
    return { value: null, error: 'metadata must be 4000 characters or less' };
  }
  return { value: text };
}
