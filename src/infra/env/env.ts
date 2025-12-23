import { z } from 'zod';

const isBase64 = (str: string) => {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
};

export const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
  PORT: z.coerce.number().default(3000),
  JWT_PRIVATE_KEY: z.string().refine(isBase64, {
    message: 'JWT_PRIVATE_KEY must be a valid base64 string',
  }),
  JWT_PUBLIC_KEY: z.string().refine(isBase64, {
    message: 'JWT_PUBLIC_KEY must be a valid base64 string',
  }),
});

export type Env = z.infer<typeof envSchema>;
