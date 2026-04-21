import { SetMetadata } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '../../database/drizzle/schema';

type Role = InferSelectModel<typeof users>['role'];

export const Role = (...roles: Role[]) => SetMetadata('roles', roles);
