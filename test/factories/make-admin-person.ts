import { faker } from '@faker-js/faker';
import { generate as generateCpf } from 'gerador-validador-cpf';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  AdminPerson,
  type AdminPersonProps,
} from '@/domain/delivery/enterprise/entities/admin-person';
import { Cpf } from '@/domain/delivery/enterprise/entities/value-object/cpf';

export function makeAdminPerson(
  override: Partial<AdminPersonProps> = {},
  id?: UniqueEntityId
) {
  const cpfResult = Cpf.create(generateCpf());

  if (cpfResult.isLeft()) {
    throw new Error('Failed to generate valid CPF for admin person factory');
  }

  const adminPerson = AdminPerson.create(
    {
      name: faker.person.fullName(),
      cpf: cpfResult.value,
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...override,
    },
    id
  );

  return adminPerson;
}
