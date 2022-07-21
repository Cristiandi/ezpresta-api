import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void): void {
    const nanoIdReq = nanoid();

    const label = `request-response time ${nanoIdReq}`;

    // eslint-disable-next-line no-console
    console.time(label);

    // Logger.log(`requested route: ${req.originalUrl} | method: ${req.method}`, LoggingMiddleware.name);

    res.on('finish', () => {
      Logger.log(
        `request: ${nanoIdReq} route: ${req.originalUrl} | method: ${req.method} | status: ${res.statusCode}`,
        LoggingMiddleware.name,
      );
      // eslint-disable-next-line no-console
      console.timeEnd(label);
    });

    next();
  }
}
