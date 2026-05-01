import { SetMetadata } from '@nestjs/common';

type Role = 'Admin' | 'Delivery' | 'Recipient';

export const Role = (role: Role) => SetMetadata('roles', [role]);
