import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@nestjs/common';
import { ErrorConstants } from '../../constants/ErrorConstants.js';
import { HttpConstants } from '../../constants/HttpConstants.js';
import CustomException from '../../application/exception/CustomException.js';

const logger = new Logger('DynamoDBConnection');

const region = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
const endpoint = process.env.DYNAMODB_ENDPOINT || undefined;

logger.debug(`Initializing DynamoDB (region=${region}, endpoint=${endpoint || 'AWS'})`);

const client = new DynamoDBClient({ region, endpoint });
const documentClient = DynamoDBDocumentClient.from(client);

export class DynamoDBConnection {
  static getClient(): DynamoDBDocumentClient {
    return documentClient;
  }

  static getTableName(): string {
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    if (!tableName) {
      throw new CustomException({
        code: ErrorConstants.ERROR_BDWEB_ONPREMISE.CODE,
        message: 'DYNAMODB_TABLE_NAME environment variable is not set.',
        httpStatus: HttpConstants.INTERNAL_SERVER_ERROR_STATUS,
      });
    }
    return tableName;
  }
}
