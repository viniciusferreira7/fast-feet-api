# [1.51.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.50.0...v1.51.0) (2026-08-18)


### Bug Fixes

* **docker:** point the healthcheck at the readiness probe ([a0edd6d](https://github.com/viniciusferreira7/fast-feet-api/commit/a0edd6d4b90d11661e42b4f050c916eef20e5c04))
* **env:** return the declared value type from EnvService.get ([9a38ead](https://github.com/viniciusferreira7/fast-feet-api/commit/9a38ead44044177e57814341a13188a0e88bea09))
* **http:** bind the server to all interfaces ([fe9ccb4](https://github.com/viniciusferreira7/fast-feet-api/commit/fe9ccb4a31c9600596126e7c2674c4a332be1782))


### Features

* **health:** drain traffic before shutting down ([931044d](https://github.com/viniciusferreira7/fast-feet-api/commit/931044dcdddac0471e8e4f3176aed920ae15c45f))
* **health:** expose liveness, readiness and startup probes ([6a774c7](https://github.com/viniciusferreira7/fast-feet-api/commit/6a774c76b93b2c0953a9a02b46bd972c06c89388))

# [1.50.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.49.0...v1.50.0) (2026-05-31)


### Bug Fixes

* **notification:** use value import for NotificationsRepository to enable Nest DI ([2606304](https://github.com/viniciusferreira7/fast-feet-api/commit/260630423ae7069319b5d3353989d28b18e33a0b))
* **packages-repository:** dispatch domain events after register and update ([b45ff93](https://github.com/viniciusferreira7/fast-feet-api/commit/b45ff93411a3b83498c2003c13900591686a08ad))


### Features

* **events:** create events module ([f2f5051](https://github.com/viniciusferreira7/fast-feet-api/commit/f2f50512189db2278ebd1941b8f4ccf38c78fede))

# [1.49.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.48.0...v1.49.0) (2026-05-27)


### Bug Fixes

* **migration:** register 0002_rename_attachment_url_to_key in drizzle journal ([689bdec](https://github.com/viniciusferreira7/fast-feet-api/commit/689bdec92af26267cf70f4448f25338259e0c9c9))
* **tests:** apply AllExceptionsFilter in test app to prevent socket hang up ([93968ff](https://github.com/viniciusferreira7/fast-feet-api/commit/93968fff3b017038c0652012d63090d3cd5ba0ce))


### Features

* add UploadedFile decorator and FastifyFileInterceptor ([37ada74](https://github.com/viniciusferreira7/fast-feet-api/commit/37ada7439d0f87c0d5db4f53855b6b4000d35f84))
* **controller:** add metrics and swagger to cancel-package controller ([7914feb](https://github.com/viniciusferreira7/fast-feet-api/commit/7914febba351a0f05976b40763b7bf41b2df3516))
* **controller:** implement get-package-by-id controller and register in http module ([49330f4](https://github.com/viniciusferreira7/fast-feet-api/commit/49330f4822e165232c5fa7533d45931ab3720b22))
* **controller:** implement upload-and-create-attachment controller ([3a93544](https://github.com/viniciusferreira7/fast-feet-api/commit/3a93544ab7ab1090314dc58253d189d7cd0c1fcc))
* **controllers:** add notification controllers and register in http module ([9ba6d8f](https://github.com/viniciusferreira7/fast-feet-api/commit/9ba6d8f5c91a4b1f5ab2ac08340f02073970f07e))
* implement remaining package status controllers with metrics, swagger and e2e tests ([5b89a6a](https://github.com/viniciusferreira7/fast-feet-api/commit/5b89a6ac3aa9022c30632dbafbe5328752c07f48))
* **metrics:** add get-package-by-id operation counters ([ddadfd8](https://github.com/viniciusferreira7/fast-feet-api/commit/ddadfd8e232b1cbbfb8942c71b7fb4073c401f4d))
* **metrics:** add notification operation counters ([e55d3de](https://github.com/viniciusferreira7/fast-feet-api/commit/e55d3de42488be5cee10ddce97d317b580499b90))
* register @fastify/multipart in main bootstrap ([4ca700e](https://github.com/viniciusferreira7/fast-feet-api/commit/4ca700ec3e74ed223a9a1e4fd980636a5efc7fa7))
* **upload:** add @Injectable to use case and metrics counters to controller ([d9edfda](https://github.com/viniciusferreira7/fast-feet-api/commit/d9edfdabebcaeb3e3bdd6078b6e5cf1f87ef9619))
* **use-cases:** add @Injectable and remove type-only imports from get-package-by-id ([1f1f616](https://github.com/viniciusferreira7/fast-feet-api/commit/1f1f616103b45e6eb220dcd438a65853865debde))
* **use-cases:** add @Injectable and remove type-only imports from notification use cases ([d5705d9](https://github.com/viniciusferreira7/fast-feet-api/commit/d5705d94946f9331cbf288406be16ee1237b21a0))

# [1.48.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.47.0...v1.48.0) (2026-05-25)


### Bug Fixes

* **controller:** correct route param name mismatch in assign-package controller ([b5e7bf3](https://github.com/viniciusferreira7/fast-feet-api/commit/b5e7bf33799f0f44a311cc8f27e2be6c15de2b6a))
* **observability:** suppress dotenv missing-file warnings in metrics and tracer ([f90244b](https://github.com/viniciusferreira7/fast-feet-api/commit/f90244b4ba1f0b46f3db94285b6124eb8057f8d2))
* **use-case:** propagate status transition error from assignDeliveryPerson ([3604c59](https://github.com/viniciusferreira7/fast-feet-api/commit/3604c59396b5a580a3553f3e977876db819e82eb))


### Features

* **controller:** implement get-package-by-code with API key auth ([8e3245a](https://github.com/viniciusferreira7/fast-feet-api/commit/8e3245a66af3cc239c32f94266c53943afc52ea6))
* **controllers:** create controller to register package ([1e7d5fa](https://github.com/viniciusferreira7/fast-feet-api/commit/1e7d5fae094bd10854bf02f552c7e94f29ec82bf))
* **observability:** add metrics for get-package-by-code ([509de18](https://github.com/viniciusferreira7/fast-feet-api/commit/509de18c7adac5b50c98c5b504444f1c1bfd4b0e))
* **presenter:** add toPublicHttp method to package presenters ([3f9e4a7](https://github.com/viniciusferreira7/fast-feet-api/commit/3f9e4a7e131b9c31481803ca97b967907e05e0df))

# [1.47.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.46.0...v1.47.0) (2026-05-22)


### Bug Fixes

* **db:** add emailsCodes upsert in delivery/recipient update, add role filter to admin repo find methods, fix ghost JWT sub to use valid UUID in e2e specs ([8e6f85e](https://github.com/viniciusferreira7/fast-feet-api/commit/8e6f85e0d2f4bc9f7e769def678b381c1a99100f))


### Features

* **http:** add delivery and recipient person controllers with snake_case body/query params ([c829b90](https://github.com/viniciusferreira7/fast-feet-api/commit/c829b90fec423af5e93a1504f02b49eb547df33a))
* **metrics:** add observability counters for delivery and recipient person operations ([5b872c5](https://github.com/viniciusferreira7/fast-feet-api/commit/5b872c55dee94173681d0788b007f21ad0115612))

# [1.46.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.45.0...v1.46.0) (2026-05-20)


### Bug Fixes

* **controllers:** change order of guard and role ([e064674](https://github.com/viniciusferreira7/fast-feet-api/commit/e06467486a862fffdb014190f64407c0ff6145b0))


### Features

* **admin:** add get-by-id admin controller with swagger, metrics, and module wiring ([fc5c6d3](https://github.com/viniciusferreira7/fast-feet-api/commit/fc5c6d3a6afd39636baba04c92d58aac0984e084))
* **use-cases:** add email sender and re-verification flow on email update for delivery and recipient ([0e7b65b](https://github.com/viniciusferreira7/fast-feet-api/commit/0e7b65b2eb680e04f661548fb1ebace64bb511cd))

# [1.45.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.44.0...v1.45.0) (2026-05-19)


### Bug Fixes

* **http:** move @Role to class level in register-admin-person controller ([9488d24](https://github.com/viniciusferreira7/fast-feet-api/commit/9488d248eb13428b652373b7329a385f3e947fe8))
* **http:** replace RoleGuard with CurrentAPiKey on api-key-protected endpoints ([beb4be4](https://github.com/viniciusferreira7/fast-feet-api/commit/beb4be42f3094ff32247a8ef6c254aa644ef2dbc))


### Features

* **cli:** add exec wrapper and test file discovery utils ([3d2e53f](https://github.com/viniciusferreira7/fast-feet-api/commit/3d2e53fbfaf6d4fba891be1002db2434adc4a76e))
* **cli:** add explicit run all option pre-selected in test file picker ([2093076](https://github.com/viniciusferreira7/fast-feet-api/commit/20930761ba8f4fe33c3970e64a2beeb39337f4a8))
* **cli:** add flow runner definitions with multi-file support ([124d230](https://github.com/viniciusferreira7/fast-feet-api/commit/124d23045867cc739578f9b6e688ec56deef8c6b))
* **cli:** add interactive test runner with multiselect flow and file picker ([6c665fe](https://github.com/viniciusferreira7/fast-feet-api/commit/6c665fe9ca73ae70814b1a1686f1bcaff47a067d))
* **cli:** stream output in real-time, add watch mode and elapsed time ([e350506](https://github.com/viniciusferreira7/fast-feet-api/commit/e350506639d5183290de6976331f95bd3e5d9083))
* **http:** add global api prefix, fix swagger path and catch binding ([e933da0](https://github.com/viniciusferreira7/fast-feet-api/commit/e933da0759924a7f87d17e40d4f748cdd1b06aa6))
* **http:** add swagger annotations to update admin person controller ([ace734f](https://github.com/viniciusferreira7/fast-feet-api/commit/ace734ffa61206c38c643718573610434d8cbe43))
* **http:** register UpdateAdminPersonUseCase and controller in HttpModule ([3ff6137](https://github.com/viniciusferreira7/fast-feet-api/commit/3ff61379e8e197bd09fbb4d94585827f9c68393d))
* **observability:** add metrics counters for update admin person ([a19cb48](https://github.com/viniciusferreira7/fast-feet-api/commit/a19cb483de20699ae797690b1bdfc67b85a24197))
* **scripts:** add watch mode and streaming output to CLI runner ([445139c](https://github.com/viniciusferreira7/fast-feet-api/commit/445139c3ceaf62d613bc6bd41836e0f193df9107))
* **swagger:** add tags and named bearer auth scheme to DocumentBuilder ([5a25c50](https://github.com/viniciusferreira7/fast-feet-api/commit/5a25c5066689e86c918e41d51e128ab16b31962f))
* **tracer:** add version of application on tracer ([f6405d2](https://github.com/viniciusferreira7/fast-feet-api/commit/f6405d2128296ae41ebaccf3337068b77a5d03d3))
* **use-case:** send email verification code on admin person email update ([5b07077](https://github.com/viniciusferreira7/fast-feet-api/commit/5b070775681e76ea57185402385307cf67a73363))

# [1.44.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.43.0...v1.44.0) (2026-05-13)


### Bug Fixes

* **ci:** use correct db:migrate script in e2e migration step ([eebb80c](https://github.com/viniciusferreira7/fast-feet-api/commit/eebb80cba21a4fd00dcc7baf1e571b85ebed3cc6))
* **controller:** add pipe on body instead of handler ([b2ee0d5](https://github.com/viniciusferreira7/fast-feet-api/commit/b2ee0d5f1e2c5b169ea72ea427baaf9e82c68a89))
* decouple email verification status from active email code ([23b49be](https://github.com/viniciusferreira7/fast-feet-api/commit/23b49be0b5e78f7e5435ac42d54b9b7599859d30))
* **http:** register ResetAdminPersonPasswordUseCase as provider and fix type import ([ba1217b](https://github.com/viniciusferreira7/fast-feet-api/commit/ba1217bd26aa15213b5fcfb9fc662dc771886aa3))
* **metrics:** fix counter creation and centralize all counters in metrics module ([59fa9c0](https://github.com/viniciusferreira7/fast-feet-api/commit/59fa9c033e70dde79bbaf7e7e4702b2923f79396))
* remove override prop from dot env into metrics and tracer ([70f75b3](https://github.com/viniciusferreira7/fast-feet-api/commit/70f75b329b70b71abd40eb03bb918503d76a75cb))


### Features

* add prop to not run tests e2e in parallelism ([95ade86](https://github.com/viniciusferreira7/fast-feet-api/commit/95ade8669abb657989cb52460aa867c4b9d19ee2))
* **controller:** add reset-admin-person-password controller ([6aed489](https://github.com/viniciusferreira7/fast-feet-api/commit/6aed4893735a933410d900918e011f7402cb773c))
* **metrics:** add rejection counters to auth guards ([ba0a3c9](https://github.com/viniciusferreira7/fast-feet-api/commit/ba0a3c99e7bbf4227dd93050ea0726cc2c0ccd36))
* **metrics:** add success/error counters to all controllers ([bd085d7](https://github.com/viniciusferreira7/fast-feet-api/commit/bd085d7d63f091af98ff38dbc48bf66c7c010eaf))
* **observability:** add counters for reset-admin-person-password ([d40a4ed](https://github.com/viniciusferreira7/fast-feet-api/commit/d40a4eda36251ac66e82e91efc834fa37b173874))
* **use-case:** make ResetAdminPersonPasswordUseCase injectable ([ac6a427](https://github.com/viniciusferreira7/fast-feet-api/commit/ac6a4271624a52d982c11f7b09641bcc55b80e26))

# [1.43.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.42.0...v1.43.0) (2026-05-06)


### Bug Fixes

* **controller:** remove password complexity validation from login endpoint ([bf707a7](https://github.com/viniciusferreira7/fast-feet-api/commit/bf707a786cd7c1c5aad2dbd23f1e533e41ee4853))
* **repository:** insert email_code row before updating user FK in DrizzleAdminPeopleRepository ([4677a83](https://github.com/viniciusferreira7/fast-feet-api/commit/4677a83cf649ae585b728cab19227156fc0ea351))
* **token:** add on token type and role ([d535272](https://github.com/viniciusferreira7/fast-feet-api/commit/d53527282a66cca3fecd82ec7d2fa48b09cc81fe))
* **use-case:** add @Injectable and fix imports in SendAdminPersonCodeUseCase ([5efa873](https://github.com/viniciusferreira7/fast-feet-api/commit/5efa873ae2fb3984fdfc1aa6bdd8fced26e13e48))
* **use-case:** add @Injectable to AuthenticateAdminPersonUseCase ([fa232a7](https://github.com/viniciusferreira7/fast-feet-api/commit/fa232a74f853b31a8ad952eba1131d95c64591c8))
* **use-case:** change type import to regular import in ValidateRecipientPersonCodeUseCase ([440cbff](https://github.com/viniciusferreira7/fast-feet-api/commit/440cbff42f2f9c5357fdad23117718079a9d37c8))
* **use-case:** include type and role in JWT payload for AuthenticateAdminPersonUseCase ([10339f3](https://github.com/viniciusferreira7/fast-feet-api/commit/10339f3506b4713ba9305cf653f3a2d6412527fe))


### Features

* **auth:** require API token on send-code, validate-code, and login admin endpoints ([1bd70fe](https://github.com/viniciusferreira7/fast-feet-api/commit/1bd70fea5878e472c63bcbd6aec7d134b98949cf))
* **controller:** add send admin person code controller with Swagger annotations ([dd229b7](https://github.com/viniciusferreira7/fast-feet-api/commit/dd229b768c7a7527beb660dd2b7392f190f5a266))
* **controller:** add ValidateAdminPersonCodeController with Swagger, @Public, and ZodValidationPipe ([f835fb2](https://github.com/viniciusferreira7/fast-feet-api/commit/f835fb26c6ea90dedfd8bd4a0dd04e793cda937f))
* **http:** register SendAdminPersonCodeUseCase and EmailModule in HttpModule ([b4ab14c](https://github.com/viniciusferreira7/fast-feet-api/commit/b4ab14c7bc763438c98f04b2da554e1e5fc79e51))

# [1.42.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.41.0...v1.42.0) (2026-05-05)


### Bug Fixes

* **use-case:** rename AuthenticateAdminPerson to AuthenticateAdminPersonUseCase ([40d94de](https://github.com/viniciusferreira7/fast-feet-api/commit/40d94dea73044e0676fd6fa4ae0c33e576d69b46))


### Features

* **controller:** add authenticate admin person controller with Swagger annotations ([ccf26e0](https://github.com/viniciusferreira7/fast-feet-api/commit/ccf26e006db93b775122311aab4823d213112f44))
* **env:** add new validation for CORS_ORIGIN ([fcc6bdd](https://github.com/viniciusferreira7/fast-feet-api/commit/fcc6bdd7f6f1547b7848f027e9292cebeb40fdb3))
* **http:** register AuthenticateAdminPersonUseCase and controller in HttpModule ([5b96288](https://github.com/viniciusferreira7/fast-feet-api/commit/5b96288963382d4c432522398fe49d86da1d61b6))

# [1.41.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.40.0...v1.41.0) (2026-05-01)


### Bug Fixes

* **auth:** align Role decorator metadata key with RoleGuard and fix case comparison ([846cf5b](https://github.com/viniciusferreira7/fast-feet-api/commit/846cf5b89c207f1fc59b1dcb34dbbf44906e4b11))
* **auth:** restore Reflector as value import to preserve DI token at runtime ([782230f](https://github.com/viniciusferreira7/fast-feet-api/commit/782230f3c65a95e476017d92ff0a026525af1ad4))
* **http:** add missing RoleGuard, use case provider, and Swagger to RegisterAdminPersonController ([5f46897](https://github.com/viniciusferreira7/fast-feet-api/commit/5f46897ddc7a4cea49776d8da0136e7a4dac16da))
* **http:** import DatabaseModule, CryptographyModule and ValidationModule to resolve use case dependencies ([3d90fc7](https://github.com/viniciusferreira7/fast-feet-api/commit/3d90fc73e01bc483642b657c75bddff5fbc96d1d))
* **http:** register RoleGuard as provider in HttpModule to allow Reflector injection ([948b533](https://github.com/viniciusferreira7/fast-feet-api/commit/948b533e6f8c98e0f56187dcf85cd1e09e89a08e))
* **test:** update feedback suggestions test to use password that passes length check ([21b98ef](https://github.com/viniciusferreira7/fast-feet-api/commit/21b98efa95fe45f7cd81f0e62f27e37b82c08e33))


### Features

* **env:** add ADMIN_ROOT_CPF env var and missing password vars to example files ([98e2b19](https://github.com/viniciusferreira7/fast-feet-api/commit/98e2b192b7644973f3d011332fe93d65e259d12a))
* **env:** add cpf schema to validate admin root cpf ([3c7cf28](https://github.com/viniciusferreira7/fast-feet-api/commit/3c7cf28c2691e5b8cb530780aa2db12cc60b1eff))
* **env:** add PASSWORD_MIN_LENGTH and PASSWORD_MIN_SCORE for configurable password strength ([451d2f4](https://github.com/viniciusferreira7/fast-feet-api/commit/451d2f40ee62b1b27cc9fe06ca2222ba8c7156fa))
* **http:** add AssignPackageToADeliveryPersonUseCase on HttpModule ([3fdcda4](https://github.com/viniciusferreira7/fast-feet-api/commit/3fdcda4f19e13de8f205f6e57244ce648bf18189))
* **http:** export AdminPersonPresenterToHttp interface ([500f2ae](https://github.com/viniciusferreira7/fast-feet-api/commit/500f2ae977510b116da9fe8d20a1dd4588184fd6))
* **http:** implement AssignPackageToADeliveryPerson controller with Swagger annotations ([ecaa5cc](https://github.com/viniciusferreira7/fast-feet-api/commit/ecaa5cc290668ed2cf6aac42e253795aa4f6de65))
* **http:** register RegisterAdminPersonController in HttpModule ([1dca0ce](https://github.com/viniciusferreira7/fast-feet-api/commit/1dca0ceab7521c285e6159246030a88de2781524))
* **infra:** add cpf and password zod schemas to shared utils ([faad4ce](https://github.com/viniciusferreira7/fast-feet-api/commit/faad4ce18115239422ba3b5b9de81fc06ef3d48f))
* **use-cases:** require authorId to register a new admin person ([dbd6dd1](https://github.com/viniciusferreira7/fast-feet-api/commit/dbd6dd173a50250a28198e4d92c30cdf2604ec8f))

# [1.40.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.39.0...v1.40.0) (2026-04-28)


### Features

* **pipes:** create zod validation pipe to use on controllers ([10df377](https://github.com/viniciusferreira7/fast-feet-api/commit/10df377e51235a807ba5db6c35e0c8381432f7bc))

# [1.39.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.38.0...v1.39.0) (2026-04-26)


### Features

* **infra:** implement PackageDetails in drizzle mapper and repository ([ab00dba](https://github.com/viniciusferreira7/fast-feet-api/commit/ab00dba73435276d03eec2a9d7696339e413eecc))
* **presenters:** add package, package-details, package-history, and notification presenters ([6232e90](https://github.com/viniciusferreira7/fast-feet-api/commit/6232e90b15f5f9e465a445d1494a6d02e8b605fa))
* **presenters:** create admin person presenter ([a7fa9ef](https://github.com/viniciusferreira7/fast-feet-api/commit/a7fa9ef287a1cadbcc65f093de146c8dce3724b6))
* **presenters:** create delivery person presenter ([a8d347b](https://github.com/viniciusferreira7/fast-feet-api/commit/a8d347bc6a9cc8da3d39a1bb40a0aa045fcb0e9a))
* **presenters:** create recipient person presenter ([738f2fb](https://github.com/viniciusferreira7/fast-feet-api/commit/738f2fb495772784fe4fb612cf3e60a23401865a))
* **repository:** add findDetailsById and findDetailsByCode to PackagesRepository ([c608a03](https://github.com/viniciusferreira7/fast-feet-api/commit/c608a034315d0302dffaf93d2ff3e252829d0953))
* **use-case:** get-package-by-code returns PackageDetails ([2857c28](https://github.com/viniciusferreira7/fast-feet-api/commit/2857c28ae6c2936cee3b2d7cf0b72c14068151ee))
* **value-object:** create PackageDetails value object ([7800918](https://github.com/viniciusferreira7/fast-feet-api/commit/7800918bcbda5e89b336b25eabacda8725c01a43))

# [1.38.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.37.0...v1.38.0) (2026-04-22)


### Features

* **auth:** add Role decorator for role-based route protection ([5c8e474](https://github.com/viniciusferreira7/fast-feet-api/commit/5c8e47421dadea72a99a0aa87b1525843031a2dd))
* **auth:** add RoleGuard to enforce role-based access control ([7044820](https://github.com/viniciusferreira7/fast-feet-api/commit/7044820ebe51153a0df91c1d423fb13eb50f16b4))
* **decorator:** create current api key decorator ([06e43a9](https://github.com/viniciusferreira7/fast-feet-api/commit/06e43a987298a1dfedf1e5d326efc0141f6fde96))
* **env:** add CLIENT_API_KEY as test-only required variable ([f5709ac](https://github.com/viniciusferreira7/fast-feet-api/commit/f5709ac03efbfe9c2e3f33b4282131227726f009))
* **scripts:** add generate-api-key script to issue client JWT tokens ([20cb47d](https://github.com/viniciusferreira7/fast-feet-api/commit/20cb47d4aa26b447083d50825942868e37cf6d4c))

# [1.37.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.36.0...v1.37.0) (2026-04-21)


### Features

* **auth:** log invalid JWT payloads and unauthorized requests ([d729137](https://github.com/viniciusferreira7/fast-feet-api/commit/d729137491b1aafcae981d877d7d777c46beae5b))
* **drizzle:** add pool lifecycle and query logging ([467476b](https://github.com/viniciusferreira7/fast-feet-api/commit/467476be05f03dc3b4485b933a91c12b30285d31))
* **email:** log Resend send failures ([f68b106](https://github.com/viniciusferreira7/fast-feet-api/commit/f68b10660764d1941e7380734d4b7b6fa5b87601))
* **http:** log retry attempts and final errors in FetchHttpClient ([7e81ca2](https://github.com/viniciusferreira7/fast-feet-api/commit/7e81ca2964de09da7a23c8133b86fb5587b7bd2b))
* **logger:** add env-aware pino config with OTLP transport ([077e08c](https://github.com/viniciusferreira7/fast-feet-api/commit/077e08c764c3d349268d496d9002f00b0dc3555c))
* **main:** add global exception filter, process error handlers and Fastify request logging ([8c11dd9](https://github.com/viniciusferreira7/fast-feet-api/commit/8c11dd92e076e68f89c602457f3da1948b3e77e9))
* **postal-code:** log external service errors ([a318a3a](https://github.com/viniciusferreira7/fast-feet-api/commit/a318a3aedfc2150d38ab8b58ac59c3de12a07168))
* **storage:** log and rethrow R2 upload errors ([cbd70fb](https://github.com/viniciusferreira7/fast-feet-api/commit/cbd70fb884158797fee9f21cf197edc0a42594ba))

# [1.36.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.35.0...v1.36.0) (2026-04-19)


### Bug Fixes

* **mapper:** correct drizzle delivery person mapper ([b5e2e71](https://github.com/viniciusferreira7/fast-feet-api/commit/b5e2e714549dcab041de53498a6638d29e79a8fc))
* **repository:** correct abstract method signatures in delivery-people-repository ([0ee4148](https://github.com/viniciusferreira7/fast-feet-api/commit/0ee4148823df25ca5fc31843aab2aeb0d0f384dc))
* **repository:** correct abstract method signatures in recipient-people-repository ([87019e4](https://github.com/viniciusferreira7/fast-feet-api/commit/87019e4ff469a85a1a5de8d2461dca6c67a25c12))


### Features

* **database:** register all remaining repositories in database module ([8e015e4](https://github.com/viniciusferreira7/fast-feet-api/commit/8e015e425f3b04685f039b655384351f92fa4543))
* **database:** register DrizzleDeliveryPeopleRepository in database module ([45c77d5](https://github.com/viniciusferreira7/fast-feet-api/commit/45c77d5cc553a74bc385d91ee63db4ac36e97d24))
* **database:** register DrizzleRecipientPeopleRepository in database module ([ee2e036](https://github.com/viniciusferreira7/fast-feet-api/commit/ee2e036279a5883a19943f4090f753f77d952776))
* **mapper:** create drizzle recipient person mapper ([cd432d2](https://github.com/viniciusferreira7/fast-feet-api/commit/cd432d28ff8b86bbda203b058bf4977a6a1ab020))
* **mappers:** create drizzle delivery person mapper ([a4a584d](https://github.com/viniciusferreira7/fast-feet-api/commit/a4a584dbc1bad31cc481611963b6348ff18b4c06))
* **repository:** implement drizzle attachments repository ([0670d9b](https://github.com/viniciusferreira7/fast-feet-api/commit/0670d9b2d89ed18920790db5b2912ec041b258b6))
* **repository:** implement drizzle delivery people repository ([5d78c56](https://github.com/viniciusferreira7/fast-feet-api/commit/5d78c562267e2f1040ba0e234794e9bd5ed52fa5))
* **repository:** implement drizzle email verifications repository ([724c3ae](https://github.com/viniciusferreira7/fast-feet-api/commit/724c3ae42033b3cb9e9fa732312acddff2375622))
* **repository:** implement drizzle notifications repository ([be4e908](https://github.com/viniciusferreira7/fast-feet-api/commit/be4e908b095ca56e80a2c0ed5ee735369ad1e63f))
* **repository:** implement drizzle package attachments repository ([2c1f8cf](https://github.com/viniciusferreira7/fast-feet-api/commit/2c1f8cff4cdfd53052c47ab1f963b16398b8b979))
* **repository:** implement drizzle packages history repository ([a995ffc](https://github.com/viniciusferreira7/fast-feet-api/commit/a995ffc6e680963e20d9911b0959e834c0994bc1))
* **repository:** implement drizzle packages repository ([f179a2a](https://github.com/viniciusferreira7/fast-feet-api/commit/f179a2ab18420fa9d1b1267073c4f62722090f24))
* **repository:** implement drizzle recipient people repository ([f5a8d58](https://github.com/viniciusferreira7/fast-feet-api/commit/f5a8d582706f7e9d5a17796d70f3c3afd5dafab0))

# [1.35.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.34.0...v1.35.0) (2026-04-18)


### Bug Fixes

* **ci:** add dedicated schema push step and skip it in globalSetup ([077a25a](https://github.com/viniciusferreira7/fast-feet-api/commit/077a25a0a08c803ab89fad416e58924116afa90f))
* **ci:** add missing DATABASE_* vars to Push database schema step ([204bacc](https://github.com/viniciusferreira7/fast-feet-api/commit/204bacc38b233a7acd56cb37075d4bad49ce28c8))
* **ci:** add NODE_ENV=test to Push database schema step ([ce2a2dd](https://github.com/viniciusferreira7/fast-feet-api/commit/ce2a2dd245384e42d09a516c72f112168747b73e))
* **ci:** migrate via drizzle-orm in globalSetup, fix healthcheck ([f431ff5](https://github.com/viniciusferreira7/fast-feet-api/commit/f431ff57a571eca6bbccf6a30dbe2471c027099a))
* **ci:** use db:migrate instead of db:push:force for clean CI database ([6aa864d](https://github.com/viniciusferreira7/fast-feet-api/commit/6aa864daf50b907aff450e59b2298e552524bd94))
* **ci:** use hardcoded test DB credentials and explicit DATABASE_URL ([f08d4a8](https://github.com/viniciusferreira7/fast-feet-api/commit/f08d4a86568a888ff282a94a5251d1300f986fc0))
* **migrations:** squash 0001 into 0000 removing redundant unique constraint ([ca29e5c](https://github.com/viniciusferreira7/fast-feet-api/commit/ca29e5c9067161021054d4ce694b1e0759868647))
* **repository:** save entity id on register and fix null safety in find methods ([c2d67f7](https://github.com/viniciusferreira7/fast-feet-api/commit/c2d67f755ebd56b1b2c4c15f13ffd53876acfbf7))
* **schema:** remove redundant unique constraint on email_codes primary key ([6ccec99](https://github.com/viniciusferreira7/fast-feet-api/commit/6ccec99c748910733ccf16a2fce5949cbdd94de0))
* **test:** build CI connection string from parts using port 5432 ([61e866b](https://github.com/viniciusferreira7/fast-feet-api/commit/61e866b055a9cbdc39d030cc29895c965d643491))
* **test:** correct envs ([98c9b7f](https://github.com/viniciusferreira7/fast-feet-api/commit/98c9b7f54b630f87fa00b1ac31d7fc6c31c74f46))
* **test:** disable file parallelism to prevent inter-worker TRUNCATE race ([669c623](https://github.com/viniciusferreira7/fast-feet-api/commit/669c6234b3cdababa86de1fe7f2a504af91cb240))
* **test:** move db:push:force to globalSetup and respect CI env vars ([417e860](https://github.com/viniciusferreira7/fast-feet-api/commit/417e86084cb41ebb0582d7e98a30d12ef1b7bd18))
* **test:** restore migrate() for CI — drizzle-kit push:force always fails in CI ([56f48be](https://github.com/viniciusferreira7/fast-feet-api/commit/56f48be836d42469b99aab25b96737e58c4c08c9))
* **tests:** construct CI connection string from individual credentials ([3eca334](https://github.com/viniciusferreira7/fast-feet-api/commit/3eca3340990513ea70683aca4ef8668831daa729))
* **test:** use push:force locally and migrate() in CI in globalSetup ([c060149](https://github.com/viniciusferreira7/fast-feet-api/commit/c06014985a8ca3b9297adbc4f883c37feca9b4e8))


### Features

* **database:** register AdminPeopleRepository token in DatabaseModule ([44b8037](https://github.com/viniciusferreira7/fast-feet-api/commit/44b803745f046ed7e89199f73cd420b7e726ae2f))
* **entity:** add restore static factory to EmailVerification ([40b94f5](https://github.com/viniciusferreira7/fast-feet-api/commit/40b94f5a05fdbe1365b4360eb0a8c8f9644c1909))
* **logger:** export pino instance and replace console.log in main bootstrap ([f432973](https://github.com/viniciusferreira7/fast-feet-api/commit/f4329738bb8067fb08460ed28320ea58f235a04c))
* **mappers:** create drizzle admin person mapper ([8f63822](https://github.com/viniciusferreira7/fast-feet-api/commit/8f638229c51dd27c11aac1f42b641af6df2f9d80))
* **migrations:** create first migration using drizzle ORM ([7e4362a](https://github.com/viniciusferreira7/fast-feet-api/commit/7e4362a347fff748d6149d5ca5e1f8c151f5a888))
* **repositories:** create drizzle admin people repository ([7809b72](https://github.com/viniciusferreira7/fast-feet-api/commit/7809b727972bfb330bb4402201b8229d6eaef428))

# [1.34.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.33.0...v1.34.0) (2026-04-16)


### Bug Fixes

* **schema:** add emailCode foreign key reference to users table ([b4a8eb0](https://github.com/viniciusferreira7/fast-feet-api/commit/b4a8eb030fd75abe65d3b6098e3d819edd860741))
* **schema:** add packageStatusEnum, make deliveryPersonId nullable, add indexes in packages ([b4909dc](https://github.com/viniciusferreira7/fast-feet-api/commit/b4909dc42b9f8ffc24ec9690985d0812256a6564))
* **schema:** align package-histories with domain entity, use packageStatusEnum and add indexes ([d8f3dd5](https://github.com/viniciusferreira7/fast-feet-api/commit/d8f3dd567dcd3ec6e28c91fee9271b77697ec51f))
* **schema:** correct content column name typo and add recipient indexes in notifications ([0f274a3](https://github.com/viniciusferreira7/fast-feet-api/commit/0f274a32374dd1a132daac8ea7bea3061ea035af))
* **schema:** correct url column name, enforce title not null, remove circular FK in attachments ([bcaa31e](https://github.com/viniciusferreira7/fast-feet-api/commit/bcaa31ef6a42c4baa6d3ef806964b425d5cea870))
* **schema:** move isActive from recipient-profiles to new delivery-profiles table ([3f55cec](https://github.com/viniciusferreira7/fast-feet-api/commit/3f55cec63ebd5384fd75dbb10ef68a113266a875))
* **schema:** replace updatedAt with validatedAt to align email-codes with EmailVerification entity ([a991d26](https://github.com/viniciusferreira7/fast-feet-api/commit/a991d26dccca237fb25fb649d259bae2bab8e2b0))
* **tracer:** correct options of node sdk ([3805e1f](https://github.com/viniciusferreira7/fast-feet-api/commit/3805e1f66791082db029ca225ec7f1579fbfb98e))


### Features

* create attachments table ([a240a48](https://github.com/viniciusferreira7/fast-feet-api/commit/a240a48675ec21bed5232bc1b6e713e3e8f32695))
* create email codes table ([5b134ce](https://github.com/viniciusferreira7/fast-feet-api/commit/5b134cedff5d291d669ecfacd157c420a4bacbad))
* create recipient profiles and users table ([cdcaefc](https://github.com/viniciusferreira7/fast-feet-api/commit/cdcaefc8e354ec0912f8acabb6d6eec9d8e522e4))
* otel setup file on project ([4ef4297](https://github.com/viniciusferreira7/fast-feet-api/commit/4ef4297b2a2f0da1409d495093d63672c27e608f))

# [1.33.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.32.0...v1.33.0) (2026-04-08)


### Features

* **db:** implement drizzle service and configure drizzle-kit ([1cf1088](https://github.com/viniciusferreira7/fast-feet-api/commit/1cf10880169e4a6120f453e0fbb21674caaf3aa3))
* **db:** setup drizzle orm with postgres ([3a756d3](https://github.com/viniciusferreira7/fast-feet-api/commit/3a756d3c3e4308e81723d7cd9040ddef8c9cc578))

# [1.32.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.31.0...v1.32.0) (2026-04-07)


### Features

* **infra:** implement r2 storage to upload files ([0b9df6b](https://github.com/viniciusferreira7/fast-feet-api/commit/0b9df6b894c2b52d1dce625392724d1937b6ff1e))

# [1.31.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.30.0...v1.31.0) (2026-04-05)


### Features

* add logic to do retries only in transactional error ([9e5fbe6](https://github.com/viniciusferreira7/fast-feet-api/commit/9e5fbe69c33f096e70955738362465cbe99a8917))

# [1.30.0](https://github.com/viniciusferreira7/fast-feet-api/compare/v1.29.0...v1.30.0) (2026-04-03)


### Bug Fixes

* correct use case to register package ([b6e9787](https://github.com/viniciusferreira7/fast-feet-api/commit/b6e9787192009e34f9570859fa74479a3e75ab0c))
* **postal-code:** fix URL construction and handle viacep erro field ([060d80a](https://github.com/viniciusferreira7/fast-feet-api/commit/060d80a58529e1765624907631e447a0284ce332))


### Features

* add HttpClient abstraction and fix Either-based validator mocks in tests ([2e80a21](https://github.com/viniciusferreira7/fast-feet-api/commit/2e80a21e7f58040dd9de61dc7d05b2327b5a0330))
* **env:** require JSON_PLACEHOLDER_URL and HTTPBIN_URL in test environment ([7886978](https://github.com/viniciusferreira7/fast-feet-api/commit/7886978af2a45e07f63853ed9324e50fff56603d))
* **http:** add retry support and proper error handling to FetchHttpClient ([8517d59](https://github.com/viniciusferreira7/fast-feet-api/commit/8517d59f8273514cead6f1e8c3716ccfd739e88a))

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
