# [1.29.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.28.0...v1.29.0) (2026-04-01)


### Bug Fixes

* add AuthModule, EnvModule and ConfigModule to AppModule ([043531c](https://github.com/viniciusferreira7/fast-feet-api/commit/043531cafd99c9be3920ae9cc358c2f8e5f72b9e))
* cast emailService to any in spec to access private resend property ([1f79ef0](https://github.com/viniciusferreira7/fast-feet-api/commit/1f79ef0900d09e4c7586c06c17154cde93527b57))
* register EmailService as own provider token and export it from EmailModule ([414c9a2](https://github.com/viniciusferreira7/fast-feet-api/commit/414c9a208f81248aee5a6b3fa4289f3f00d43fe8))
* use [@ts-expect-error](https://github.com/ts-expect-error) instead of any to access private resend in test ([9961e20](https://github.com/viniciusferreira7/fast-feet-api/commit/9961e20806efc091e3f22dd722b21d4ea164061b))
* use dot notation for resend property access in email spec ([7beb3ed](https://github.com/viniciusferreira7/fast-feet-api/commit/7beb3ed16aa90fbd3146d1234f1692d8eef74141))


### Features

* create email service ([673b737](https://github.com/viniciusferreira7/fast-feet-api/commit/673b7374f8999cf7cbecb9c2b15568dbcf756153))

# [1.28.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.27.0...v1.28.0) (2026-03-27)


### Features

* add ArgoHasher, JwtEncrypter and CryptographyModule ([035f36f](https://github.com/viniciusferreira7/fast-feet-api/commit/035f36f72ab756677b9d111152807f4bae920ef7))
* add EnvModule and EnvService for typed env access ([e967c90](https://github.com/viniciusferreira7/fast-feet-api/commit/e967c9027735cc26f8b467ee88bacf3a1ecb9771))
* add JWT authentication with RS256, guard, strategy and decorators ([f1d4439](https://github.com/viniciusferreira7/fast-feet-api/commit/f1d4439b5b2552a0566dd9c654c7a13740f5834d))

# [1.27.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.26.0...v1.27.0) (2026-03-25)


### Features

* add FetchManyNotificationsUseCase ([25692ec](https://github.com/viniciusferreira7/fast-feet-api/commit/25692ec41513ca17376f8c52c3e394ec4f66032e))
* add findByIdAndAuthorId and pagination params to NotificationsRepository ([05cfae5](https://github.com/viniciusferreira7/fast-feet-api/commit/05cfae532f8b69fbbfc5ed29210de3c759017b54))
* add markAllNotificationAsRead and updateManyByIdAndAuthorId to NotificationsRepository ([05324dc](https://github.com/viniciusferreira7/fast-feet-api/commit/05324dc412416527ef2388f4a55465a5d2b01e05))
* add MarkAsReadNotificationUseCase ([7c298aa](https://github.com/viniciusferreira7/fast-feet-api/commit/7c298aa76ea67ee971e015689ea18ba522a565b4))
* add MarkManyNotificationsAsReaUseCase ([d02fa9f](https://github.com/viniciusferreira7/fast-feet-api/commit/d02fa9f4c47d0c21dafd5ec3df218a62eeac1d02))

# [1.26.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.25.0...v1.26.0) (2026-03-20)


### Bug Fixes

* correct expected default title in OnPackageWasUpdated subscriber test ([32a1986](https://github.com/viniciusferreira7/fast-feet-api/commit/32a1986a65ba343dbc745713dfb9116b8f64e08a))
* correct ResourceNotFoundError message from 'recipient' to 'package' in UpdatePackage ([5bcd585](https://github.com/viniciusferreira7/fast-feet-api/commit/5bcd58543e1f937d54772d074c5379856c031441))
* set deliveredAt in markAsDelivered and correct AttachmentsRepository return type ([98d7ddf](https://github.com/viniciusferreira7/fast-feet-api/commit/98d7ddf18b1d12e9f8d51c99e98d7e38e2822082))
* use PackageWasUpdatedEvent and correct default description in Package update method ([9a6afc9](https://github.com/viniciusferreira7/fast-feet-api/commit/9a6afc9f9d34e95a5e48681ed50a9cf8e7839fe4))


### Features

* add attachmentId to markAsFailedDelivery entity method ([dad3d11](https://github.com/viniciusferreira7/fast-feet-api/commit/dad3d116dcc43e322074226f0338e6079dc826fb))
* add AttachmentsRepository and PackageAttachmentsRepository interfaces ([8d74e3a](https://github.com/viniciusferreira7/fast-feet-api/commit/8d74e3ad8836d626d827e410f2cf0d6255594dd5))
* add DeliveryWithoutRequiredPhoto error ([6099c6a](https://github.com/viniciusferreira7/fast-feet-api/commit/6099c6af71c4339ae8b21f2686faa5ed18ce51cb))
* add InvalidAttachmentTypeError and UploadAndCreateAttachment use case ([17e19e1](https://github.com/viniciusferreira7/fast-feet-api/commit/17e19e12f780d118a565ea7941c39b5bf6d2a269))
* add Uploader storage interface and FakeUploader test double ([f62a217](https://github.com/viniciusferreira7/fast-feet-api/commit/f62a217ea3b74d6e9a514713eeee0a4546a965b2))
* create OnPackageFailedDelivery notification subscriber ([9a21cf8](https://github.com/viniciusferreira7/fast-feet-api/commit/9a21cf89a036cc61f229bdd4447a088b62ee72a1))
* create OnPackageWasDelivered notification subscriber ([98ec91c](https://github.com/viniciusferreira7/fast-feet-api/commit/98ec91c2652b50041ccd9f3610ef8798824c21c9))
* create OnPackageWasUpdated notification subscriber ([4b2a4ff](https://github.com/viniciusferreira7/fast-feet-api/commit/4b2a4ffaf3f51104df540b3af46b4e93e011e1b3))
* create PackageWasDelivered use case ([7b8191c](https://github.com/viniciusferreira7/fast-feet-api/commit/7b8191cd358830c34d1312d10ae226b2d149ddbb))
* create PackageWasDeliveredEvent domain event ([31c9c25](https://github.com/viniciusferreira7/fast-feet-api/commit/31c9c2517c73bed920ec62e8f38ec25870d05680))
* create PackageWasUpdatedEvent domain event ([34d3aea](https://github.com/viniciusferreira7/fast-feet-api/commit/34d3aeaf10efccc43ec66887b2bc3f12ec26d7c5))
* update PackageFailedDelivery use case to require attachment ([30244eb](https://github.com/viniciusferreira7/fast-feet-api/commit/30244eb2c139e109c22d800b8078796a70b1204a))

# [1.25.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.24.0...v1.25.0) (2026-03-17)


### Bug Fixes

* add missing DeliveryPersonNotAssignedToPackageError import in package.spec.ts ([867ea53](https://github.com/viniciusferreira7/fast-feet-api/commit/867ea53d7e17d83bae2d45f9638080db2999a6be))
* correct expected default notification title in on-package-is-in-transit subscriber test ([dc8b47b](https://github.com/viniciusferreira7/fast-feet-api/commit/dc8b47b6a610145e3917678e1eb7b5e0216fd9a8))


### Features

* add markAsFailedDelivery and markAsReturned methods to Package entity ([e229c0c](https://github.com/viniciusferreira7/fast-feet-api/commit/e229c0c85d721e323dd24d7a9d609235af963863))
* add markAsOutForDelivery method to Package entity ([d7535c1](https://github.com/viniciusferreira7/fast-feet-api/commit/d7535c170ebc56fbea83b718643935cddbab5c79))
* create PackageFailedDelivery and ReturnPackage use cases ([d673053](https://github.com/viniciusferreira7/fast-feet-api/commit/d673053211c56268967a10a6d95195242ad0add1))
* create PackageFailedDeliveryEvent and PackageReturnedEvent domain events ([2574ea2](https://github.com/viniciusferreira7/fast-feet-api/commit/2574ea29db63822fee2c0f82b8a32360f9609f93))
* create PackageIsOutForDelivery use case ([8307b01](https://github.com/viniciusferreira7/fast-feet-api/commit/8307b0136affd21381daa4394fc1d07a68a74428))
* create PackageIsOutForDeliveryEvent domain event ([bce64ed](https://github.com/viniciusferreira7/fast-feet-api/commit/bce64eddbd057e8fe8967547608b193f3dc24b20))

# [1.24.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.23.0...v1.24.0) (2026-03-13)


### Bug Fixes

* apply correction on use case, subscriber and package entity ([2b8c25c](https://github.com/viniciusferreira7/fast-feet-api/commit/2b8c25c174c43979b13f3034f01f855f156cf3c6))


### Features

* create event for package is in transit ([8fcb6a3](https://github.com/viniciusferreira7/fast-feet-api/commit/8fcb6a34027d27a55a8f1d475912a76260a7fe48))
* create subscribers when package is in transit ([39bdebd](https://github.com/viniciusferreira7/fast-feet-api/commit/39bdebd41cf8acf4156b0332ec9a3acbfa374f9e))
* create use case to mark package is in transit ([e61f7dc](https://github.com/viniciusferreira7/fast-feet-api/commit/e61f7dc8a229df9ea16e560ce2c69d6ce1651b3a))

# [1.23.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.22.0...v1.23.0) (2026-03-11)


### Bug Fixes

* correct event subscription in OnPackageIsAtADistributionCenter subscriber ([ef327dd](https://github.com/viniciusferreira7/fast-feet-api/commit/ef327dd14c239e933563213cc96d7d90822b6b86))
* update callsites to new assignDeliveryPerson signature ([31d8592](https://github.com/viniciusferreira7/fast-feet-api/commit/31d85926837c23304479dc9f97d9e26c953ed542))


### Features

* add DeliveryPersonNotAssignedToPackageError ([281432a](https://github.com/viniciusferreira7/fast-feet-api/commit/281432ab8a0c3c65e1226d0582dbdefe2e301980))
* add description field to pick up package use case ([1e5a3d5](https://github.com/viniciusferreira7/fast-feet-api/commit/1e5a3d55a15f818c56e471b13db9ca9e82d3b5c0))
* add on package at distribution center notification subscriber ([268129c](https://github.com/viniciusferreira7/fast-feet-api/commit/268129c78156ad823cd2b92d9c17fae59eca2d89))
* add PackageAtDistributionCenterEvent domain event ([885cbc0](https://github.com/viniciusferreira7/fast-feet-api/commit/885cbc00c341c573a6eec2f330eb7e153aa37994))
* create drop off package at distribution center use case ([fac9246](https://github.com/viniciusferreira7/fast-feet-api/commit/fac92467af5edeb3106d78919281736ae092dc81))
* refactor Package entity methods and add markAtDistributionCenter ([58da86d](https://github.com/viniciusferreira7/fast-feet-api/commit/58da86dd0224827e2b1c03428f969fdb702e14d6))

# [1.22.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.21.0...v1.22.0) (2026-03-10)


### Features

* add findByDeliveryPersonId abstract method and in-memory implementation ([d04cfb6](https://github.com/viniciusferreira7/fast-feet-api/commit/d04cfb63df4929b9053232860a61ce2b230fcf0f))
* add on package picked up notification subscriber ([89e7d2c](https://github.com/viniciusferreira7/fast-feet-api/commit/89e7d2cfe34fc7fa272fd1bccf932e7a159428fa))
* add PackagePickedUpEvent domain event ([0cf4080](https://github.com/viniciusferreira7/fast-feet-api/commit/0cf408067a0b6a12f250e6ef3ac695a7c0eaefb2))
* add pick up package error classes ([5f7264b](https://github.com/viniciusferreira7/fast-feet-api/commit/5f7264b1e0a3c95aeab9cb490000ba39b323dd70))
* block disabling delivery person with active packages ([4961124](https://github.com/viniciusferreira7/fast-feet-api/commit/4961124c9a8f903cb11043952d111af42d3b25a7))
* create pick up package use case ([075288e](https://github.com/viniciusferreira7/fast-feet-api/commit/075288e8fcb8945361881b436050b36676f06201))
* implement markAsPickedUp method on Package entity ([63d6639](https://github.com/viniciusferreira7/fast-feet-api/commit/63d663928b286f29351fe1621352e42285a73b4f))

# [1.21.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.20.0...v1.21.0) (2026-03-06)


### Features

* add filter params to fetch many delivery person ([589194a](https://github.com/viniciusferreira7/fast-feet-api/commit/589194a6700254a226ecbeae529a6fceb39268ba))
* add findManyPackages abstract method to packages repository ([3324e08](https://github.com/viniciusferreira7/fast-feet-api/commit/3324e080552df1dd9b15a5e40b2c57f3676e5ff5))
* create use case to fetch many delivery people ([32cf3db](https://github.com/viniciusferreira7/fast-feet-api/commit/32cf3dba90267fc4e1f7f11f4c5bc795a1aafc33))
* create use case to fetch many packages ([2b13e10](https://github.com/viniciusferreira7/fast-feet-api/commit/2b13e1005c1a2cd04034dabae2d6cf017981290f))
* implement findManyPackages on in-memory packages repository ([44a3aea](https://github.com/viniciusferreira7/fast-feet-api/commit/44a3aea98f1077c931c5873d14c121decd148484))

# [1.20.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.19.0...v1.20.0) (2026-03-04)


### Features

* create use case to get package by id ([0f32418](https://github.com/viniciusferreira7/fast-feet-api/commit/0f3241802511bf07e0a4f3cbc57a90bd1feb1b0b))
* create use to get package by code ([e1a17d3](https://github.com/viniciusferreira7/fast-feet-api/commit/e1a17d34fe9d55379fdd4142977fe31c56daaee5))

# [1.19.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.18.0...v1.19.0) (2026-03-03)


### Features

* add new params on use case ([72e50fd](https://github.com/viniciusferreira7/fast-feet-api/commit/72e50fdebe3deb002b0e7ec272949acc4fec4f8b))
* add pagination params interface ([da1a503](https://github.com/viniciusferreira7/fast-feet-api/commit/da1a50370ca50b9fc32d8015ee3758169f1c1ce2))
* create get by id delivery person use case ([494bec3](https://github.com/viniciusferreira7/fast-feet-api/commit/494bec34f586c3c52f1c96a2184df9e736abd4d1))
* create get by id use cases for admin and recipient person ([bb3652f](https://github.com/viniciusferreira7/fast-feet-api/commit/bb3652f18c002d1b050f81a388d9e435548990bf))
* create method to find near by ([bb05687](https://github.com/viniciusferreira7/fast-feet-api/commit/bb056872e7f9441aa4862b15ec700d36e3c87326))
* create use case to fetch packages near by delivery person ([7de8e65](https://github.com/viniciusferreira7/fast-feet-api/commit/7de8e65eb3ee8deb196ae840b9aadad5194edd8c))

# [1.18.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.17.0...v1.18.0) (2026-02-24)


### Features

* add cancelPackage method to package entity ([66d3ccb](https://github.com/viniciusferreira7/fast-feet-api/commit/66d3ccb841d6cef0f60055d9c0560a9569dd26ce))
* create pagination value object ([582ce6c](https://github.com/viniciusferreira7/fast-feet-api/commit/582ce6c6851410a62ec9efc2cf73be9ccf571c72))
* implement cancel package use case ([75178d7](https://github.com/viniciusferreira7/fast-feet-api/commit/75178d7249940832c3dbe2f4e9115f319a18b018))

# [1.17.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.16.0...v1.17.0) (2026-02-20)


### Features

* add disableProfile method to delivery person entity ([d2fab14](https://github.com/viniciusferreira7/fast-feet-api/commit/d2fab1483bee3cae79ac37eeee0356571699548f))
* add isActive property to delivery person entity ([699414f](https://github.com/viniciusferreira7/fast-feet-api/commit/699414fa47820adc7576da28d0b10c5d8800438a))
* block disabled delivery person from authenticating ([5ff1919](https://github.com/viniciusferreira7/fast-feet-api/commit/5ff1919c159dffd7adb214cc8c1be168376caf48))
* block disabled delivery person from resetting password ([fc2438b](https://github.com/viniciusferreira7/fast-feet-api/commit/fc2438b250934d6aa9f9d3abff73c654361e5821))
* block disabled delivery person from sending email code ([d3924e2](https://github.com/viniciusferreira7/fast-feet-api/commit/d3924e25769ad0109931b272f893cbd8b774da15))
* block disabled delivery person from updating profile ([d1428ce](https://github.com/viniciusferreira7/fast-feet-api/commit/d1428cead86988f4043106e2a301ee36d38a4b63))
* block disabled delivery person from validating email code ([bf45caa](https://github.com/viniciusferreira7/fast-feet-api/commit/bf45caa9ba7b1933f0b9c53c44cd0c4b79ea8d7e))
* create use case to delete delivery person ([bdc37b7](https://github.com/viniciusferreira7/fast-feet-api/commit/bdc37b733e134125568bb1e2ea47bd4c21a8f220))

# [1.16.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.15.0...v1.16.0) (2026-02-17)


### Features

* create use case to update admin person data ([a2a5828](https://github.com/viniciusferreira7/fast-feet-api/commit/a2a58287f8978ff7812b09bf3bc2709bbbeaf562))
* create use case to update delivery person data ([bfc58f3](https://github.com/viniciusferreira7/fast-feet-api/commit/bfc58f3740138903dfec0293737de23fbb075df5))
* create use case to update recipient person data ([f6ea1d0](https://github.com/viniciusferreira7/fast-feet-api/commit/f6ea1d0bf8aa3616b9231ae7c19d948268398976))
* only admin can register a delivery person ([72d2c17](https://github.com/viniciusferreira7/fast-feet-api/commit/72d2c17d65ba0abe9a1b6cdb3dad19421345ca8a))

# [1.15.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.14.0...v1.15.0) (2026-02-13)


### Bug Fixes

* correct unit tests ([bb6ee0d](https://github.com/viniciusferreira7/fast-feet-api/commit/bb6ee0d67f99030a4b1bf5a094af0a30caeb974b))


### Features

* add new methods for code ([ad18373](https://github.com/viniciusferreira7/fast-feet-api/commit/ad18373e5b6775ecafb61cc852e7d8770b03d689))
* create use case to validate admin person code ([5cc62c7](https://github.com/viniciusferreira7/fast-feet-api/commit/5cc62c73b8bf760babe9a5ffb33ec9f530bc662b))
* create use case to validate delivery person code ([f002a48](https://github.com/viniciusferreira7/fast-feet-api/commit/f002a48795255f3e16d9c41b3b88257c73a9ade9))
* create use case to validate recipient person code ([1e11d34](https://github.com/viniciusferreira7/fast-feet-api/commit/1e11d34aff8b7d06209f56d5ada155a25b5045e9))

# [1.14.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.13.0...v1.14.0) (2026-02-10)


### Features

* add reset password use cases for admin and recipient ([4615642](https://github.com/viniciusferreira7/fast-feet-api/commit/46156426698f83f5184be4a5f13947b6866050bf))
* create use case to reset delivery person password ([8a847bc](https://github.com/viniciusferreira7/fast-feet-api/commit/8a847bcae12019a82450ab3974a458bc8faea13f))

# [1.13.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.12.0...v1.13.0) (2026-02-03)


### Features

* add email verification methods to admin and recipient entities ([e4e2865](https://github.com/viniciusferreira7/fast-feet-api/commit/e4e28650adb3fffb8224073cd603b95de045b7be))
* add email verification methods to delivery person entity ([8af6c8a](https://github.com/viniciusferreira7/fast-feet-api/commit/8af6c8a3778de028725618a7c020a1cd9be4a0ce))
* add email verifications repository interface ([f000d0e](https://github.com/viniciusferreira7/fast-feet-api/commit/f000d0e88aa7f44aa35d94731cc28e79460421cf))
* add expiration time tracking methods to email verification ([ea191d1](https://github.com/viniciusferreira7/fast-feet-api/commit/ea191d14e46c28279450cc24cc06f1f652c5021a))
* add send admin person code use case ([389cd33](https://github.com/viniciusferreira7/fast-feet-api/commit/389cd33cc88040be64236da6eaa91e247b386c12))
* add send delivery person code use case ([747fc41](https://github.com/viniciusferreira7/fast-feet-api/commit/747fc41db09efa8edbb061a49ecd407e4ff77acb))
* add send recipient person code use case ([7c5314e](https://github.com/viniciusferreira7/fast-feet-api/commit/7c5314e91ebfebd9a5ac4e14990681998d4835ce))
* add update method to admin and recipient repository interfaces ([09d4b79](https://github.com/viniciusferreira7/fast-feet-api/commit/09d4b793bd7465dd398885768620040d5850d774))
* add update method to delivery people repository interface ([c2f1c85](https://github.com/viniciusferreira7/fast-feet-api/commit/c2f1c85c1f2e35c59539a410fd05428bde072709))

# [1.12.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.11.0...v1.12.0) (2026-01-30)


### Bug Fixes

* correct email verification logic and types ([657b345](https://github.com/viniciusferreira7/fast-feet-api/commit/657b3459f8031fa777f7f8e0738bc670509b5784))
* correct password validation logic in registration ([10e1d0a](https://github.com/viniciusferreira7/fast-feet-api/commit/10e1d0acf0f84cf36c282825cba90b069663911a))


### Features

* add email verification requirement to authentication ([265e541](https://github.com/viniciusferreira7/fast-feet-api/commit/265e541b2ff338900d6e3912e798e517ebecd33a))
* add email verification to person entities ([565e7da](https://github.com/viniciusferreira7/fast-feet-api/commit/565e7da4b3c3f7299511bd446cca8e360e89ae5c))
* add validation of password on use cases ([378a5b1](https://github.com/viniciusferreira7/fast-feet-api/commit/378a5b1fc32369971f4d7fde89c374af3bfd68fd))
* create entity email verification ([a0245bd](https://github.com/viniciusferreira7/fast-feet-api/commit/a0245bd6d6e59870ff85e6895047a9f6bb2afedd))
* create error for unverified email authentication ([7d605b9](https://github.com/viniciusferreira7/fast-feet-api/commit/7d605b95fcfd52f5b5d17dcffa00f68dd1c393e6))
* create verification code value object ([af82c06](https://github.com/viniciusferreira7/fast-feet-api/commit/af82c069758321ad7887ed061b9e9b089e9b6682))

# [1.11.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.10.0...v1.11.0) (2026-01-27)


### Features

* create use case to authenticate admin person ([f9c8220](https://github.com/viniciusferreira7/fast-feet-api/commit/f9c82206a98431bcf1084930d0b159e2e84a1b33))
* create use case to authenticate delivery person ([1c1b927](https://github.com/viniciusferreira7/fast-feet-api/commit/1c1b927c298b2b3537c3ee10b5db28a7c61074b4))
* create use case to authenticate recipient ([1bdd110](https://github.com/viniciusferreira7/fast-feet-api/commit/1bdd1105bf3662248d0063be77d98725457188c2))

# [1.10.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.9.0...v1.10.0) (2026-01-27)


### Features

* create abstract class for postal code validator ([5bccdef](https://github.com/viniciusferreira7/fast-feet-api/commit/5bccdef7801f4e7de86decc0c163e2dc380c5a46))
* create fake postal code validator to use on unit tests ([c214c67](https://github.com/viniciusferreira7/fast-feet-api/commit/c214c67380df1c8d7f744501c3601b9ff43de46b))
* implement postal code validator on register package use case ([7a809e6](https://github.com/viniciusferreira7/fast-feet-api/commit/7a809e6f7aa85f937285ebc446aa566f511fe444))

# [1.9.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.8.0...v1.9.0) (2026-01-23)


### Features

* add method to find many by package id into packages history repository ([5629f3b](https://github.com/viniciusferreira7/fast-feet-api/commit/5629f3b9b25d50030f75bb86d18780316a22bbdd))
* add notification sending when package is assigned to delivery person ([9928af7](https://github.com/viniciusferreira7/fast-feet-api/commit/9928af744fce2006ad388a286e8b7f58be2d079f))
* add postal code in use cases, tests and factories ([8b9f4ef](https://github.com/viniciusferreira7/fast-feet-api/commit/8b9f4efd1159b992ca304eea679ef373cc6255c7))
* create new value object for package, it is postal code ([779796c](https://github.com/viniciusferreira7/fast-feet-api/commit/779796c402923b42dfaa8de616c85cebf01ea16e))
* create subscriber when package registered send notification ([e81e309](https://github.com/viniciusferreira7/fast-feet-api/commit/e81e3097d0416b6e9fb8484f1324f5c55aad82aa))
* wait for function to use on tests of subscribers ([619d8f8](https://github.com/viniciusferreira7/fast-feet-api/commit/619d8f81e994d8ddb09747378f951767b309fcad))

# [1.8.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.7.0...v1.8.0) (2026-01-20)


### Features

* add external CPF validation to registration use cases ([69986dc](https://github.com/viniciusferreira7/fast-feet-api/commit/69986dc37eed226297d6b7ff654d87eda59e3f4a))

# [1.7.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.6.0...v1.7.0) (2026-01-20)


### Bug Fixes

* correct factory of package ([e51f4eb](https://github.com/viniciusferreira7/fast-feet-api/commit/e51f4eb814dd5c23c3528355981a4aa0a86e7fd2))


### Features

* add name field into package entity ([10dc405](https://github.com/viniciusferreira7/fast-feet-api/commit/10dc405b1ef7bc5062179d8c9eb27dbf294d5550))
* create factory for recipient ([d914c43](https://github.com/viniciusferreira7/fast-feet-api/commit/d914c4347941bfabe98a5fdb1c6152ea3bc67e93))
* create in memory notifications repository ([403061e](https://github.com/viniciusferreira7/fast-feet-api/commit/403061e9ef4dc3fc670abdeeda85494754628618))
* create notification entity and repository ([760a8ef](https://github.com/viniciusferreira7/fast-feet-api/commit/760a8ef343ac2115c3577b1b24bf9896c5901173))
* create recipient entity ([af972c5](https://github.com/viniciusferreira7/fast-feet-api/commit/af972c555e70ae76c5761aa66f00aeb8304eb609))
* create recipient people repository and in memory repository for it ([933e5d9](https://github.com/viniciusferreira7/fast-feet-api/commit/933e5d99186d9053e6930f9c0059af795fd25611))
* create use case to register recipient person ([f9fd8c5](https://github.com/viniciusferreira7/fast-feet-api/commit/f9fd8c518826c30533937e3e836b335475c32841))
* create use case to send notification ([086e7af](https://github.com/viniciusferreira7/fast-feet-api/commit/086e7af1148891452581bd3d75fca929f0b07b66))

# [1.6.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.5.0...v1.6.0) (2026-01-16)


### Bug Fixes

* add missing dependecy dependencies on unit test ([753f111](https://github.com/viniciusferreira7/fast-feet-api/commit/753f11126046deccb4099b1a034b7633655f7e60))


### Features

* return history of packge ([86d35f2](https://github.com/viniciusferreira7/fast-feet-api/commit/86d35f2fe9eb9abc812ccee621fcc42004d2da1c))

# [1.5.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.4.0...v1.5.0) (2026-01-16)


### Bug Fixes

* resolve type errors in package status tests ([35e2648](https://github.com/viniciusferreira7/fast-feet-api/commit/35e2648fc49fc021c048b2350e20d1b409a16fcc))


### Features

* add domain events and watched list infrastructure ([8c52361](https://github.com/viniciusferreira7/fast-feet-api/commit/8c52361ede78070b6bab71621103fe37f0342f5f))
* add findById and update methods to packages repository ([520fe70](https://github.com/viniciusferreira7/fast-feet-api/commit/520fe70bec44175978c016dfe26785ccc47a386c))
* add package assigned to delivery event ([92a15e5](https://github.com/viniciusferreira7/fast-feet-api/commit/92a15e51417f0f4f2ecd1b1446e64aa73d8d3075))
* add package histories management to package entity ([a029efd](https://github.com/viniciusferreira7/fast-feet-api/commit/a029efde0c6f6e76af8e803b25e606556a84ea41))
* add use case to assign package to delivery person ([af815c7](https://github.com/viniciusferreira7/fast-feet-api/commit/af815c729a591270edbdf48afc103fcf112731fd))
* implement package history tracking with audit trail ([f3c1956](https://github.com/viniciusferreira7/fast-feet-api/commit/f3c1956342f5d7a51340255f6a85e2c52555c90c))
* integrate package history into package factory ([567dd7b](https://github.com/viniciusferreira7/fast-feet-api/commit/567dd7bc613dfcc4ea332875f9dfafeb4ddfda07))

# [1.4.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.3.0...v1.4.0) (2026-01-13)


### Features

* add findById method to people repositories ([1c346c3](https://github.com/viniciusferreira7/fast-feet-api/commit/1c346c30cc0181dde2b2c7552ea89a85c1225e27))
* add implementation for in memory packages repository ([f192902](https://github.com/viniciusferreira7/fast-feet-api/commit/f1929024e5fdf7c78a8e8ce546656ede11401876))
* add new methods into in memory repositories ([3638228](https://github.com/viniciusferreira7/fast-feet-api/commit/363822889419c7148931833d186ba78bdd5728e4))
* add package repository interface ([43beb68](https://github.com/viniciusferreira7/fast-feet-api/commit/43beb68c88aadc5717172ff553e5c7ce8569d44a))
* create use case to register package ([43c8736](https://github.com/viniciusferreira7/fast-feet-api/commit/43c87360dac5674bd200de81fe153dbbccab89ea))

# [1.3.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.2.0...v1.3.0) (2026-01-09)


### Features

* create factories for entities ([4a66d47](https://github.com/viniciusferreira7/fast-feet-api/commit/4a66d4704b421af5f6e07512cd9e3f2739d01d07))

# [1.2.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.1.0...v1.2.0) (2026-01-09)


### Bug Fixes

* correct imports ([8d86e81](https://github.com/viniciusferreira7/fast-feet-api/commit/8d86e8136ee77b5ed60ba5c62d9b54991928042c))


### Features

* create admin persons repository interface ([aed97a0](https://github.com/viniciusferreira7/fast-feet-api/commit/aed97a03dd9d01368d20a4ba5e8add38da8fdb61))
* create either to use on retuning of use cases ([8c53685](https://github.com/viniciusferreira7/fast-feet-api/commit/8c53685a0b73e33d69ffeb90284ae69d36bb260e))
* create encrypter abstract class ([c5b4a56](https://github.com/viniciusferreira7/fast-feet-api/commit/c5b4a56f3bd470d186fa6e6902ffe4e91034f95f))
* create fake hasher and encrypter to use in unit tests ([5a29df7](https://github.com/viniciusferreira7/fast-feet-api/commit/5a29df749da0e28121c4a2f7b117cc340f441f5c))
* create hash abstract class ([ddc534f](https://github.com/viniciusferreira7/fast-feet-api/commit/ddc534f5d7dff5623b01789617ed7f531e632e73))
* create in-memory admin people repository ([82e6575](https://github.com/viniciusferreira7/fast-feet-api/commit/82e6575e0ea473ec3cf7b91cfcd40301a968d957))
* create package history value object ([8455c3f](https://github.com/viniciusferreira7/fast-feet-api/commit/8455c3ff4c6258585e49354ea009d0811efeb0ba))
* create use case to register delivery person ([a9725ae](https://github.com/viniciusferreira7/fast-feet-api/commit/a9725ae9ea8f6c8d7dbcd4213fb005b8b8cfcb72))
* create use case tov register admin person ([2b5e1dc](https://github.com/viniciusferreira7/fast-feet-api/commit/2b5e1dc687fcf4219c35420f09cc62e2cb60d890))

# [1.1.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.0.0...v1.1.0) (2025-12-23)


### Features

* add zod to validate envs ([28239a3](https://github.com/viniciusferreira7/fast-feet-api/commit/28239a3b3ed2a4079eba9c2983cec98bd4432e9c))

# 1.0.0 (2025-12-19)


### Features

* add aggregate root ([28d4307](https://github.com/viniciusferreira7/fast-feet-api/commit/28d4307b20420f9ba17778d73665688f7ded500e))
* add entity abstract class ([1a98b95](https://github.com/viniciusferreira7/fast-feet-api/commit/1a98b95cd6c1d5e844eeca31c41e02596b4debb8))
* attachment entity ([a053af8](https://github.com/viniciusferreira7/fast-feet-api/commit/a053af8bfcefe37014f744c99396ffb9e8461b9e))
* create admin person entity ([7983fd2](https://github.com/viniciusferreira7/fast-feet-api/commit/7983fd272bf24c797a824ef6932905d8d565df39))
* create delivery person entity ([7e4a116](https://github.com/viniciusferreira7/fast-feet-api/commit/7e4a116074221e138ef43552b4751ff90206e47a))
* create package code value object ([7f52e1c](https://github.com/viniciusferreira7/fast-feet-api/commit/7f52e1c3177d0303e2760684196e4af4e67df07d))
* create package entity ([32ac88f](https://github.com/viniciusferreira7/fast-feet-api/commit/32ac88fe45071c69728adacedac7e350d2091ee7))
* create package status value object ([6bf7e6c](https://github.com/viniciusferreira7/fast-feet-api/commit/6bf7e6c7f2839724bf80c9a539f7483075230d46))
* create value object class and unique entity id ([0e36bfa](https://github.com/viniciusferreira7/fast-feet-api/commit/0e36bfae855a1b6717949e521461d84f90413ca4))
* implement cpf value object ([d6a2ed3](https://github.com/viniciusferreira7/fast-feet-api/commit/d6a2ed376c5c790d25bef654e628830cb4f8f517))
