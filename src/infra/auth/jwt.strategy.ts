import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { z } from 'zod';

import { EnvService } from '../env/env.service';
import { log } from '../logger';

const userPayload = z.object({
  type: z.literal('user'),
  sub: z.uuid(),
  role: z.enum(['admin', 'delivery', 'recipient']),
});

const apiPayload = z.object({
  type: z.literal('api-key'),
  service: z.literal('client'),
});

const payloadSchema = z.discriminatedUnion('type', [userPayload, apiPayload]);

export type UserPayload = z.infer<typeof userPayload>;
export type ApiPayload = z.infer<typeof apiPayload>;
export type TokenPayload = z.infer<typeof payloadSchema>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Cannot use this before calling super
  constructor(private readonly env: EnvService) {
    const publicKey = env.get('JWT_PUBLIC_KEY');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: TokenPayload) {
    try {
      return payloadSchema.parse(payload);
    } catch (error) {
      log.warn({ err: error }, '[Auth] invalid JWT payload');
      throw error;
    }
  }
}
