import { describe, expect, it } from 'vitest';
import { createMaintenanceSchema } from './model';

describe('createMaintenanceSchema', () => {
  it('accepts a valid payload', () => {
    const result = createMaintenanceSchema.safeParse({
      description: 'Replace oil filter',
      scheduledAt: '2026-08-15T10:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a description shorter than 3 characters', () => {
    const result = createMaintenanceSchema.safeParse({
      description: 'ab',
      scheduledAt: '2026-08-15T10:00',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('description');
    }
  });

  it('rejects a missing scheduled date', () => {
    const result = createMaintenanceSchema.safeParse({
      description: 'Valid description',
      scheduledAt: '',
    });
    expect(result.success).toBe(false);
  });
});
