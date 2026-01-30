import { faker } from '@faker-js/faker';
import { generate as generateCpf } from 'gerador-validador-cpf';

import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  DeliveryPerson,
  type DeliveryPersonProps,
} from '@/domain/delivery/enterprise/entities/delivery-person';
import { EmailVerification } from '@/domain/delivery/enterprise/entities/email-verification';
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

  const emailVerificationResult = EmailVerification.create({
    validatedAt: new Date(),
  });

  if (emailVerificationResult.isLeft()) {
    throw new Error(
      `Failed to create email verification for delivery person factory: ${emailVerificationResult.value.message}`
    );
  }

  const deliveryPerson = DeliveryPerson.create(
    {
      name: faker.person.fullName(),
      cpf: cpfResult.value,
      email: faker.internet.email(),
      password: faker.internet.password(),
      emailVerification: emailVerificationResult.value,
      ...override,
    },
    id
  );

  return deliveryPerson;
}
