import { type INestApplication } from '@nestjs/common';
import request, { type Response } from 'supertest';

export interface RegisterPackageOptions {
  recipientId: string;
  name?: string;
  recipientAddress?: string;
  postalCode?: string;
  deliveryPersonId?: string | null;
}

export async function registerPackage(
  app: INestApplication,
  adminToken: string,
  options: RegisterPackageOptions
): Promise<{ response: Response; packageId: string }> {
  const {
    recipientId,
    name = 'Test Package',
    recipientAddress = 'Av. Paulista, 1000, São Paulo - SP',
    postalCode = '01310-100',
    deliveryPersonId = null,
  } = options;

  const response = await request(app.getHttpServer())
    .post('/packages')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      recipientId,
      name,
      recipientAddress,
      postalCode,
      deliveryPersonId,
    });

  const packageId = response.body.package?.id as string;

  return { response, packageId };
}

export async function assignPackageToDeliveryPerson(
  app: INestApplication,
  adminToken: string,
  packageId: string,
  deliveryPersonId: string,
  description = 'Assigned via test flow'
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/packages/${packageId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ deliveryPersonId, description });
}

export async function fetchPackagesNearBy(
  app: INestApplication,
  token: string,
  deliveryPersonId: string,
  postalCode: string,
  options: { page?: number; perPage?: number } = {}
): Promise<Response> {
  const query = new URLSearchParams({ postal_code: postalCode });

  if (options.page !== undefined) query.set('page', String(options.page));
  if (options.perPage !== undefined)
    query.set('per_page', String(options.perPage));

  return request(app.getHttpServer())
    .get(`/delivery-people/${deliveryPersonId}/packages?${query.toString()}`)
    .set('Authorization', `Bearer ${token}`);
}
