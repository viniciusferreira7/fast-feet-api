import { forwardRef, Module } from '@nestjs/common';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { AssignPackageToADeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/assign-package-to-a-delivery-person';
import { AuthenticateAdminPersonUseCase } from '@/domain/delivery/application/use-cases/authenticate-admin-person';
import { AuthenticateDeliveryPerson } from '@/domain/delivery/application/use-cases/authenticate-delivery-person';
import { AuthenticateRecipientPerson } from '@/domain/delivery/application/use-cases/authenticate-recipient-person';
import { DeleteDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/delete-delivery-person';
import { FetchManyDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/fetch-many-delivery-person';
import { FetchPackagesNearByDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/fetch-packages-near-by-delivery-person';
import { GetByIdAdminPersonUseCase } from '@/domain/delivery/application/use-cases/get-by-id-admin-person';
import { GetByIdDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/get-by-id-delivery-person';
import { GetByIdRecipientPersonUseCase } from '@/domain/delivery/application/use-cases/get-by-id-recipient-person';
import { CancelPackageUseCase } from '@/domain/delivery/application/use-cases/cancel-package';
import { GetByPackageByCodeUseCase } from '@/domain/delivery/application/use-cases/get-package-by-code';
import { GetByPackageByIdUseCase } from '@/domain/delivery/application/use-cases/get-package-by-id';
import { RegisterAdminPersonUseCase } from '@/domain/delivery/application/use-cases/register-admin-person';
import { RegisterDeliveryPerson } from '@/domain/delivery/application/use-cases/register-delivery-person';
import { RegisterPackageUseCase } from '@/domain/delivery/application/use-cases/register-package';
import { RegisterRecipientPerson } from '@/domain/delivery/application/use-cases/register-recipient-person';
import { ResetAdminPersonPasswordUseCase } from '@/domain/delivery/application/use-cases/reset-admin-person-password';
import { ResetDeliveryPersonPassword } from '@/domain/delivery/application/use-cases/reset-delivery-person-password';
import { ResetRecipientPersonPassword } from '@/domain/delivery/application/use-cases/reset-recipient-person-password';
import { SendAdminPersonCodeUseCase } from '@/domain/delivery/application/use-cases/send-admin-person-code';
import { SendDeliveryPersonCodeUseCase } from '@/domain/delivery/application/use-cases/send-delivery-person-code';
import { SendRecipientPersonCodeUseCase } from '@/domain/delivery/application/use-cases/send-recipient-person-code';
import { UpdateAdminPersonUseCase } from '@/domain/delivery/application/use-cases/update-admin-person';
import { UpdateDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/update-delivery-person';
import { UpdateRecipientPersonUseCase } from '@/domain/delivery/application/use-cases/update-recipient-person';
import { ValidateAdminPersonCodeUseCase } from '@/domain/delivery/application/use-cases/validate-admin-person-code';
import { ValidDeliveryPersonUseCase } from '@/domain/delivery/application/use-cases/validate-delivery-person-code';
import { ValidateRecipientPersonCodeUseCase } from '@/domain/delivery/application/use-cases/validate-recipient-person-code';
import { FetchManyNotificationsUseCase } from '@/domain/notification/application/use-cases/fetch-many-notifications';
import { MarkAsReadNotificationUseCase } from '@/domain/notification/application/use-cases/mark-as-read-notification';
import { MarkManyNotificationsAsReaUseCase } from '@/domain/notification/application/use-cases/mark-many-notifications-as-read';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EmailModule } from '@/infra/email/email.module';
import { ValidationModule } from '../validation/validation.module';
import { AssignPackageToADeliveryPersonController } from './controllers/assign-package-to-a-delivery-person.controller';
import { AuthenticateAdminPersonController } from './controllers/authenticate-admin-person.controller';
import { AuthenticateDeliveryPersonController } from './controllers/authenticate-delivery-person.controller';
import { AuthenticateRecipientPersonController } from './controllers/authenticate-recipient-person.controller';
import { CancelPackageController } from './controllers/cancel-package.controller';
import { DeleteDeliveryPersonController } from './controllers/delete-delivery-person.controller';
import { FetchManyDeliveryPersonController } from './controllers/fetch-many-delivery-person.controller';
import { FetchManyNotificationsController } from './controllers/fetch-many-notifications.controller';
import { FetchPackagesNearByDeliveryPersonController } from './controllers/fetch-packages-near-by-delivery-person.controller';
import { GetByIdAdminPersonController } from './controllers/get-by-id-admin-person.controller';
import { GetByIdDeliveryPersonController } from './controllers/get-by-id-delivery-person.controller';
import { GetByIdRecipientPersonController } from './controllers/get-by-id-recipient-person.controller';
import { GetPackageByCodeController } from './controllers/get-package-by-code.controller';
import { GetPackageByIdController } from './controllers/get-package-by-id.controller';
import { MarkAsReadNotificationController } from './controllers/mark-as-read-notification.controller';
import { MarkManyNotificationsAsReadController } from './controllers/mark-many-notifications-as-read.controller';
import { RegisterAdminPersonController } from './controllers/register-admin-person.controller';
import { RegisterDeliveryPersonController } from './controllers/register-delivery-person.controller';
import { RegisterPackageController } from './controllers/register-package.controller';
import { RegisterRecipientPersonController } from './controllers/register-recipient-person.controller';
import { ResetAdminPersonPasswordController } from './controllers/reset-admin-person-password.controller';
import { ResetDeliveryPersonPasswordController } from './controllers/reset-delivery-person-password.controller';
import { ResetRecipientPersonPasswordController } from './controllers/reset-recipient-person-password.controller';
import { SendAdminPersonCodeController } from './controllers/send-admin-person-code.controller';
import { SendDeliveryPersonCodeController } from './controllers/send-delivery-person-code.controller';
import { SendRecipientPersonCodeController } from './controllers/send-recipient-person-code.controller';
import { UpdateAdminPersonController } from './controllers/update-admin-person.controller';
import { UpdateDeliveryPersonController } from './controllers/update-delivery-person.controller';
import { UpdateRecipientPersonController } from './controllers/update-recipient-person.controller';
import { ValidateAdminPersonCodeController } from './controllers/validate-admin-person-code.controller';
import { ValidateDeliveryPersonCodeController } from './controllers/validate-delivery-person-code.controller';
import { ValidateRecipientPersonCodeController } from './controllers/validate-recipient-person-code.controller';
import { FetchHttpClient } from './fetch-http-client';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    CryptographyModule,
    forwardRef(() => ValidationModule),
  ],
  providers: [
    {
      provide: HttpClient,
      useClass: FetchHttpClient,
    },
    RoleGuard,
    // Admin
    AssignPackageToADeliveryPersonUseCase,
    RegisterAdminPersonUseCase,
    AuthenticateAdminPersonUseCase,
    SendAdminPersonCodeUseCase,
    ValidateAdminPersonCodeUseCase,
    ResetAdminPersonPasswordUseCase,
    GetByIdAdminPersonUseCase,
    UpdateAdminPersonUseCase,
    // Delivery
    RegisterDeliveryPerson,
    AuthenticateDeliveryPerson,
    SendDeliveryPersonCodeUseCase,
    ValidDeliveryPersonUseCase,
    ResetDeliveryPersonPassword,
    UpdateDeliveryPersonUseCase,
    GetByIdDeliveryPersonUseCase,
    DeleteDeliveryPersonUseCase,
    FetchManyDeliveryPersonUseCase,
    FetchPackagesNearByDeliveryPersonUseCase,
    // Recipient
    RegisterRecipientPerson,
    AuthenticateRecipientPerson,
    SendRecipientPersonCodeUseCase,
    ValidateRecipientPersonCodeUseCase,
    ResetRecipientPersonPassword,
    UpdateRecipientPersonUseCase,
    GetByIdRecipientPersonUseCase,

    // Package
    CancelPackageUseCase,
    RegisterPackageUseCase,
    GetByPackageByCodeUseCase,
    GetByPackageByIdUseCase,

    // Notification
    FetchManyNotificationsUseCase,
    MarkAsReadNotificationUseCase,
    MarkManyNotificationsAsReaUseCase,
  ],
  exports: [HttpClient],
  controllers: [
    // Admin
    AssignPackageToADeliveryPersonController,
    RegisterAdminPersonController,
    AuthenticateAdminPersonController,
    SendAdminPersonCodeController,
    ValidateAdminPersonCodeController,
    ResetAdminPersonPasswordController,
    UpdateAdminPersonController,
    GetByIdAdminPersonController,
    // Delivery
    RegisterDeliveryPersonController,
    AuthenticateDeliveryPersonController,
    SendDeliveryPersonCodeController,
    ValidateDeliveryPersonCodeController,
    ResetDeliveryPersonPasswordController,
    UpdateDeliveryPersonController,
    GetByIdDeliveryPersonController,
    DeleteDeliveryPersonController,
    FetchManyDeliveryPersonController,
    FetchPackagesNearByDeliveryPersonController,
    // Recipient
    RegisterRecipientPersonController,
    AuthenticateRecipientPersonController,
    SendRecipientPersonCodeController,
    ValidateRecipientPersonCodeController,
    ResetRecipientPersonPasswordController,
    UpdateRecipientPersonController,
    GetByIdRecipientPersonController,
    RegisterPackageController,
    GetPackageByCodeController,
    GetPackageByIdController,

    // Notification
    FetchManyNotificationsController,
    MarkAsReadNotificationController,
    MarkManyNotificationsAsReadController,
    CancelPackageController,
  ],
})
export class HttpModule {}
