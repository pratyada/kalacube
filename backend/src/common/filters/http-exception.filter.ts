import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Unhandled (non-HTTP) errors were previously silent — log them with stack.
    if (status >= 500) {
      this.logger.error(
        (exception as Error)?.message || 'Unhandled exception',
        (exception as Error)?.stack,
      );
    }

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.message || exception.message
        : 'Internal server error';

    response.status(status).json({
      error: true,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
    });
  }
}
