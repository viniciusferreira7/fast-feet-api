import { faker } from '@faker-js/faker';
import { generate as generateCpf } from 'gerador-validador-cpf';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  RecipientPerson,
  type RecipientPersonProps,
} from '@/domain/delivery/enterprise/entities/recipient-person';
import { Cpf } from '@/domain/delivery/enterprise/entities/value-object/cpf';

export function makeRecipientPerson(
  override: Partial<RecipientPersonProps> = {},
  id?: UniqueEntityId
) {
  const cpfResult = Cpf.create(generateCpf());

  if (cpfResult.isLeft()) {
    throw new Error(
      'Failed to generate valid CPF for recipient person factory'
    );
  }

  const recipientPerson = RecipientPerson.create(
    {
      name: faker.person.fullName(),
      cpf: cpfResult.value,
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...override,
    },
    id
  );

  return recipientPerson;
}
