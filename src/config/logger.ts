import pino from 'pino';
import { ENV } from './env';

export const logger = pino({
  level: ENV.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    ENV.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
