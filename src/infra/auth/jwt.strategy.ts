import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { z } from 'zod';

import { EnvService } from '../env/env.service';
import { log } from '../logger';

const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
});

export type UserPayload = z.infer<typeof tokenPayloadSchema>;

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

  async validate(payload: UserPayload) {
    try {
      return tokenPayloadSchema.parse(payload);
    } catch (error) {
      log.warn({ err: error }, '[Auth] invalid JWT payload');
      throw error;
    }
  }
}
