import winston from 'winston';

const { splat, combine, timestamp, printf } = winston.format;

const kinveyFormat = printf(({ timestamp, level, message, meta }) => {
  return `${timestamp} - ${level}: ${message} ${meta ? JSON.stringify(meta) : ''}`;
});

const logger = winston.createLogger({
  format: combine(timestamp(), splat(), kinveyFormat),
  transports: [new winston.transports.Console()],
});

export { logger };
