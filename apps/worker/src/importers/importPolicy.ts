export type ConflictStrategy = 'skip' | 'rename' | 'overwrite';

export interface ImportValidation {
  valid: boolean;
  errors: string[];
}

export interface PreviewImportItem {
  slug: string;
}

export interface ValidatedImportItem<T extends PreviewImportItem> {
  item: T;
  validation: ImportValidation;
}

export function parseConflictStrategy(value: unknown): ConflictStrategy {
  return value === 'rename' || value === 'overwrite' ? value : 'skip';
}

export function makeUniqueSlug(slug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(slug)) return slug;
  const base = slug.slice(0, 94);
  for (let suffix = 2; suffix < 10000; suffix++) {
    const candidate = `${base}-${suffix}`;
    if (!existingSlugs.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export function summarizeImportPreview<T extends PreviewImportItem>(
  validatedItems: Array<ValidatedImportItem<T>>,
  existingSlugs: Set<string>,
  previewLimit = 200
): {
  total: number;
  valid: number;
  invalid: number;
  conflicts: number;
  preview: Array<T & { _valid: boolean; _errors: string[]; _conflict: boolean }>;
} {
  let valid = 0;
  let invalid = 0;
  let conflicts = 0;
  const preview: Array<T & { _valid: boolean; _errors: string[]; _conflict: boolean }> = [];

  for (const { item, validation } of validatedItems) {
    const conflict = validation.valid && existingSlugs.has(item.slug);
    if (!validation.valid) invalid++;
    else if (conflict) conflicts++;
    else valid++;

    if (preview.length < previewLimit) {
      preview.push({
        ...item,
        _valid: validation.valid,
        _errors: validation.errors,
        _conflict: conflict,
      });
    }
  }

  return { total: validatedItems.length, valid, invalid, conflicts, preview };
}
