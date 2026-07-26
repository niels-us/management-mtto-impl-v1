import { NestFactory } from '@nestjs/core';
import { INestApplicationContext, Logger } from '@nestjs/common';
import middy from '@middy/core';
import { AppModule } from './AppModule';
import HandleCore from './HandleCore';
import * as jwt from 'jsonwebtoken';
import CustomException from '../../../common/application/exception/CustomException';

let MaintenanceAppContext: INestApplicationContext;
const logger = new Logger('MaintenanceAPI');

const bootstrap = async (event: any) => {
  if (!MaintenanceAppContext) MaintenanceAppContext = await NestFactory.createApplicationContext(AppModule);

  const action = event.action;

  const headers = event.headers || {};
  const authHeader = headers['Authorization'] || headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').replace('bearer ', '').trim();
  if (token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET environment variable not configured');
      throw new CustomException({ code: 'CONFIG_001', message: 'Server configuration error', httpStatus: 500 });
    }
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        audience: process.env.JWT_AUDIENCE || 'maintenance-api',
      });
      event.user = decoded;
    } catch (e) {
      logger.warn(`JWT validation failed: ${e instanceof Error ? e.message : String(e)}`);
      const message = e instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token';
      throw new CustomException({ code: 'AUTH001', message, httpStatus: 401 });
    }
  }

  const controller = HandleCore(MaintenanceAppContext, action);
  const result = await controller[action](event);
  return result;
};

export const handler = middy(bootstrap);
