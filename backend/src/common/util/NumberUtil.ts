import { Logger } from '@nestjs/common';

const logger = new Logger('NumberUtil');

export class NumberUtil {
  static roundTwoDecimals(number): string {
    try {
      if (isNaN(number) || number === null || number === undefined) {
        return number;
      }

      const parsedNumber = parseFloat(number);

      if (isNaN(parsedNumber)) {
        return number;
      }

      return parsedNumber.toFixed(2);
    } catch (error) {
      logger.error('Error rounding number', error instanceof Error ? error.stack : String(error));
      return number;
    }
  }
}
