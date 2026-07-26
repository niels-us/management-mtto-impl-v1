import { Pool, PoolClient } from 'pg';
import { Logger } from '@nestjs/common';
import { ErrorConstants } from '../../constants/ErrorConstants';
import { HttpConstants } from '../../constants/HttpConstants';
import CustomException from '../../application/exception/CustomException';

const logger = new Logger('PostgreSQLConnection');

export class PostgreSQLConnection {
  private static pool: Pool | null = null;

  static getInstance(): Pool {
    try {
      if (!PostgreSQLConnection.pool) {
        logger.debug('Initializing PostgreSQL');
        const credentialsString = process.env.POSTGRESQL_CREDENTIALS;
        logger.debug('PostgreSQL_Credentials:', credentialsString);

        if (!credentialsString) {
          throw new Error('POSTGRESQL_CREDENTIALS environment variable is not set.');
        }

        const credentials = JSON.parse(credentialsString);

        PostgreSQLConnection.pool = new Pool({
          host: credentials.host,
          port: credentials.port || 5432,
          database: credentials.database,
          user: credentials.user,
          password: credentials.password,
          max: credentials.max || 10,
          idleTimeoutMillis: credentials.idleTimeoutMillis || 30000,
          connectionTimeoutMillis: credentials.connectionTimeoutMillis || 2000,
          ssl: credentials.ssl ?? false,
        });

        PostgreSQLConnection.pool.on('error', (err) => {
          logger.error('Pool error', err instanceof Error ? err.stack : String(err));
          PostgreSQLConnection.pool = null;
        });
      }

      return PostgreSQLConnection.pool;
    } catch (error) {
      throw new CustomException({
        code: ErrorConstants.ERROR_BDWEB_ONPREMISE.CODE,
        message: 'Error connecting to PostgreSQL database',
        httpStatus: HttpConstants.INTERNAL_SERVER_ERROR_STATUS,
        details: error.message,
        exception: error,
      });
    }
  }

  static async getConnection(): Promise<PoolClient> {
    try {
      const pool = PostgreSQLConnection.getInstance();
      return await pool.connect();
    } catch (error) {
      throw new CustomException({
        code: ErrorConstants.ERROR_BDWEB_ONPREMISE.CODE,
        message: 'Error getting database connection',
        httpStatus: HttpConstants.INTERNAL_SERVER_ERROR_STATUS,
        details: error.message,
        exception: error,
      });
    }
  }

  static async closeConnection(client: PoolClient): Promise<void> {
    try {
      if (client) {
        await client.release();
      }
    } catch (error) {
      logger.error('Error closing connection', error instanceof Error ? error.stack : String(error));
    }
  }

  static async closePool(): Promise<void> {
    try {
      if (PostgreSQLConnection.pool) {
        await PostgreSQLConnection.pool.end();
        PostgreSQLConnection.pool = null;
      }
    } catch (error) {
      logger.error('Error closing pool', error instanceof Error ? error.stack : String(error));
    }
  }
}
