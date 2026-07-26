import { Logger } from '@nestjs/common';

export class UUIDValidator {
  private static readonly logger = new Logger('UUIDValidator');

  private static readonly UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private static readonly UUID_NO_DASH_PATTERN = /^[0-9a-f]{32}$/i;

  public static isValid(uuid: string, fieldName?: string): boolean {
    if (!uuid || typeof uuid !== 'string') {
      if (fieldName) {
        this.logger.warn(`Field '${fieldName}' is empty or not a string`);
      }
      return false;
    }

    const trimmed = uuid.trim().toLowerCase();

    if (this.UUID_V4_PATTERN.test(trimmed)) {
      return true;
    }

    if (this.UUID_NO_DASH_PATTERN.test(trimmed)) {
      return true;
    }

    if (fieldName) {
      this.logger.warn(`Field '${fieldName}' failed UUID v4 validation: ${uuid}`);
    }

    return false;
  }

  public static validateOrThrow(uuid: string, fieldName: string = 'id'): void {
    if (!this.isValid(uuid, fieldName)) {
      const message = `Field '${fieldName}' must be a valid UUID v4. Received: ${uuid}`;
      this.logger.warn(message);
      throw new Error(message);
    }
  }

  public static normalize(uuid: string): string | null {
    if (!uuid || typeof uuid !== 'string') {
      return null;
    }

    const trimmed = uuid.trim().toLowerCase();

    if (this.UUID_V4_PATTERN.test(trimmed)) {
      return trimmed;
    }

    if (this.UUID_NO_DASH_PATTERN.test(trimmed)) {
      const parts = trimmed.match(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/);
      if (parts) {
        return `${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}-${parts[5]}`;
      }
    }

    return null;
  }

  public static extractAndValidate(value: any, fieldName: string = 'id'): string | null {
    if (!value) {
      this.logger.warn(`Field '${fieldName}' is empty`);
      return null;
    }

    if (typeof value === 'object' && value.id) {
      return this.normalize(value.id);
    }

    if (typeof value === 'string') {
      return this.normalize(value);
    }

    this.logger.warn(`Field '${fieldName}' could not be extracted: ${JSON.stringify(value)}`);
    return null;
  }

  public static validateMultiple(uuids: string[], fieldName: string = 'ids'): boolean {
    if (!Array.isArray(uuids)) {
      this.logger.warn(`Field '${fieldName}' is not an array`);
      return false;
    }

    for (const uuid of uuids) {
      if (!this.isValid(uuid)) {
        this.logger.warn(`Invalid UUID in array '${fieldName}': ${uuid}`);
        return false;
      }
    }

    return true;
  }

  public static validateMultipleOrThrow(uuids: string[], fieldName: string = 'ids'): void {
    if (!this.validateMultiple(uuids, fieldName)) {
      const message = `One or more values in field '${fieldName}' are not valid UUIDs`;
      throw new Error(message);
    }
  }
}
