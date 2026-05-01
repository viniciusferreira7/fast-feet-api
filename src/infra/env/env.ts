import { z } from 'zod';

const isBase64 = (str: string) => {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
};

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
    PORT: z.coerce.number().default(3000),
    JWT_PRIVATE_KEY: z.string().refine(isBase64, {
      message: 'JWT_PRIVATE_KEY must be a valid base64 string',
    }),
    JWT_PUBLIC_KEY: z.string().refine(isBase64, {
      message: 'JWT_PUBLIC_KEY must be a valid base64 string',
    }),
    CORS_ORIGIN: z.url(),
    ARGON2_PEPPER: z.string(),
    RESEND_API_KEY: z.string(),
    EMAIL: z.string(),
    POSTAL_CODE_EXTERNAL_SERVICE_URL: z.url(),
    JSON_PLACEHOLDER_URL: z.url().optional(),
    HTTPBIN_URL: z.url().optional(),
    DATABASE_URL: z.string(),
    DATABASE_PORT: z.coerce.number().default(5432),
    DATABASE_USERNAME: z.string(),
    DATABASE_PASSWORD: z.string(),
    DATABASE_NAME: z.string(),
    CLIENT_API_KEY: z.string().optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_ACCOUNT_TOKEN: z.string(),
    AWS_BUCKET_NAME: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRETE_ACCESS_KEY_ID: z.string(),
    OTLP_TRACE_EXPORT_ENDPOINT: z.url().optional(),
    LOG_LEVEL: z.string().optional(),
    ADMIN_ROOT_CPF: z.string().regex(/^\d{11}$/, {
      message: 'ADMIN_ROOT_CPF must be exactly 11 numeric digits',
    }),
    ADMIN_ROOT_EMAIL: z.email(),
    ADMIN_ROOT_PASSWORD: z.string().min(8),
    PASSWORD_MIN_LENGTH: z.coerce.number().int().min(6).default(8),
    PASSWORD_MIN_SCORE: z.coerce.number().int().min(1).max(4).default(3),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'test') {
      const testOnlyFields = [
        'JSON_PLACEHOLDER_URL',
        'HTTPBIN_URL',
        'CLIENT_API_KEY',
      ] as const;

      for (const field of testOnlyFields) {
        if (!data[field]) {
          ctx.addIssue({
            code: 'custom',
            message: `${field} is required in test environment`,
            path: [field],
          });
        }
      }
    }

    if (data.NODE_ENV !== 'test') {
      if (!data.OTLP_TRACE_EXPORT_ENDPOINT) {
        ctx.addIssue({
          code: 'custom',
          message:
            'OTLP_TRACE_EXPORT_ENDPOINT is required in production or development environment',
          path: ['OTLP_TRACE_EXPORT_ENDPOINT'],
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;
