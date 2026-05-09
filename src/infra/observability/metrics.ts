import * as dotenv from 'dotenv';

dotenv.config({ path: '.env', override: true });

import { metrics as metricsApi } from '@opentelemetry/api';
import { envSchema } from '../env/env';

const env = envSchema.parse(process.env);

const customMetrics = metricsApi.getMeter(env.SERVICE_NAME);

// Guards
const jwtRejectedCounter = customMetrics.createCounter('auth_jwt_rejected');
const roleRejectedCounter = customMetrics.createCounter('auth_role_rejected');

// register admin person
const registerAdminPersonErrorCounter = customMetrics.createCounter(
  'register_admin_person_error'
);
const registerAdminPersonSuccessCounter = customMetrics.createCounter(
  'register_admin_person_success'
);

// authenticate admin person
const authenticateAdminPersonErrorCounter = customMetrics.createCounter(
  'authenticate_admin_person_error'
);
const authenticateAdminPersonSuccessCounter = customMetrics.createCounter(
  'authenticate_admin_person_success'
);

// assign package to delivery person
const assignPackageToDeliveryPersonErrorCounter = customMetrics.createCounter(
  'assign_package_to_delivery_person_error'
);
const assignPackageToDeliveryPersonSuccessCounter = customMetrics.createCounter(
  'assign_package_to_delivery_person_success'
);

// send admin person code
const sendAdminPersonCodeErrorCounter = customMetrics.createCounter(
  'send_admin_person_code_error'
);
const sendAdminPersonCodeSuccessCounter = customMetrics.createCounter(
  'send_admin_person_code_success'
);

// validate admin person code
const validateAdminPersonCodeErrorCounter = customMetrics.createCounter(
  'validate_admin_person_code_error'
);
const validateAdminPersonCodeSuccessCounter = customMetrics.createCounter(
  'validate_admin_person_code_success'
);

export {
  customMetrics,
  jwtRejectedCounter,
  roleRejectedCounter,
  registerAdminPersonErrorCounter,
  registerAdminPersonSuccessCounter,
  authenticateAdminPersonErrorCounter,
  authenticateAdminPersonSuccessCounter,
  assignPackageToDeliveryPersonErrorCounter,
  assignPackageToDeliveryPersonSuccessCounter,
  sendAdminPersonCodeErrorCounter,
  sendAdminPersonCodeSuccessCounter,
  validateAdminPersonCodeErrorCounter,
  validateAdminPersonCodeSuccessCounter,
};
