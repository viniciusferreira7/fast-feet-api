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
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'test') {
      const testOnlyFields = ['JSON_PLACEHOLDER_URL', 'HTTPBIN_URL'] as const;

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
  });

export type Env = z.infer<typeof envSchema>;
