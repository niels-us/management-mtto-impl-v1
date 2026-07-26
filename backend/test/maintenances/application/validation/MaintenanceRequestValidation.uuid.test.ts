import { MaintenanceRequestValidation } from '../../../../src/maintenances/application/validation/MaintenanceRequestValidation';
import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

describe('MaintenanceRequestValidation - UUID Validation', () => {
  let validator: MaintenanceRequestValidation;

  beforeEach(() => {
    validator = new MaintenanceRequestValidation();
  });

  describe('validateVesselId', () => {
    it('should accept valid UUID vessel ID', () => {
      const validVesselId = uuidv4();
      expect(() => validator.validateVesselId(validVesselId)).not.toThrow();
    });

    it('should reject empty vessel ID', () => {
      expect(() => validator.validateVesselId('')).toThrow(BadRequestException);
      expect(() => validator.validateVesselId('')).toThrow('Vessel ID is required');
    });

    it('should reject invalid UUID vessel ID', () => {
      expect(() => validator.validateVesselId('invalid-id')).toThrow(BadRequestException);
      expect(() => validator.validateVesselId('invalid-id')).toThrow('Invalid vessel ID format');
    });

    it('should accept UUID without dashes', () => {
      const validVesselId = uuidv4().replace(/-/g, '');
      expect(() => validator.validateVesselId(validVesselId)).not.toThrow();
    });

    it('should accept uppercase UUID', () => {
      const validVesselId = uuidv4().toUpperCase();
      expect(() => validator.validateVesselId(validVesselId)).not.toThrow();
    });
  });

  describe('validateMaintenanceId', () => {
    it('should accept valid UUID maintenance ID', () => {
      const validMaintenanceId = uuidv4();
      expect(() => validator.validateMaintenanceId(validMaintenanceId)).not.toThrow();
    });

    it('should reject empty maintenance ID', () => {
      expect(() => validator.validateMaintenanceId('')).toThrow(BadRequestException);
      expect(() => validator.validateMaintenanceId('')).toThrow('Maintenance ID is required');
    });

    it('should reject invalid UUID maintenance ID', () => {
      expect(() => validator.validateMaintenanceId('invalid-id')).toThrow(BadRequestException);
      expect(() => validator.validateMaintenanceId('invalid-id')).toThrow('Invalid maintenance ID format');
    });
  });

  describe('validateComponentId', () => {
    it('should accept valid UUID component ID', () => {
      const validComponentId = uuidv4();
      expect(() => validator.validateComponentId(validComponentId)).not.toThrow();
    });

    it('should reject empty component ID', () => {
      expect(() => validator.validateComponentId('')).toThrow(BadRequestException);
      expect(() => validator.validateComponentId('')).toThrow('Component ID is required');
    });

    it('should reject invalid UUID component ID', () => {
      expect(() => validator.validateComponentId('invalid-id')).toThrow(BadRequestException);
      expect(() => validator.validateComponentId('invalid-id')).toThrow('Invalid component ID format');
    });
  });

  describe('validateCustomerId', () => {
    it('should accept valid UUID customer ID', () => {
      const validCustomerId = uuidv4();
      expect(() => validator.validateCustomerId(validCustomerId)).not.toThrow();
    });

    it('should reject empty customer ID', () => {
      expect(() => validator.validateCustomerId('')).toThrow(BadRequestException);
      expect(() => validator.validateCustomerId('')).toThrow('Customer ID is required');
    });

    it('should reject invalid UUID customer ID', () => {
      expect(() => validator.validateCustomerId('invalid-id')).toThrow(BadRequestException);
      expect(() => validator.validateCustomerId('invalid-id')).toThrow('Invalid customer ID format');
    });
  });

  describe('validateCreateMaintenance with UUID validation', () => {
    it('should reject invalid customerId', async () => {
      const payload = {
        description: 'Test description',
        scheduledAt: new Date().toISOString(),
        customerId: 'invalid-uuid',
        createdBy: uuidv4()
      };

      await expect(validator.validateCreateMaintenance(payload)).rejects.toThrow(BadRequestException);
    });

    it('should accept valid UUIDs in customerId', async () => {
      const payload = {
        description: 'Test description',
        scheduledAt: new Date().toISOString(),
        customerId: uuidv4(),
        createdBy: uuidv4()
      };

      await expect(validator.validateCreateMaintenance(payload)).resolves.not.toThrow();
    });

    it('should accept UUID without dashes', async () => {
      const payload = {
        description: 'Test description',
        scheduledAt: new Date().toISOString(),
        customerId: uuidv4().replace(/-/g, ''),
        createdBy: uuidv4()
      };

      await expect(validator.validateCreateMaintenance(payload)).resolves.not.toThrow();
    });
  });

  describe('validateUpdateMaintenance with UUID validation', () => {
    it('should reject missing status', async () => {
      const payload = {
        customerId: uuidv4()
      } as any;

      await expect(validator.validateUpdateMaintenance(payload)).rejects.toThrow(BadRequestException);
    });

    it('should accept valid status', async () => {
      const payload = {
        status: 'completed' as const,
        customerId: uuidv4()
      };

      await expect(validator.validateUpdateMaintenance(payload)).resolves.not.toThrow();
    });

    it('should accept in_progress status', async () => {
      const payload = {
        status: 'in_progress' as const,
        customerId: uuidv4()
      };

      await expect(validator.validateUpdateMaintenance(payload)).resolves.not.toThrow();
    });

    it('should accept pending status', async () => {
      const payload = {
        status: 'pending' as const,
        customerId: uuidv4()
      };

      await expect(validator.validateUpdateMaintenance(payload)).resolves.not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should reject UUID with null bytes', () => {
      const invalidId = uuidv4() + '\0';
      expect(() => validator.validateVesselId(invalidId)).toThrow();
    });

    it('should handle whitespace in UUIDs', () => {
      const validId = `  ${uuidv4()}  `;
      // Should trim and validate
      expect(() => validator.validateVesselId(validId)).not.toThrow();
    });

    it('should reject partially valid UUIDs', () => {
      const partialId = '550e8400-e29b-41d4-a716'; // Missing last segment
      expect(() => validator.validateMaintenanceId(partialId)).toThrow(BadRequestException);
    });

    it('should reject UUIDs with extra characters', () => {
      const invalidId = `${uuidv4()}-extra`;
      expect(() => validator.validateComponentId(invalidId)).toThrow(BadRequestException);
    });
  });
});
