import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/** Rutas muy frecuentes: se registran en debug para no inundar logs en producción. */
const DEBUG_ONLY_PREFIXES = ['/api/health/live', '/api/health/ready'];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<{ method?: string; originalUrl?: string; url?: string }>();
    const method = req.method ?? '?';
    const path = req.originalUrl ?? req.url ?? '';
    const started = Date.now();
    const quiet = DEBUG_ONLY_PREFIXES.some((p) => path === p || path.startsWith(`${p}?`));

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - started;
          const line = `${method} ${path} ${ms}ms`;
          if (quiet) this.logger.debug(line);
          else this.logger.log(line);
        },
        error: () => {
          const ms = Date.now() - started;
          const line = `${method} ${path} ${ms}ms (error)`;
          if (quiet) this.logger.debug(line);
          else this.logger.warn(line);
        },
      }),
    );
  }
}
