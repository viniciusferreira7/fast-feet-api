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
): Promise<{ response: Response; packageId: string; packageCode: string }> {
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
  const packageCode = response.body.package?.code as string;

  return { response, packageId, packageCode };
}

export async function trackPackageByCode(
  app: INestApplication,
  code: string,
  apiToken: string
): Promise<Response> {
  return request(app.getHttpServer())
    .get(`/packages/track/${code}`)
    .set('Authorization', `Bearer ${apiToken}`);
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

export async function getPackageById(
  app: INestApplication,
  adminToken: string,
  packageId: string
): Promise<Response> {
  return request(app.getHttpServer())
    .get(`/packages/${packageId}`)
    .set('Authorization', `Bearer ${adminToken}`);
}

export async function cancelPackage(
  app: INestApplication,
  adminToken: string,
  packageId: string,
  body: { description?: string } = {}
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/packages/${packageId}/cancel`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send(body);
}

export async function pickUpPackage(
  app: INestApplication,
  deliveryToken: string,
  packageId: string,
  body: { description?: string } = {}
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/packages/${packageId}/pick-up`)
    .set('Authorization', `Bearer ${deliveryToken}`)
    .send(body);
}

export async function dropOffPackage(
  app: INestApplication,
  deliveryToken: string,
  packageId: string,
  body: { description?: string } = {}
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/packages/${packageId}/drop-off`)
    .set('Authorization', `Bearer ${deliveryToken}`)
    .send(body);
}

export async function markPackageInTransit(
  app: INestApplication,
  adminToken: string,
  packageId: string,
  deliveryPersonId: string,
  body: { description?: string } = {}
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/packages/${packageId}/in-transit`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ deliveryPersonId, ...body });
}

export async function markPackageOutForDelivery(
  app: INestApplication,
  adminToken: string,
  packageId: string,
  deliveryPersonId: string,
  body: { description?: string } = {}
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/packages/${packageId}/out-for-delivery`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ deliveryPersonId, ...body });
}

export async function markPackageFailedDelivery(
  app: INestApplication,
  deliveryToken: string,
  packageId: string,
  attachmentId: string,
  body: { description?: string } = {}
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/packages/${packageId}/failed-delivery`)
    .set('Authorization', `Bearer ${deliveryToken}`)
    .send({ attachmentId, ...body });
}

export async function returnPackage(
  app: INestApplication,
  deliveryToken: string,
  packageId: string,
  body: { description?: string } = {}
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/packages/${packageId}/return`)
    .set('Authorization', `Bearer ${deliveryToken}`)
    .send(body);
}

export async function deliverPackage(
  app: INestApplication,
  deliveryToken: string,
  packageId: string,
  attachmentId: string,
  body: { description?: string } = {}
): Promise<Response> {
  return request(app.getHttpServer())
    .patch(`/packages/${packageId}/deliver`)
    .set('Authorization', `Bearer ${deliveryToken}`)
    .send({ attachmentId, ...body });
}

export async function fetchManyPackages(
  app: INestApplication,
  adminToken: string,
  query: Record<string, string | number> = {}
): Promise<Response> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) params.set(k, String(v));

  return request(app.getHttpServer())
    .get(`/packages?${params.toString()}`)
    .set('Authorization', `Bearer ${adminToken}`);
}

export async function updatePackage(
  app: INestApplication,
  adminToken: string,
  packageId: string,
  body: { name: string; recipientAddress: string; description?: string }
): Promise<Response> {
  return request(app.getHttpServer())
    .put(`/packages/${packageId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send(body);
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
