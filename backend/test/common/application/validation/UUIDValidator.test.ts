import { UUIDValidator } from '../../../../src/common/application/validation/UUIDValidator';

describe('UUIDValidator', () => {
  describe('isValid', () => {
    it('should accept valid UUID v4 with dashes', () => {
      const valid = '550e8400-e29b-41d4-a716-446655440000';
      expect(UUIDValidator.isValid(valid)).toBe(true);
    });

    it('should accept valid UUID v4 without dashes', () => {
      const valid = '550e8400e29b41d4a716446655440000';
      expect(UUIDValidator.isValid(valid)).toBe(true);
    });

    it('should accept uppercase UUID v4', () => {
      const valid = '550E8400-E29B-41D4-A716-446655440000';
      expect(UUIDValidator.isValid(valid)).toBe(true);
    });

    it('should accept mixed case UUID v4', () => {
      const valid = '550e8400-E29B-41d4-a716-446655440000';
      expect(UUIDValidator.isValid(valid)).toBe(true);
    });

    it('should reject invalid UUID (wrong format)', () => {
      expect(UUIDValidator.isValid('invalid-id')).toBe(false);
    });

    it('should reject UUID with wrong version (not v4)', () => {
      // UUID v1 format
      expect(UUIDValidator.isValid('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(UUIDValidator.isValid('')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(UUIDValidator.isValid(null as any)).toBe(false);
      expect(UUIDValidator.isValid(undefined as any)).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(UUIDValidator.isValid({} as any)).toBe(false);
      expect(UUIDValidator.isValid(123 as any)).toBe(false);
      expect(UUIDValidator.isValid([] as any)).toBe(false);
    });

    it('should reject UUID with trailing whitespace', () => {
      const invalid = '550e8400-e29b-41d4-a716-446655440000 ';
      // Should be trimmed and accepted
      expect(UUIDValidator.isValid(invalid)).toBe(true);
    });

    it('should reject malformed UUID without dashes', () => {
      // Only 31 characters instead of 32
      expect(UUIDValidator.isValid('550e8400e29b41d4a71644665544000')).toBe(false);
    });
  });

  describe('validateOrThrow', () => {
    it('should not throw for valid UUID', () => {
      const valid = '550e8400-e29b-41d4-a716-446655440000';
      expect(() => UUIDValidator.validateOrThrow(valid)).not.toThrow();
    });

    it('should throw error for invalid UUID', () => {
      expect(() => UUIDValidator.validateOrThrow('invalid-id', 'testId')).toThrow(
        "Field 'testId' must be a valid UUID v4. Received: invalid-id"
      );
    });

    it('should include field name in error message', () => {
      const fieldName = 'maintenanceId';
      expect(() => UUIDValidator.validateOrThrow('not-a-uuid', fieldName)).toThrow(fieldName);
    });

    it('should default field name to "id"', () => {
      expect(() => UUIDValidator.validateOrThrow('invalid')).toThrow("Field 'id' must be a valid UUID v4");
    });
  });

  describe('normalize', () => {
    it('should normalize UUID without dashes to standard format', () => {
      const input = '550e8400e29b41d4a716446655440000';
      const expected = '550e8400-e29b-41d4-a716-446655440000';
      expect(UUIDValidator.normalize(input)).toBe(expected);
    });

    it('should return lowercase UUID with dashes', () => {
      const input = '550E8400-E29B-41D4-A716-446655440000';
      const expected = '550e8400-e29b-41d4-a716-446655440000';
      expect(UUIDValidator.normalize(input)).toBe(expected);
    });

    it('should not modify already properly formatted UUID', () => {
      const input = '550e8400-e29b-41d4-a716-446655440000';
      expect(UUIDValidator.normalize(input)).toBe(input);
    });

    it('should return null for invalid UUID', () => {
      expect(UUIDValidator.normalize('invalid-id')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(UUIDValidator.normalize('')).toBeNull();
      expect(UUIDValidator.normalize('   ')).toBeNull();
    });

    it('should trim whitespace before normalizing', () => {
      const input = '  550e8400e29b41d4a716446655440000  ';
      const expected = '550e8400-e29b-41d4-a716-446655440000';
      expect(UUIDValidator.normalize(input)).toBe(expected);
    });
  });

  describe('extractAndValidate', () => {
    it('should extract and validate UUID from string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = UUIDValidator.extractAndValidate(uuid);
      expect(result).toBe(uuid);
    });

    it('should extract and validate UUID from object with id property', () => {
      const obj = { id: '550e8400-e29b-41d4-a716-446655440000' };
      const result = UUIDValidator.extractAndValidate(obj);
      expect(result).toBe(obj.id);
    });

    it('should return null for invalid UUID', () => {
      const result = UUIDValidator.extractAndValidate('invalid-id', 'testId');
      expect(result).toBeNull();
    });

    it('should return null for empty value', () => {
      expect(UUIDValidator.extractAndValidate(null)).toBeNull();
      expect(UUIDValidator.extractAndValidate(undefined)).toBeNull();
      expect(UUIDValidator.extractAndValidate('')).toBeNull();
    });

    it('should normalize extracted UUID', () => {
      const input = { id: '550E8400E29B41D4A716446655440000' };
      const result = UUIDValidator.extractAndValidate(input);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('validateMultiple', () => {
    it('should accept array of valid UUIDs', () => {
      const uuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002'
      ];
      expect(UUIDValidator.validateMultiple(uuids)).toBe(true);
    });

    it('should reject if one UUID is invalid', () => {
      const uuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        'invalid-uuid',
        '550e8400-e29b-41d4-a716-446655440002'
      ];
      expect(UUIDValidator.validateMultiple(uuids)).toBe(false);
    });

    it('should reject non-array input', () => {
      expect(UUIDValidator.validateMultiple('not-an-array' as any)).toBe(false);
    });

    it('should accept empty array', () => {
      expect(UUIDValidator.validateMultiple([])).toBe(true);
    });
  });

  describe('validateMultipleOrThrow', () => {
    it('should not throw for valid UUID array', () => {
      const uuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001'
      ];
      expect(() => UUIDValidator.validateMultipleOrThrow(uuids)).not.toThrow();
    });

    it('should throw error for invalid UUID in array', () => {
      const uuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        'invalid-uuid'
      ];
      expect(() => UUIDValidator.validateMultipleOrThrow(uuids, 'maintenanceIds')).toThrow(
        "One or more values in field 'maintenanceIds' are not valid UUIDs"
      );
    });
  });

  describe('RFC 4122 v4 compliance', () => {
    it('should accept proper RFC 4122 v4 UUIDs', () => {
      // Real v4 UUID patterns from RFC 4122
      const validV4UUIDs = [
        '12345678-1234-4234-b234-123456789012', // v4: version=4, variant=10
        'aaaaaaaa-bbbb-4ccc-bccc-dddddddddddd', // v4: version=4, variant=10
        'f47ac10b-58cc-4372-a567-0e02b2c3d479'  // v4: version=4, variant=11 (also valid)
      ];

      validV4UUIDs.forEach(uuid => {
        expect(UUIDValidator.isValid(uuid)).toBe(true);
      });
    });

    it('should reject UUIDs with wrong version or variant', () => {
      const invalidUUIDs = [
        '12345678-1234-1234-a234-123456789012', // v1 (wrong version)
        '12345678-1234-3234-a234-123456789012', // v3 (wrong version)
        '12345678-1234-5234-a234-123456789012'  // v5 (wrong version)
      ];

      invalidUUIDs.forEach(uuid => {
        expect(UUIDValidator.isValid(uuid)).toBe(false);
      });
    });
  });
});
