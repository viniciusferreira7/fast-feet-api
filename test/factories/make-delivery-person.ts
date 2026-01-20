import { faker } from '@faker-js/faker';
import { generate as generateCpf } from 'gerador-validador-cpf';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  DeliveryPerson,
  type DeliveryPersonProps,
} from '@/domain/delivery/enterprise/entities/delivery-person';
import { Cpf } from '@/domain/delivery/enterprise/entities/value-object/cpf';

export function makeDeliveryPerson(
  override: Partial<DeliveryPersonProps> = {},
  id?: UniqueEntityId
) {
  const cpfResult = Cpf.create(generateCpf());

  if (cpfResult.isLeft()) {
    throw new Error(
      `Failed to generate valid CPF for delivery person factory: ${cpfResult.value.message}`
    );
  }

  const deliveryPerson = DeliveryPerson.create(
    {
      name: faker.person.fullName(),
      cpf: cpfResult.value,
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...override,
    },
    id
  );

  return deliveryPerson;
}
