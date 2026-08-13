import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names and de-duplicates conflicting ones', () => {
    expect(cn('px-2', 'px-4', 'py-1')).toContain('py-1');
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});
