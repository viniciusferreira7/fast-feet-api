import pino, { type TransportTargetOptions } from 'pino';
import { envSchema } from './env/env';

const env = envSchema.parse(process.env);

const isProd = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

const defaultLevel = isProd ? 'info' : 'debug';
const level = env.LOG_LEVEL ?? defaultLevel;

const prettyTarget: TransportTargetOptions = {
  target: 'pino-pretty',
  level: 'debug',
  options: {
    name: 'dev-terminal',
    colorize: true,
    levelFirst: true,
    include: 'level,time',
    translateTime: 'yyyy-mm-dd HH:MM:ss Z',
  },
};

const otlpTarget: TransportTargetOptions = {
  target: 'pino-opentelemetry-transport',
  level: 'info',
  options: {
    resourceAttributes: {
      'service.name': 'fast-feet-api',
      'service.version': '1.0.0',
    },
  },
};

const targets: TransportTargetOptions[] = isTest
  ? [prettyTarget]
  : isProd
    ? [otlpTarget]
    : [prettyTarget, otlpTarget];

const log = pino({ level, transport: { targets } });

export { log };
