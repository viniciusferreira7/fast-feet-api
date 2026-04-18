import pino from 'pino';

const _log = pino({
  level: 'debug',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        level: 'error',
        options: {
          name: 'dev-terminal',
          colorize: true,
          levelFirst: true,
          include: 'level',
        },
      },
    ],
  },
});
