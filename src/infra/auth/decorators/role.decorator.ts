import { SetMetadata } from '@nestjs/common';

type Role = 'Admin' | 'Delivery' | 'Recipient';

export const Role = (...roles: Role[]) => SetMetadata('roles', roles);
