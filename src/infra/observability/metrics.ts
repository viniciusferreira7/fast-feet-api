import * as dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true });

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

// Reset admin person password
const resetAdminPersonPasswordErrorCounter = customMetrics.createCounter(
  'reset_admin_person_password_error'
);

const resetAdminPersonPasswordSuccessCounter = customMetrics.createCounter(
  'reset_admin_person_password_success'
);

//Update admin person
const updateAdminPersonErrorCounter = customMetrics.createCounter(
  'update_admin_person_error'
);
const updateAdminPersonSuccessCounter = customMetrics.createCounter(
  'update_admin_person_success'
);

//Get by id admin person
const getByIdAdminPersonErrorCounter = customMetrics.createCounter(
  'get_by_id_admin_person_error'
);
const getByIdAdminPersonSuccessCounter = customMetrics.createCounter(
  'get_by_id_admin_person_success'
);

// register delivery person
const registerDeliveryPersonErrorCounter = customMetrics.createCounter(
  'register_delivery_person_error'
);
const registerDeliveryPersonSuccessCounter = customMetrics.createCounter(
  'register_delivery_person_success'
);

// authenticate delivery person
const authenticateDeliveryPersonErrorCounter = customMetrics.createCounter(
  'authenticate_delivery_person_error'
);
const authenticateDeliveryPersonSuccessCounter = customMetrics.createCounter(
  'authenticate_delivery_person_success'
);

// send delivery person code
const sendDeliveryPersonCodeErrorCounter = customMetrics.createCounter(
  'send_delivery_person_code_error'
);
const sendDeliveryPersonCodeSuccessCounter = customMetrics.createCounter(
  'send_delivery_person_code_success'
);

// validate delivery person code
const validateDeliveryPersonCodeErrorCounter = customMetrics.createCounter(
  'validate_delivery_person_code_error'
);
const validateDeliveryPersonCodeSuccessCounter = customMetrics.createCounter(
  'validate_delivery_person_code_success'
);

// reset delivery person password
const resetDeliveryPersonPasswordErrorCounter = customMetrics.createCounter(
  'reset_delivery_person_password_error'
);
const resetDeliveryPersonPasswordSuccessCounter = customMetrics.createCounter(
  'reset_delivery_person_password_success'
);

// update delivery person
const updateDeliveryPersonErrorCounter = customMetrics.createCounter(
  'update_delivery_person_error'
);
const updateDeliveryPersonSuccessCounter = customMetrics.createCounter(
  'update_delivery_person_success'
);

// get by id delivery person
const getByIdDeliveryPersonErrorCounter = customMetrics.createCounter(
  'get_by_id_delivery_person_error'
);
const getByIdDeliveryPersonSuccessCounter = customMetrics.createCounter(
  'get_by_id_delivery_person_success'
);

// delete delivery person
const deleteDeliveryPersonErrorCounter = customMetrics.createCounter(
  'delete_delivery_person_error'
);
const deleteDeliveryPersonSuccessCounter = customMetrics.createCounter(
  'delete_delivery_person_success'
);

// fetch many delivery person
const fetchManyDeliveryPersonErrorCounter = customMetrics.createCounter(
  'fetch_many_delivery_person_error'
);
const fetchManyDeliveryPersonSuccessCounter = customMetrics.createCounter(
  'fetch_many_delivery_person_success'
);

// register package
const registerPackageErrorCounter = customMetrics.createCounter(
  'register_package_error'
);
const registerPackageSuccessCounter = customMetrics.createCounter(
  'register_package_success'
);

// cancel package
const cancelPackageErrorCounter = customMetrics.createCounter(
  'cancel_package_error'
);
const cancelPackageSuccessCounter = customMetrics.createCounter(
  'cancel_package_success'
);

// get package by code
const getPackageByCodeErrorCounter = customMetrics.createCounter(
  'get_package_by_code_error'
);
const getPackageByCodeSuccessCounter = customMetrics.createCounter(
  'get_package_by_code_success'
);

// get package by id
const getPackageByIdErrorCounter = customMetrics.createCounter(
  'get_package_by_id_error'
);
const getPackageByIdSuccessCounter = customMetrics.createCounter(
  'get_package_by_id_success'
);

// fetch packages near by delivery person
const fetchPackagesNearByDeliveryPersonErrorCounter =
  customMetrics.createCounter('fetch_packages_near_by_delivery_person_error');
const fetchPackagesNearByDeliveryPersonSuccessCounter =
  customMetrics.createCounter('fetch_packages_near_by_delivery_person_success');

// register recipient person
const registerRecipientPersonErrorCounter = customMetrics.createCounter(
  'register_recipient_person_error'
);
const registerRecipientPersonSuccessCounter = customMetrics.createCounter(
  'register_recipient_person_success'
);

// authenticate recipient person
const authenticateRecipientPersonErrorCounter = customMetrics.createCounter(
  'authenticate_recipient_person_error'
);
const authenticateRecipientPersonSuccessCounter = customMetrics.createCounter(
  'authenticate_recipient_person_success'
);

// send recipient person code
const sendRecipientPersonCodeErrorCounter = customMetrics.createCounter(
  'send_recipient_person_code_error'
);
const sendRecipientPersonCodeSuccessCounter = customMetrics.createCounter(
  'send_recipient_person_code_success'
);

// validate recipient person code
const validateRecipientPersonCodeErrorCounter = customMetrics.createCounter(
  'validate_recipient_person_code_error'
);
const validateRecipientPersonCodeSuccessCounter = customMetrics.createCounter(
  'validate_recipient_person_code_success'
);

// reset recipient person password
const resetRecipientPersonPasswordErrorCounter = customMetrics.createCounter(
  'reset_recipient_person_password_error'
);
const resetRecipientPersonPasswordSuccessCounter = customMetrics.createCounter(
  'reset_recipient_person_password_success'
);

// update recipient person
const updateRecipientPersonErrorCounter = customMetrics.createCounter(
  'update_recipient_person_error'
);
const updateRecipientPersonSuccessCounter = customMetrics.createCounter(
  'update_recipient_person_success'
);

// get by id recipient person
const getByIdRecipientPersonErrorCounter = customMetrics.createCounter(
  'get_by_id_recipient_person_error'
);
const getByIdRecipientPersonSuccessCounter = customMetrics.createCounter(
  'get_by_id_recipient_person_success'
);

// fetch many notifications
const fetchManyNotificationsErrorCounter = customMetrics.createCounter(
  'fetch_many_notifications_error'
);
const fetchManyNotificationsSuccessCounter = customMetrics.createCounter(
  'fetch_many_notifications_success'
);

// mark as read notification
const markAsReadNotificationErrorCounter = customMetrics.createCounter(
  'mark_as_read_notification_error'
);
const markAsReadNotificationSuccessCounter = customMetrics.createCounter(
  'mark_as_read_notification_success'
);

// mark many notifications as read
const markManyNotificationsAsReadErrorCounter = customMetrics.createCounter(
  'mark_many_notifications_as_read_error'
);
const markManyNotificationsAsReadSuccessCounter = customMetrics.createCounter(
  'mark_many_notifications_as_read_success'
);

export {
  assignPackageToDeliveryPersonErrorCounter,
  assignPackageToDeliveryPersonSuccessCounter,
  authenticateAdminPersonErrorCounter,
  authenticateAdminPersonSuccessCounter,
  authenticateDeliveryPersonErrorCounter,
  authenticateDeliveryPersonSuccessCounter,
  authenticateRecipientPersonErrorCounter,
  authenticateRecipientPersonSuccessCounter,
  customMetrics,
  deleteDeliveryPersonErrorCounter,
  deleteDeliveryPersonSuccessCounter,
  fetchManyDeliveryPersonErrorCounter,
  fetchManyDeliveryPersonSuccessCounter,
  fetchManyNotificationsErrorCounter,
  fetchManyNotificationsSuccessCounter,
  fetchPackagesNearByDeliveryPersonErrorCounter,
  fetchPackagesNearByDeliveryPersonSuccessCounter,
  getByIdAdminPersonErrorCounter,
  getByIdAdminPersonSuccessCounter,
  getByIdDeliveryPersonErrorCounter,
  getByIdDeliveryPersonSuccessCounter,
  getByIdRecipientPersonErrorCounter,
  getByIdRecipientPersonSuccessCounter,
  cancelPackageErrorCounter,
  cancelPackageSuccessCounter,
  getPackageByCodeErrorCounter,
  getPackageByCodeSuccessCounter,
  getPackageByIdErrorCounter,
  getPackageByIdSuccessCounter,
  jwtRejectedCounter,
  markAsReadNotificationErrorCounter,
  markAsReadNotificationSuccessCounter,
  markManyNotificationsAsReadErrorCounter,
  markManyNotificationsAsReadSuccessCounter,
  registerAdminPersonErrorCounter,
  registerAdminPersonSuccessCounter,
  registerDeliveryPersonErrorCounter,
  registerDeliveryPersonSuccessCounter,
  registerPackageErrorCounter,
  registerPackageSuccessCounter,
  registerRecipientPersonErrorCounter,
  registerRecipientPersonSuccessCounter,
  resetAdminPersonPasswordErrorCounter,
  resetAdminPersonPasswordSuccessCounter,
  resetDeliveryPersonPasswordErrorCounter,
  resetDeliveryPersonPasswordSuccessCounter,
  resetRecipientPersonPasswordErrorCounter,
  resetRecipientPersonPasswordSuccessCounter,
  roleRejectedCounter,
  sendAdminPersonCodeErrorCounter,
  sendAdminPersonCodeSuccessCounter,
  sendDeliveryPersonCodeErrorCounter,
  sendDeliveryPersonCodeSuccessCounter,
  sendRecipientPersonCodeErrorCounter,
  sendRecipientPersonCodeSuccessCounter,
  updateAdminPersonErrorCounter,
  updateAdminPersonSuccessCounter,
  updateDeliveryPersonErrorCounter,
  updateDeliveryPersonSuccessCounter,
  updateRecipientPersonErrorCounter,
  updateRecipientPersonSuccessCounter,
  validateAdminPersonCodeErrorCounter,
  validateAdminPersonCodeSuccessCounter,
  validateDeliveryPersonCodeErrorCounter,
  validateDeliveryPersonCodeSuccessCounter,
  validateRecipientPersonCodeErrorCounter,
  validateRecipientPersonCodeSuccessCounter,
};
