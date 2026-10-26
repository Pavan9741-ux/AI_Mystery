import { describe, expect, it } from 'vitest';
import { formatTimestamp } from './case.js';

describe('formatTimestamp', () => {
  it('returns a readable placeholder when a record has no timestamp', () => {
    expect(formatTimestamp()).toBe('Time unrecorded');
  });
  it('formats a timestamp into a date and time', () => {
    expect(formatTimestamp('2026-10-24T14:00:00.000Z')).toContain('2026');
  });
});
