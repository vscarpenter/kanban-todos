import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeTextInput,
  sanitizeTaskData,
  sanitizeBoardData,
  sanitizeSearchQuery,
  isValidUUID,
  sanitizeBoardId,
  sanitizeTaskId,
  INPUT_LIMITS,
} from '../security';

describe('security utilities', () => {
  describe('sanitizeTextInput', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeTextInput('', 'TASK_TITLE')).toBe('');
    });

    it('returns empty string for non-string input', () => {
      expect(sanitizeTextInput(null as unknown as string, 'TASK_TITLE')).toBe('');
      expect(sanitizeTextInput(undefined as unknown as string, 'TASK_TITLE')).toBe('');
    });

    it('passes through normal text unchanged', () => {
      expect(sanitizeTextInput('Hello world', 'TASK_TITLE')).toBe('Hello world');
    });

    it('trims whitespace by default', () => {
      expect(sanitizeTextInput('  Hello  ', 'TASK_TITLE')).toBe('Hello');
    });

    it('skips trimming when trimWhitespace is false', () => {
      const result = sanitizeTextInput('  Hello  ', 'TASK_TITLE', { trimWhitespace: false });
      // Leading/trailing whitespace preserved when trimWhitespace is false
      expect(result).toBe(' Hello ');
    });

    it('strips HTML tags', () => {
      expect(sanitizeTextInput('<b>bold</b>', 'TASK_TITLE')).toBe('bold');
    });

    it('strips script tags (XSS prevention)', () => {
      const xssPayload = '<script>alert(1)</script>';
      const result = sanitizeTextInput(xssPayload, 'TASK_TITLE');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    // Note: protocol prefixes (`javascript:`, `data:`, etc.) and event-handler
    // patterns (`on\w+=`) are no longer stripped — see `removeDangerousContent`
    // in src/lib/utils/security.ts. The XSS threat model relies on React's
    // auto-escaping plus CSP, not on substring blacklisting that historically
    // mangled ordinary user input. The angle-bracket strip remains as a
    // paranoid defence-in-depth.
    //
    // The TASK_DESCRIPTION input type is used here because TASK_TITLE applies
    // an additional whitelist regex (only letters / numbers / a small punctuation
    // set) that strips colons and equals signs regardless of this function — so
    // testing the regression there would conflate the two concerns.
    it('strips lone angle brackets so stored values cannot start an HTML tag', () => {
      // Complete tag-shaped substrings (`<...>`) are removed by the HTML-tag
      // strip step; this test asserts that bare `<` or `>` without a closing
      // partner is also stripped by the defence-in-depth pass that runs after.
      expect(sanitizeTextInput('value > 0 holds', 'TASK_DESCRIPTION', { preserveWhitespace: true }))
        .toBe('value  0 holds');
      expect(sanitizeTextInput('1 < 2 always', 'TASK_DESCRIPTION', { preserveWhitespace: true }))
        .toBe('1  2 always');
    });

    it('preserves "data:" inside ordinary words like "metadata:"', () => {
      const result = sanitizeTextInput('metadata: see appendix A', 'TASK_DESCRIPTION', { preserveWhitespace: true });
      expect(result).toBe('metadata: see appendix A');
    });

    it('preserves identifiers that start with "on" (regression for /on\\w+=/)', () => {
      const result = sanitizeTextInput('Onion = good', 'TASK_DESCRIPTION', { preserveWhitespace: true });
      expect(result).toBe('Onion = good');
    });

    it('preserves "file:" inside ordinary phrases', () => {
      const result = sanitizeTextInput('open file: README.md', 'TASK_DESCRIPTION', { preserveWhitespace: true });
      expect(result).toBe('open file: README.md');
    });

    it('truncates input exceeding max length', () => {
      const longInput = 'a'.repeat(INPUT_LIMITS.TASK_TITLE + 50);
      const result = sanitizeTextInput(longInput, 'TASK_TITLE');
      expect(result.length).toBeLessThanOrEqual(INPUT_LIMITS.TASK_TITLE);
    });

    it('collapses multiple whitespace into single space', () => {
      expect(sanitizeTextInput('Hello    world', 'TASK_TITLE')).toBe('Hello world');
    });

    it('preserves multiple whitespace when option is set', () => {
      const result = sanitizeTextInput('Hello    world', 'TASK_DESCRIPTION', {
        preserveWhitespace: true,
      });
      expect(result).toBe('Hello    world');
    });

    it('handles different input types with correct limits', () => {
      const longInput = 'a'.repeat(1500);

      const titleResult = sanitizeTextInput(longInput, 'TASK_TITLE');
      expect(titleResult.length).toBeLessThanOrEqual(INPUT_LIMITS.TASK_TITLE);

      const descResult = sanitizeTextInput(longInput, 'TASK_DESCRIPTION');
      expect(descResult.length).toBeLessThanOrEqual(INPUT_LIMITS.TASK_DESCRIPTION);

      const boardResult = sanitizeTextInput(longInput, 'BOARD_NAME');
      expect(boardResult.length).toBeLessThanOrEqual(INPUT_LIMITS.BOARD_NAME);
    });
  });

  describe('isValidUUID', () => {
    it('accepts valid v4 UUID', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('accepts valid v1 UUID', () => {
      expect(isValidUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(true);
    });

    it('accepts uppercase UUID', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('rejects empty string', () => {
      expect(isValidUUID('')).toBe(false);
    });

    it('rejects malformed UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
    });

    it('rejects UUID with wrong length', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    });

    it('rejects UUID with invalid characters', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false);
    });

    it('rejects UUID with invalid version', () => {
      expect(isValidUUID('550e8400-e29b-61d4-a716-446655440000')).toBe(false);
    });
  });

  describe('sanitizeTaskData', () => {
    it('sanitizes title and description', () => {
      const result = sanitizeTaskData({
        title: '<script>alert(1)</script>My Task',
        description: '<b>Description</b>',
      });

      expect(result.title).not.toContain('<script>');
      expect(result.description).not.toContain('<b>');
    });

    it('returns empty description when not provided', () => {
      const result = sanitizeTaskData({ title: 'Test' });
      expect(result.description).toBe('');
    });

    it('returns empty tags array when not provided', () => {
      const result = sanitizeTaskData({ title: 'Test' });
      expect(result.tags).toEqual([]);
    });

    it('sanitizes tags and removes empty ones', () => {
      const result = sanitizeTaskData({
        title: 'Test',
        tags: ['valid-tag', '<script>bad</script>', '', 'another'],
      });

      expect(result.tags).not.toContain('');
      result.tags.forEach((tag) => {
        expect(tag).not.toContain('<');
      });
    });

    it('limits tags to MAX_TAGS', () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
      const result = sanitizeTaskData({ title: 'Test', tags: manyTags });

      expect(result.tags.length).toBeLessThanOrEqual(INPUT_LIMITS.MAX_TAGS);
    });

    it('truncates long title', () => {
      const longTitle = 'a'.repeat(INPUT_LIMITS.TASK_TITLE + 100);
      const result = sanitizeTaskData({ title: longTitle });

      expect(result.title.length).toBeLessThanOrEqual(INPUT_LIMITS.TASK_TITLE);
    });
  });

  describe('sanitizeBoardData', () => {
    it('sanitizes board name and description', () => {
      const result = sanitizeBoardData({
        name: '<b>Board</b>',
        description: '<script>alert(1)</script>Description',
      });

      expect(result.name).not.toContain('<b>');
      expect(result.description).not.toContain('<script>');
    });

    it('returns empty description when not provided', () => {
      const result = sanitizeBoardData({ name: 'Test Board' });
      expect(result.description).toBe('');
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('sanitizes search input', () => {
      const result = sanitizeSearchQuery('<script>alert(1)</script>search');
      expect(result).not.toContain('<script>');
    });

    it('returns empty string for empty input', () => {
      expect(sanitizeSearchQuery('')).toBe('');
    });
  });

  describe('RateLimiter', () => {
    // The RateLimiter class is not exported directly, but searchRateLimiter is
    // We test through the exported instance
    it('is tested via searchRateLimiter', async () => {
      // Import the rate limiter instance
      const { searchRateLimiter } = await import('../security');

      // Reset before testing
      searchRateLimiter.reset('test-key');

      // Should allow requests under the limit (default 10)
      for (let i = 0; i < 10; i++) {
        expect(searchRateLimiter.isAllowed('test-key')).toBe(true);
      }

      // 11th request should be blocked
      expect(searchRateLimiter.isAllowed('test-key')).toBe(false);
    });

    it('resets allow requests again after reset', async () => {
      const { searchRateLimiter } = await import('../security');

      // Fill up the limit
      searchRateLimiter.reset('reset-test');
      for (let i = 0; i < 10; i++) {
        searchRateLimiter.isAllowed('reset-test');
      }
      expect(searchRateLimiter.isAllowed('reset-test')).toBe(false);

      // After reset, should allow again
      searchRateLimiter.reset('reset-test');
      expect(searchRateLimiter.isAllowed('reset-test')).toBe(true);
    });

    it('tracks different keys independently', async () => {
      const { searchRateLimiter } = await import('../security');

      searchRateLimiter.reset('key-a');
      searchRateLimiter.reset('key-b');

      // Fill up key-a
      for (let i = 0; i < 10; i++) {
        searchRateLimiter.isAllowed('key-a');
      }

      // key-a blocked, key-b still allowed
      expect(searchRateLimiter.isAllowed('key-a')).toBe(false);
      expect(searchRateLimiter.isAllowed('key-b')).toBe(true);
    });

    it('allows requests after time window expires', async () => {
      const { searchRateLimiter } = await import('../security');

      searchRateLimiter.reset('time-test');

      // Fill up the limit
      for (let i = 0; i < 10; i++) {
        searchRateLimiter.isAllowed('time-test');
      }
      expect(searchRateLimiter.isAllowed('time-test')).toBe(false);

      // Advance time past the 1-second window
      vi.useFakeTimers();
      vi.advanceTimersByTime(1100);

      expect(searchRateLimiter.isAllowed('time-test')).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('sanitizeBoardId', () => {
    it('returns valid UUID unchanged', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(sanitizeBoardId(uuid)).toBe(uuid);
    });

    it('returns null for invalid UUID', () => {
      expect(sanitizeBoardId('not-a-uuid')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(sanitizeBoardId('')).toBeNull();
    });

    it('returns null for non-string input', () => {
      expect(sanitizeBoardId(null as unknown as string)).toBeNull();
    });

    it('trims whitespace', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(sanitizeBoardId(`  ${uuid}  `)).toBe(uuid);
    });
  });

  describe('sanitizeTaskId', () => {
    it('returns valid UUID unchanged', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(sanitizeTaskId(uuid)).toBe(uuid);
    });

    it('returns null for invalid UUID', () => {
      expect(sanitizeTaskId('invalid')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(sanitizeTaskId('')).toBeNull();
    });
  });
});
