import { describe, expect, it } from 'vitest';

import {
  isReservedSlug,
  validateLongUrl,
  validateSlug,
} from './index';

describe('validators', () => {
  describe('validateSlug', () => {
    it('accepts valid slugs', () => {
      expect(validateSlug('My_Slug-123')).toEqual({ valid: true });
    });

    it('rejects empty, reserved, invalid, and overlong slugs', () => {
      expect(validateSlug('')).toEqual({
        valid: false,
        error: 'Slug cannot be empty',
      });
      expect(validateSlug('admin')).toEqual({
        valid: false,
        error: '"admin" is a reserved path and cannot be used as a slug',
      });
      expect(validateSlug('bad slug')).toEqual({
        valid: false,
        error: 'Slug can only contain letters, numbers, hyphens, and underscores',
      });
      expect(validateSlug('a'.repeat(101))).toEqual({
        valid: false,
        error: 'Slug cannot exceed 100 characters',
      });
    });
  });

  describe('validateLongUrl', () => {
    it('accepts https URLs', () => {
      expect(validateLongUrl('https://example.com/path?q=1')).toEqual({
        valid: true,
      });
    });

    it('rejects missing schemes and unsafe protocols', () => {
      expect(validateLongUrl('example.com')).toEqual({
        valid: false,
        error: 'URL must start with http:// or https://',
      });
      expect(validateLongUrl('javascript:alert(1)')).toEqual({
        valid: false,
        error: 'javascript: URLs are not allowed',
      });
      expect(validateLongUrl('data:text/plain,hello')).toEqual({
        valid: false,
        error: 'data: URLs are not allowed',
      });
      expect(validateLongUrl('http://%')).toEqual({
        valid: false,
        error: 'Invalid URL format',
      });
    });
  });

  it('detects reserved slugs case-insensitively', () => {
    expect(isReservedSlug('ADMIN')).toBe(true);
    expect(isReservedSlug('projects')).toBe(false);
  });
});
