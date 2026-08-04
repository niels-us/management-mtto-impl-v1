import { PoolClient } from 'pg';
import { Logger } from '@nestjs/common';
import { PostgreSQLConnection } from './PostgreSQLConnection.js';
import CustomException from '../../application/exception/CustomException.js';
import { ErrorConstants } from '../../constants/ErrorConstants.js';
import { HttpConstants } from '../../constants/HttpConstants.js';

const logger = new Logger('ExecutePostgreSQL');

export class ExecutePostgreSQL {
  public static async query(
    data: {
      statement: string;
      params?: any[];
      options?: any;
    },
    transaccional: boolean = false
  ): Promise<any> {
    let connection: PoolClient | null = null;

    try {
      const pool = PostgreSQLConnection.getInstance();
      const result = await pool.query(data.statement, data.params || []);

      return result.rows;
    } catch (error) {
      throw new CustomException({
        code: ErrorConstants.ERROR_BDWEB_ONPREMISE.CODE,
        message: ErrorConstants.ERROR_BDWEB_ONPREMISE.MESSAGE,
        httpStatus: HttpConstants.INTERNAL_SERVER_ERROR_STATUS,
        details: error.message,
        exception: error,
      });
    }
  }

  public static async storedProcedure(
    data: {
      functionName: string;
      params?: any[];
      options?: any;
    },
    transaccional: boolean = false
  ): Promise<any> {
    try {
      const pool = PostgreSQLConnection.getInstance();

      const placeholders = data.params?.map((_, i) => `$${i + 1}`).join(',') || '';
      const statement = `SELECT * FROM ${data.functionName}(${placeholders})`;

      const result = await pool.query(statement, data.params || []);

      return result.rows;
    } catch (error) {
      throw new CustomException({
        code: ErrorConstants.ERROR_BDWEB_ONPREMISE.CODE,
        message: ErrorConstants.ERROR_BDWEB_ONPREMISE.MESSAGE,
        httpStatus: HttpConstants.INTERNAL_SERVER_ERROR_STATUS,
        details: error.message,
        exception: error,
      });
    }
  }

  public static async insert(
    data: {
      statement: string;
      params?: any[];
      options?: any;
    },
    transaccional: boolean = false
  ): Promise<any> {
    let connection: PoolClient | null = null;

    try {
      connection = await PostgreSQLConnection.getConnection();

      if (transaccional) {
        await connection.query('BEGIN');
      }

      const result = await connection.query(data.statement, data.params || []);

      if (transaccional) {
        await connection.query('COMMIT');
      }

      return result.rows;
    } catch (error) {
      if (connection && transaccional) {
        try {
          await connection.query('ROLLBACK');
        } catch (rollbackError) {
          logger.error(
            'Error during rollback',
            rollbackError instanceof Error ? rollbackError.stack : String(rollbackError)
          );
        }
      }

      throw new CustomException({
        code: ErrorConstants.ERROR_BDWEB_ONPREMISE.CODE,
        message: ErrorConstants.ERROR_BDWEB_ONPREMISE.MESSAGE,
        httpStatus: HttpConstants.INTERNAL_SERVER_ERROR_STATUS,
        details: error.message,
        exception: error,
      });
    } finally {
      if (connection) {
        await PostgreSQLConnection.closeConnection(connection);
      }
    }
  }

  public static async update(
    data: {
      statement: string;
      params?: any[];
      options?: any;
    },
    transaccional: boolean = false
  ): Promise<any> {
    let connection: PoolClient | null = null;

    try {
      connection = await PostgreSQLConnection.getConnection();

      if (transaccional) {
        await connection.query('BEGIN');
      }

      const result = await connection.query(data.statement, data.params || []);

      if (transaccional) {
        await connection.query('COMMIT');
      }

      return {
        rowsAffected: result.rowCount,
        rows: result.rows,
      };
    } catch (error) {
      if (connection && transaccional) {
        try {
          await connection.query('ROLLBACK');
        } catch (rollbackError) {
          logger.error(
            'Error during rollback',
            rollbackError instanceof Error ? rollbackError.stack : String(rollbackError)
          );
        }
      }

      throw new CustomException({
        code: ErrorConstants.ERROR_BDWEB_ONPREMISE.CODE,
        message: ErrorConstants.ERROR_BDWEB_ONPREMISE.MESSAGE,
        httpStatus: HttpConstants.INTERNAL_SERVER_ERROR_STATUS,
        details: error.message,
        exception: error,
      });
    } finally {
      if (connection) {
        await PostgreSQLConnection.closeConnection(connection);
      }
    }
  }

  public static async delete(
    data: {
      statement: string;
      params?: any[];
      options?: any;
    },
    transaccional: boolean = false
  ): Promise<any> {
    let connection: PoolClient | null = null;

    try {
      connection = await PostgreSQLConnection.getConnection();

      if (transaccional) {
        await connection.query('BEGIN');
      }

      const result = await connection.query(data.statement, data.params || []);

      if (transaccional) {
        await connection.query('COMMIT');
      }

      return {
        rowsAffected: result.rowCount,
      };
    } catch (error) {
      if (connection && transaccional) {
        try {
          await connection.query('ROLLBACK');
        } catch (rollbackError) {
          logger.error(
            'Error during rollback',
            rollbackError instanceof Error ? rollbackError.stack : String(rollbackError)
          );
        }
      }

      throw new CustomException({
        code: ErrorConstants.ERROR_BDWEB_ONPREMISE.CODE,
        message: ErrorConstants.ERROR_BDWEB_ONPREMISE.MESSAGE,
        httpStatus: HttpConstants.INTERNAL_SERVER_ERROR_STATUS,
        details: error.message,
        exception: error,
      });
    } finally {
      if (connection) {
        await PostgreSQLConnection.closeConnection(connection);
      }
    }
  }
}
