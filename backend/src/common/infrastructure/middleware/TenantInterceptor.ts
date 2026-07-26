import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger('TenantAccess');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as any;
    const resourceId = (request as any).resourceId;
    const tenantId = (request as any).tenantId;

    const accessLog = {
      timestamp: new Date().toISOString(),
      userId: user?.sub || 'anonymous',
      username: user?.username || 'anonymous',
      tenantId: tenantId || 'unknown',
      resourceId: resourceId || 'unknown',
      action: context.getHandler().name,
      method: request.method,
      path: request.path,
      ip: this.extractIp(request),
    };

    return next.handle().pipe(
      tap((response) => {
        this.logger.log(
          `✓ Resource Access: ${accessLog.username} accessed ${resourceId} in tenant ${tenantId}`,
          JSON.stringify(accessLog)
        );
      }),
      catchError((error) => {
        this.logger.warn(
          `✗ Resource Access Failed: ${accessLog.username} attempted to access ${resourceId}`,
          JSON.stringify({ ...accessLog, error: error.message })
        );
        throw error;
      })
    );
  }

  private extractIp(request: any): string {
    return (
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0].trim() ||
      request.connection?.remoteAddress ||
      'unknown'
    );
  }
}
