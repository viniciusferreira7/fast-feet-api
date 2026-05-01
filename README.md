# 📦 FastFeet API

> ⚠️ **Work In Progress** - This project is currently under active development.

A robust package delivery management system built with NestJS, following Domain-Driven Design (DDD) and Clean Architecture principles.

## 📋 Overview

FastFeet API is a backend application for managing package deliveries, supporting two types of users: delivery persons and administrators. The system handles the complete delivery lifecycle from package creation to final delivery or return.

For detailed requirements and features, see [REQUIREMENTS.md](./REQUIREMENTS.md).

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) v11
- **Runtime**: Node.js 20
- **Package Manager**: pnpm v10.25.0
- **HTTP Server**: Fastify
- **Language**: TypeScript
- **ORM**: Drizzle ORM (PostgreSQL)
- **Password Hashing**: Argon2 (via argon2 package)
- **Email**: Resend API
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Logging**: Pino with `pino-pretty` (dev) and `pino-opentelemetry-transport` (OTLP)
- **Observability**: OpenTelemetry (traces, metrics, logs via OTLP) — exported to a [Grafana LGTM stack](https://github.com/viniciusferreira7/observability) (Loki, Grafana, Tempo, Mimir)
- **Schema Validation**: Zod (environment variables)
- **Code Quality**: Biome (linting & formatting)
- **Testing**: Vitest
- **Containerization**: Docker (multi-arch support)
- **CI/CD**: GitHub Actions
- **Semantic Release**: Automated versioning and changelog

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 10.25.0 or higher
- Docker and Docker Compose (for local database)

### Installation

```bash
# Install dependencies
pnpm install

# Start PostgreSQL database
pnpm run prestart:dev

# Start development server
pnpm run start:dev
```

## 📜 Available Scripts

```bash
# Development
pnpm run start:dev          # Start in watch mode
pnpm run start:debug        # Start with debugger
pnpm run prestart:dev       # Start PostgreSQL database

# Build
pnpm run build              # Build the application

# Production
pnpm run start:prod         # Run production build

# Docker
pnpm run docker:build       # Build Docker image with git commit tag
pnpm run docker:build:prod  # Build production Docker image

# Code Quality
pnpm run check              # Run Biome checks
pnpm run check:fix          # Fix Biome issues automatically
pnpm run lint               # Run Biome linter
pnpm run format             # Format code with Biome
pnpm run check:type         # TypeScript type checking
pnpm run verify             # Pull, test, format, and type-check (pre-commit)

# Testing
pnpm run test               # Run unit tests
pnpm run test:watch         # Run tests in watch mode
pnpm run test:cov           # Run tests with coverage
pnpm run test:debug         # Run tests with debugger
pnpm run test:e2e           # Run E2E tests
pnpm run test:e2e:watch     # Run E2E tests in watch mode
```

## 🐳 Docker

### Build

```bash
# Build production image
docker build -t fast-feet-api:latest .

# Build for specific architecture
docker build --platform linux/amd64 -t fast-feet-api:amd64 .
docker build --platform linux/arm64 -t fast-feet-api:arm64 .
```

### Run

```bash
# Run container
docker run -p 3333:3333 fast-feet-api:latest
```

The application will be available at `http://localhost:3333`.

## 🏗️ Architecture

The project follows:

- **Domain-Driven Design (DDD)**: Organized around business domains
- **Clean Architecture**: Separation of concerns with clear boundaries
- **Domain Events**: Event-driven communication between aggregates
- **RBAC**: Role-Based Access Control for authorization

### Project Structure

```
src/
├── core/                           # Core building blocks
│   ├── entities/                   # Base entity and aggregate root classes
│   │   ├── aggregate-root.ts      # Base class for aggregates
│   │   ├── entity.ts              # Base entity class
│   │   └── value-object/          # Value object base classes
│   │       ├── pagination.ts      # Pagination value object
│   │       ├── unique-entity-id.ts
│   │       └── value-object.ts
│   ├── events/                     # Domain events infrastructure
│   │   ├── domain-event.ts        # Domain event interface
│   │   ├── domain-events.ts       # Domain events dispatcher
│   │   └── event-handler.ts       # Event handler interface
│   ├── repositories/               # Core repository abstractions
│   │   └── pagination-params.ts
│   ├── watched-list.ts            # Watched list for tracking collection changes
│   ├── either.ts                  # Either monad for functional error handling
│   ├── errors/                     # Core error classes
│   └── types/                      # Core type definitions
│
├── domain/                         # Domain layer
│   ├── delivery/                   # Delivery context (bounded context)
│   │   ├── enterprise/             # Enterprise business rules
│   │   │   ├── entities/           # Domain entities and value objects
│   │   │   │   ├── admin-person.ts
│   │   │   │   ├── delivery-person.ts
│   │   │   │   ├── recipient-person.ts
│   │   │   │   ├── email-verification.ts
│   │   │   │   ├── package.ts
│   │   │   │   ├── package-history.ts
│   │   │   │   ├── attachments.ts
│   │   │   │   ├── package-attachment.ts
│   │   │   │   └── value-object/   # Value objects
│   │   │   │       ├── cpf.ts
│   │   │   │       ├── verification-code.ts
│   │   │   │       ├── package-code.ts
│   │   │   │       ├── package-status.ts
│   │   │   │       ├── postal-code.ts
│   │   │   │       └── package-history-list.ts
│   │   │   └── events/             # Domain events
│   │   │       ├── package-registered-event.ts
│   │   │       ├── package-assigned-to-a-delivery-person-event.ts
│   │   │       ├── package-picked-up-event.ts
│   │   │       ├── package-at-distribution-center-event.ts
│   │   │       ├── package-is-in-transit-event.ts
│   │   │       ├── package-is-out-for-delivery-event.ts
│   │   │       ├── package-was-delivered-event.ts
│   │   │       ├── package-failed-delivery-event.ts
│   │   │       ├── package-returned-event.ts
│   │   │       ├── package-was-updated-event.ts
│   │   │       └── package-canceled-event.ts
│   │   ├── application/            # Application business rules
│   │   │   ├── use-cases/          # Use cases (application services)
│   │   │   │   ├── # Authentication & Registration
│   │   │   │   ├── register-admin-person.ts
│   │   │   │   ├── register-delivery-person.ts
│   │   │   │   ├── register-recipient-person.ts
│   │   │   │   ├── authenticate-admin-person.ts
│   │   │   │   ├── authenticate-delivery-person.ts
│   │   │   │   ├── authenticate-recipient-person.ts
│   │   │   │   ├── # Email Verification
│   │   │   │   ├── send-admin-person-code.ts
│   │   │   │   ├── send-delivery-person-code.ts
│   │   │   │   ├── send-recipient-person-code.ts
│   │   │   │   ├── validate-admin-person-code.ts
│   │   │   │   ├── validate-delivery-person-code.ts
│   │   │   │   ├── validate-recipient-person-code.ts
│   │   │   │   ├── # Password Management
│   │   │   │   ├── reset-admin-person-password.ts
│   │   │   │   ├── reset-delivery-person-password.ts
│   │   │   │   ├── reset-recipient-person-password.ts
│   │   │   │   ├── # Person Management
│   │   │   │   ├── update-admin-person.ts
│   │   │   │   ├── update-delivery-person.ts
│   │   │   │   ├── update-recipient-person.ts
│   │   │   │   ├── get-by-id-admin-person.ts
│   │   │   │   ├── get-by-id-delivery-person.ts
│   │   │   │   ├── get-by-id-recipient-person.ts
│   │   │   │   ├── fetch-many-delivery-person.ts
│   │   │   │   ├── delete-delivery-person.ts
│   │   │   │   ├── # Package Management
│   │   │   │   ├── register-package.ts
│   │   │   │   ├── update-package.ts
│   │   │   │   ├── get-package-by-id.ts
│   │   │   │   ├── get-package-by-code.ts
│   │   │   │   ├── fetch-many-packages.ts
│   │   │   │   ├── fetch-packages-near-by-delivery-person.ts
│   │   │   │   ├── assign-package-to-a-delivery-person.ts
│   │   │   │   ├── picked-up-package.ts
│   │   │   │   ├── drop-off-package-at-distribution-center.ts
│   │   │   │   ├── package-is-in-transit.ts
│   │   │   │   ├── package-is-out-for-delivery.ts
│   │   │   │   ├── package-was-delivered.ts
│   │   │   │   ├── package-failed-delivery.ts
│   │   │   │   ├── return-package.ts
│   │   │   │   ├── cancel-package.ts
│   │   │   │   ├── # Attachments
│   │   │   │   ├── upload-and-create-attachment.ts
│   │   │   │   ├── # Package History
│   │   │   │   ├── register-package-history.ts
│   │   │   │   └── errors/         # Use case errors
│   │   │   │       ├── person-already-exists-error.ts
│   │   │   │       ├── wrong-credentials-error.ts
│   │   │   │       ├── email-code-has-not-been-verified-error.ts
│   │   │   │       ├── time-to-send-new-email-code-error.ts
│   │   │   │       ├── resource-not-found-error.ts
│   │   │   │       ├── email-already-in-use-error.ts
│   │   │   │       ├── same-email-error.ts
│   │   │   │       ├── same-password-error.ts
│   │   │   │       ├── only-admin-can-perform-this-action-error.ts
│   │   │   │       ├── delivery-person-profile-is-disable-error.ts
│   │   │   │       ├── delivery-person-not-assigned-to-package-error.ts
│   │   │   │       ├── cannot-disable-delivery-person-with-active-packages-error.ts
│   │   │   │       ├── package-already-assigned-error.ts
│   │   │   │       ├── package-already-canceled-error.ts
│   │   │   │       ├── package-not-assigned-to-delivery-person-error.ts
│   │   │   │       ├── delivery-without-required-photo.ts
│   │   │   │       └── invalid-attachment-type-error.ts
│   │   │   ├── repositories/       # Repository interfaces
│   │   │   │   ├── admin-people-repository.ts
│   │   │   │   ├── delivery-people-repository.ts
│   │   │   │   ├── recipient-people-repository.ts
│   │   │   │   ├── packages-repository.ts
│   │   │   │   ├── packages-history-repository.ts
│   │   │   │   ├── attachments-repository.ts
│   │   │   │   ├── package-attachments-repository.ts
│   │   │   │   └── email-verifications-repository.ts
│   │   │   ├── email/              # Email service interfaces
│   │   │   │   └── email-sender.ts
│   │   │   ├── cryptography/       # Cryptography interfaces
│   │   │   │   ├── hash-generator.ts
│   │   │   │   ├── hash-comparer.ts
│   │   │   │   └── encrypter.ts
│   │   │   ├── storage/            # Storage interfaces
│   │   │   │   └── uploader.ts
│   │   │   └── validation/         # Validation interfaces
│   │   │       ├── cpf-validator.ts
│   │   │       ├── password-validator.ts
│   │   │       └── postal-code-validator.ts
│   │   └── errors/                 # Domain-specific errors
│   │       ├── invalidate-cpf-error.ts
│   │       ├── external-cpf-validation-error.ts
│   │       ├── invalidate-package-code-error.ts
│   │       ├── invalidate-package-status-error.ts
│   │       ├── invalid-postal-code-error.ts
│   │       ├── external-postal-code-validation-error.ts
│   │       ├── external-password-validation-error.ts
│   │       ├── email-code-expired-error.ts
│   │       ├── invalid-email-code-error.ts
│   │       ├── delivery-person-already-disabled-error.ts
│   │       └── missing-attachment-error.ts
│   │
│   └── notification/               # Notification context (bounded context)
│       ├── enterprise/             # Enterprise business rules
│       │   └── entities/           # Domain entities
│       │       └── notification.ts
│       ├── application/            # Application business rules
│       │   ├── repositories/
│       │   │   └── notifications-repository.ts
│       │   └── use-cases/          # Use cases
│       │       ├── send-notification.ts
│       │       ├── fetch-many-notifications.ts
│       │       ├── mark-as-read-notification.ts
│       │       └── mark-many-notifications-as-read.ts
│       └── subscribers/            # Event subscribers (cross-boundary communication)
│           ├── on-package-registered-send-notification.ts
│           ├── on-package-assigned-send-notification.ts
│           ├── on-package-picked-up-send-notification.ts
│           ├── on-package-is-at-a-distribution-center-send-notification.ts
│           ├── on-package-is-in-transit-send-notification.ts
│           ├── on-package-was-delivered-send-notification.ts
│           ├── on-package-failed-delivery-send-notification.ts
│           ├── on-package-was-updated-send-notification.ts
│           └── on-package-canceled-send-notification.ts
│
└── infra/                          # Infrastructure layer
    ├── auth/                       # Authentication module
    │   ├── auth.module.ts
    │   ├── current-user.decorator.ts
    │   ├── jwt-auth.guard.ts
    │   ├── jwt.strategy.ts
    │   └── public.ts
    ├── cryptography/               # Cryptography implementations
    │   ├── argon-hasher.ts        # Argon2 password hashing
    │   ├── argon-hasher.int-spec.ts
    │   ├── jwt-encrypter.ts       # JWT encryption
    │   ├── jwt-encrypter.int-spec.ts
    │   └── cryptography.module.ts
    ├── database/                   # Database module
    │   ├── database.module.ts
    │   └── drizzle/               # Drizzle ORM
    │       ├── drizzle.service.ts # Connection pool + query logger
    │       ├── drizzle.service.int-spec.ts
    │       ├── mappers/           # Domain ↔ persistence mappers
    │       ├── repositories/      # Drizzle repository implementations
    │       │   ├── drizzle-admin-people-repository.ts
    │       │   ├── drizzle-delivery-people-repository.ts
    │       │   ├── drizzle-recipient-people-repository.ts
    │       │   ├── drizzle-email-verifications-repository.ts
    │       │   ├── drizzle-packages-repository.ts
    │       │   ├── drizzle-packages-history-repository.ts
    │       │   ├── drizzle-package-attachments-repository.ts
    │       │   ├── drizzle-attachments-repository.ts
    │       │   └── drizzle-notifications-repository.ts
    │       └── schema/            # Table definitions
    │           ├── index.ts
    │           ├── users.ts
    │           ├── delivery-profiles.ts
    │           ├── recipient-profiles.ts
    │           ├── email-codes.ts
    │           ├── packages.ts
    │           ├── package-histories.ts
    │           ├── attachments.ts
    │           └── notifications.ts
    ├── email/                      # Email module (Resend)
    │   ├── build-email-html.ts
    │   ├── email.service.ts
    │   ├── email.service.int-spec.ts
    │   └── email.module.ts
    ├── env/                        # Environment configuration
    │   ├── env.ts                 # Zod schema for all env vars
    │   ├── env.service.ts
    │   ├── env.service.int-spec.ts
    │   └── env.module.ts
    ├── http/                       # HTTP client module
    │   ├── fetch-http-client.ts   # Fetch-based HTTP client
    │   ├── fetch-http-client.int-spec.ts
    │   └── http.module.ts
    ├── interfaces/                 # Shared response interfaces
    │   └── postal-code-external-service-response.ts
    ├── filters/                    # Global NestJS filters
    │   └── all-exceptions.filter.ts
    ├── storage/                    # File storage module (Cloudflare R2)
    │   ├── r2-storage.ts
    │   ├── r2-storage.int-spec.ts
    │   └── storage.module.ts
    ├── validation/                 # External validation services
    │   ├── password.service.ts    # External password strength validation
    │   ├── password.service.int-spec.ts
    │   ├── postal-code.service.ts # External CEP validation
    │   ├── postal-code.service.int-spec.ts
    │   └── validation.module.ts
    ├── logger.ts                   # Pino logger (pretty + OTLP transports)
    ├── tracer.ts                   # OpenTelemetry SDK setup
    ├── app.module.ts
    └── main.ts
```

### Domain Model

#### Entities

- **AdminPerson**: System administrator with full access
  - Manages delivery persons, packages, and recipients
  - Can change user passwords

- **DeliveryPerson**: Delivery personnel
  - Can pick up and deliver packages
  - Can view assigned packages
  - Location-based package filtering

- **RecipientPerson**: Package recipient
  - Registered in the system to receive packages
  - Associated with delivery addresses
  - Can track their packages

- **Package**: Delivery package with complete lifecycle
  - Unique ULID-based tracking code
  - Status management with state transitions
  - Assignment to delivery person
  - Photo attachment for delivery proof
  - Audit trail with timestamps
  - Collection of history entries for tracking changes

- **PackageHistory**: Immutable audit log entry for package status changes
  - Tracks status transitions (from/to)
  - Records author and delivery person
  - Includes descriptive notes
  - Timestamp of the change
  - Implements domain events for event-driven architecture

- **PackageAttachment**: Photo proof of delivery
- **Attachments**: File attachments management

- **Notification**: System notifications for recipients
  - Sent when package events occur
  - Tracks read/unread status
  - Associated with recipient

- **EmailVerification**: Email verification management for user authentication
  - Generates unique 8-digit verification codes
  - 5-minute expiration window for security
  - Tracks validation status (validated/pending)
  - Immutable verification tracking

#### Value Objects

- **CPF**: Brazilian tax ID validation
  - Format validation (11 digits)
  - Check digit verification
  - Duplicate digit rejection
  - External CPF validation through CpfValidator interface
  - Returns `Either<Error, CPF>` for functional error handling

- **PackageCode**: ULID-based unique identifier
  - Lexicographically sortable
  - Timestamp-based generation
  - Case-insensitive normalization
  - Future timestamp validation

- **PackageStatus**: Package lifecycle state management
  - **Valid States**:
    - `pending` → Initial state
    - `awaiting_pickup` → Ready for pickup
    - `picked_up` → Assigned to delivery person
    - `at_distribution_center` → At distribution center
    - `in_transit` → On the way
    - `out_for_delivery` → Out for final delivery
    - `delivered` → Successfully delivered (final)
    - `failed_delivery` → Delivery failed
    - `returned` → Returned to sender (final)
    - `canceled` → Canceled (final)

  - **State Transitions**: Enforced valid transitions between states
  - **Final States**: `delivered`, `returned`, `canceled` (no transitions allowed)

- **PostalCode**: Brazilian postal code (CEP) validation
  - Format validation (8 digits with optional hyphen: 12345-678 or 12345678)
  - Regex-based pattern matching
  - External postal code validation through PostalCodeValidator interface
  - Returns `Either<Error, PostalCode>` for functional error handling

- **PackageHistoryList**: Collection of package history entries
  - Extends WatchedList for tracking changes
  - Detects new, removed, and current history entries
  - Enables domain event dispatching for new entries

- **VerificationCode**: 8-digit email verification code value object
  - Auto-generated using cryptographically secure random integers
  - Format validation (exactly 8 digits)
  - Lexicographically comparable
  - Leading zero preservation

### Domain Events & Subscribers

The application uses domain events for cross-bounded-context communication:

#### Events

- **PackageRegisteredEvent**: Dispatched when a package is registered
- **PackageAssignedToADeliveryPersonEvent**: Dispatched when a package is assigned to a delivery person
- **PackagePickedUpEvent**: Dispatched when a delivery person picks up a package
- **PackageAtDistributionCenterEvent**: Dispatched when a package arrives at a distribution center
- **PackageIsInTransitEvent**: Dispatched when a package is in transit
- **PackageIsOutForDeliveryEvent**: Dispatched when a package is out for delivery
- **PackageWasDeliveredEvent**: Dispatched when a package is successfully delivered
- **PackageFailedDeliveryEvent**: Dispatched when a delivery attempt fails
- **PackageReturnedEvent**: Dispatched when a package is returned to sender
- **PackageWasUpdatedEvent**: Dispatched when package details are updated
- **PackageCanceledEvent**: Dispatched when a package is canceled

#### Subscribers

- **OnPackageRegisteredSendNotification**: Listens to `PackageRegisteredEvent`
- **OnPackageAssignedToADeliveryPersonSendNotification**: Listens to `PackageAssignedToADeliveryPersonEvent`
- **OnPackagePickedUpSendNotification**: Listens to `PackagePickedUpEvent`
- **OnPackageIsAtADistributionCenterSendNotification**: Listens to `PackageAtDistributionCenterEvent`
- **OnPackageIsInTransitSendNotification**: Listens to `PackageIsInTransitEvent`
- **OnPackageWasDeliveredSendNotification**: Listens to `PackageWasDeliveredEvent`
- **OnPackageFailedDeliverySendNotification**: Listens to `PackageFailedDeliveryEvent`
- **OnPackageWasUpdatedSendNotification**: Listens to `PackageWasUpdatedEvent`
- **OnPackageCanceledSendNotification**: Listens to `PackageCanceledEvent`

### Package History

Package history is **automatically created** by the Package entity when state changes occur:

- **Automatic Creation**: No manual use case calls needed
  - `package.updateStatus()` → Creates history entry
  - `package.assignDeliveryPerson()` → Creates history entry
  - `package.markAsRegistered()` → Creates initial history entry

- **Audit Trail**: Each history entry records:
  - From/To status transition
  - Author (who made the change)
  - Delivery person (if applicable)
  - Description of the change
  - Timestamp

- **Manual History**: `RegisterPackageHistoryUseCase` exists for administrative purposes
  - Used for manual corrections or special audit entries
  - Not used in normal package lifecycle

### Package Lifecycle Flow

```
pending
  ↓
awaiting_pickup ──────────────┐
  ↓                           │
picked_up ────────────────────┤
  ↓                           │
at_distribution_center        │
  ↓           ↕               │
in_transit ───────────────────┤ → canceled
  ↓                           │
out_for_delivery ─────────────┤
  ↓           ↓               │
delivered   failed_delivery   │
              ↓               │
            returned ─────────┘
```

## 🔐 Authentication & Authorization

- **JWT-based authentication**: Secure token-based auth
- **Role-Based Access Control (RBAC)**: Permission management
- **Three user roles**: Admin, Delivery Person, and Recipient with different permissions
- **Login with CPF and password**: Brazilian tax ID authentication
- **Password hashing**: Secure password storage using cryptography layer
- **Email verification requirement**: Users must verify their email before authentication
- **Time-limited verification codes**: 5-minute expiration window for security

### User Roles & Permissions

#### Admin
- ✅ Create, read, update, delete delivery persons
- ✅ Create, read, update, delete packages
- ✅ Create, read, update, delete recipients
- ✅ Change user passwords
- ✅ View all deliveries and packages

#### Delivery Person
- ✅ View assigned packages
- ✅ Pick up packages
- ✅ Mark packages as delivered (with photo proof)
- ✅ Mark packages as returned
- ✅ View nearby packages based on location
- ❌ Cannot view other delivery persons' packages
- ❌ Cannot modify packages not assigned to them

## 📈 Observability & Logging

The API is fully instrumented end-to-end: traces, metrics and logs all ship via **OTLP** to a [Grafana LGTM stack](https://github.com/viniciusferreira7/observability) (Loki for logs, Grafana for dashboards, Tempo for traces, Mimir for metrics). The OpenTelemetry SDK is bootstrapped in `src/infra/tracer.ts` and started before any Nest module loads.

### Logging architecture

Logger is defined in `src/infra/logger.ts` as a single Pino instance whose transports are chosen from `NODE_ENV`:

| Environment | Transports |
|---|---|
| `dev` | `pino-pretty` (colorized terminal) + `pino-opentelemetry-transport` (OTLP → Loki) |
| `test` | `pino-pretty` only (no OTLP noise during test runs) |
| `production` | `pino-opentelemetry-transport` only (structured JSON → Loki) |

The default level is `debug` in dev/test and `info` in production. Override with the `LOG_LEVEL` env variable.

### Where logs are emitted

| Layer | File | What it logs |
|---|---|---|
| Bootstrap | `src/infra/main.ts` | Startup, `unhandledRejection`, `uncaughtException`, Fastify per-request access logs (`loggerInstance`) |
| Global filter | `src/infra/filters/all-exceptions.filter.ts` | 5xx → `error`, 4xx → `warn` (method, url, status, stack) |
| Database | `src/infra/database/drizzle/drizzle.service.ts` | Pool connect/error events; SQL queries + params at `debug` (skipped in production) |
| Auth | `src/infra/auth/jwt.strategy.ts`, `jwt-auth.guard.ts` | Invalid JWT payloads, unauthorized requests |
| External services | `fetch-http-client.ts`, `email.service.ts`, `r2-storage.ts`, `postal-code.service.ts` | Retry attempts (`warn`) and final failures (`error`) |

### Running the observability stack locally

```bash
# Clone the companion repo
git clone https://github.com/viniciusferreira7/observability
cd observability

# Bring up Grafana + Loki + Tempo + Mimir + OTel Collector
docker compose up -d
```

Then set `OTLP_TRACE_EXPORT_ENDPOINT` in this project's `.env` to the collector URL exposed by that stack (e.g. `http://localhost:4318/v1/traces`). Logs are shipped through the same OTLP protocol.

## 📊 CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- **Code Quality**: Biome checks, linting, and type checking
- **Testing**: Unit and E2E tests (when enabled)
- **Semantic Release**: Automated versioning and changelog generation
- **Docker**: Multi-architecture builds (linux/amd64, linux/arm64)
- **Docker Hub**: Automated image publishing

## 📝 API Documentation

API documentation is available through Swagger/OpenAPI.

Once the server is running, access the documentation at:
```
http://localhost:3333/api/docs
```

## 🧪 Testing

The project includes three levels of testing with Vitest:

### Unit Tests (`.spec.ts`)

Test domain logic in complete isolation using in-memory repositories and fakes:

- Value object validation (CPF, PackageCode, PackageStatus, PostalCode, VerificationCode)
- Entity logic (EmailVerification expiration, validation status)
- Use case business logic (RegisterAdminPersonUseCase, RegisterDeliveryPerson, RegisterRecipientPerson, AuthenticateAdminPerson, AuthenticateDeliveryPerson, AuthenticateRecipientPerson, RegisterPackage, UpdatePackage, AssignPackageToADeliveryPersonUseCase, PickedUpPackage, DropOffPackageAtDistributionCenter, PackageIsInTransit, PackageIsOutForDelivery, PackageWasDelivered, PackageFailedDelivery, ReturnPackage, CancelPackage, FetchManyPackages, FetchPackagesNearByDeliveryPerson, ValidatePersonCode, ResetPersonPassword, UpdatePerson, DeleteDeliveryPerson, UploadAndCreateAttachment, FetchManyNotifications, MarkAsReadNotification, MarkManyNotificationsAsRead)
- Email verification requirement in authentication flow
- Domain event subscribers (OnPackageRegisteredSendNotification, OnPackageAssignedToADeliveryPersonSendNotification, OnPackagePickedUpSendNotification, OnPackageIsAtADistributionCenterSendNotification, OnPackageIsInTransitSendNotification, OnPackageWasDeliveredSendNotification, OnPackageFailedDeliverySendNotification, OnPackageWasUpdatedSendNotification, OnPackageCanceledSendNotification)
- Comprehensive test coverage with 200+ passing tests

### Integration Tests (`.int-spec.ts`)

Test infrastructure services against real external systems (database, email, storage, external APIs). Each integration test spins up a NestJS app via `makeModuleRef`:

| Test file | What it covers |
|---|---|
| `drizzle.service.int-spec.ts` | Database connection and query execution |
| `drizzle-admin-people-repository.int-spec.ts` | Admin person repository CRUD |
| `drizzle-delivery-people-repository.int-spec.ts` | Delivery person repository CRUD |
| `drizzle-recipient-people-repository.int-spec.ts` | Recipient person repository CRUD |
| `drizzle-email-verifications-repository.int-spec.ts` | Email verification repository |
| `drizzle-packages-repository.int-spec.ts` | Packages repository CRUD + filters |
| `drizzle-packages-history-repository.int-spec.ts` | Package history audit trail |
| `drizzle-attachments-repository.int-spec.ts` | Attachments repository |
| `drizzle-notifications-repository.int-spec.ts` | Notifications repository |
| `argon-hasher.int-spec.ts` | Argon2 password hashing and verification |
| `jwt-encrypter.int-spec.ts` | JWT sign and verify |
| `env.service.int-spec.ts` | Environment variable loading and validation |
| `email.service.int-spec.ts` | Resend email delivery |
| `fetch-http-client.int-spec.ts` | HTTP client (external service calls) |
| `r2-storage.int-spec.ts` | Cloudflare R2 file upload |
| `password.service.int-spec.ts` | External password strength validation |
| `postal-code.service.int-spec.ts` | ViaCEP postal code lookup |

### E2E Tests

Testing complete user flows, API endpoints, full request/response cycles, and database integration.

### Coverage Reports

Track code coverage metrics with Vitest coverage tools.

### Test Structure

```
test/
├── setup-e2e.ts            # E2E test setup
├── drop-uuid-schema.ts     # DB cleanup helper
├── cryptography/           # Fake cryptography implementations
│   ├── fake-hasher.ts
│   └── faker-encrypter.ts
├── email/
│   └── fake-email-sender.ts
├── factories/              # Test data factories
│   ├── make-admin-person.ts
│   ├── make-delivery-person.ts
│   ├── make-recipient-person.ts
│   ├── make-package.ts
│   ├── make-package-attachment.ts
│   ├── make-package-history.ts
│   ├── make-attachment.ts
│   ├── make-notification.ts
│   └── make-module-ref.ts  # NestJS app factory for integration tests
├── repositories/           # In-memory repository implementations
│   ├── in-memory-admin-people-repository.ts
│   ├── in-memory-delivery-people-repository.ts
│   ├── in-memory-recipient-people-repository.ts
│   ├── in-memory-packages-repository.ts
│   ├── in-memory-packages-history-repository.ts
│   ├── in-memory-notifications-repository.ts
│   ├── in-memory-attachments-repository.ts
│   └── in-memory-package-attachments-repository.ts
├── storage/
│   └── fake-uploader.ts
├── validation/
│   ├── fake-password-validator.ts
│   └── fake-postal-code-validator.ts
└── utils/
    ├── generate-future-ulid.ts  # ULID generator with future timestamp
    ├── wait-for.ts              # Async polling helper for domain events
    └── assets/
        └── file-to-use-on-upload.png
```

## 🗃️ Database

- **PostgreSQL**: Primary database (managed via Docker Compose)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver
- **Automatic Setup**: Run `pnpm run prestart:dev` to start PostgreSQL
- **Environment Variables**: Configure database connection in `.env` file

### Schema Tables

| Table | Description |
|---|---|
| `users` | All user accounts (Admin, DeliveryPerson, RecipientPerson) with role enum |
| `delivery_profiles` | Delivery-person-specific data (`isActive`) |
| `recipient_profiles` | Recipient-specific extension marker |
| `email_codes` | Email verification codes with `validatedAt` tracking |
| `packages` | Package lifecycle data with `packageStatusEnum` constraint |
| `package_histories` | Immutable audit log of package status transitions |
| `attachments` | Uploaded files (delivery proof photos) |
| `notifications` | Recipient notifications with read tracking |

### Required Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV="dev"  # Options: dev, test, production
CORS_ORIGIN="http://localhost:3000"

# JWT (RS256 - Public/Private Key Authentication)
# Generate keys with:
# Private: openssl genrsa -out private_key.pem 2048
# Public: openssl rsa -in private_key.pem -pubout -out public_key.pem
# Then encode to base64:
# JWT_PRIVATE_KEY=$(cat private_key.pem | base64)
# JWT_PUBLIC_KEY=$(cat public_key.pem | base64)
JWT_PRIVATE_KEY="base64-encoded-private-key"
JWT_PUBLIC_KEY="base64-encoded-public-key"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fastfeet"
DATABASE_PORT=5432
DATABASE_USERNAME="user"
DATABASE_PASSWORD="password"
DATABASE_NAME="fastfeet"

# Password hashing
ARGON2_PEPPER="random-pepper-string"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL="noreply@yourdomain.com"

# External services
POSTAL_CODE_EXTERNAL_SERVICE_URL="https://viacep.com.br/ws"

# File storage (Cloudflare R2)
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_ACCOUNT_TOKEN="your-account-token"
AWS_BUCKET_NAME="your-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRETE_ACCESS_KEY_ID="your-secret-key"

# Observability (OTLP endpoint — OpenTelemetry Collector)
# Required in dev/production, optional in test
OTLP_TRACE_EXPORT_ENDPOINT="http://localhost:4318/v1/traces"

# Logging (optional — overrides the per-environment default)
# Defaults: debug (dev/test), info (production)
LOG_LEVEL="debug"

# Test environment only
JSON_PLACEHOLDER_URL="https://jsonplaceholder.typicode.com"
HTTPBIN_URL="https://httpbin.org"
```

## 🔍 Key Features

### Implemented ✅
- Domain entities with DDD principles (AdminPerson, DeliveryPerson, RecipientPerson, Package, PackageHistory, Notification, EmailVerification)
- Value objects with validation (CPF, PackageCode, PackageStatus, PostalCode, VerificationCode)
- Package status state machine with transition rules
- User registration (Admin, Delivery Person, and Recipient)
  - Password validation with external validator interface
  - Automatic email verification creation
- User authentication use cases (Admin, Delivery Person, and Recipient)
  - JWT token generation with encryption layer
  - Password comparison with hash comparer
  - Credential validation with wrong credentials error handling
  - Email verification requirement before authentication
  - Time-limited verification codes (5-minute expiration)
- Person management use cases (update, get by ID, fetch many, delete)
  - Admin person management
  - Delivery person management (with active packages guard on delete)
  - Recipient person management
- Password reset use cases for all user types
- Package management use cases
  - Package registration with postal code validation
  - Package update
  - Package retrieval (by ID and by code)
  - Package listing with pagination and filtering
  - Location-based package filtering for delivery persons
  - Package assignment to delivery person with automatic status updates
  - Full package lifecycle: pickup → distribution center → in transit → out for delivery → delivered / failed delivery → returned
  - Package cancellation
  - Photo attachment upload for delivery proof (UploadAndCreateAttachment)
- Notification management use cases
  - Fetch many notifications (with pagination)
  - Mark notification as read
  - Mark many notifications as read
- Password hashing with cryptography layer (Argon2 via ArgoHasher)
- JWT encryption implementation (JwtEncrypter)
- Auth module with JWT strategy, guards, and decorators
- External CPF validation with dependency injection pattern
- External postal code validation with dependency injection pattern
- External password strength validation with dependency injection pattern
- File storage abstraction with Uploader interface
- Repository pattern with in-memory implementations for testing
- Domain events infrastructure for event-driven architecture
- Event subscribers for cross-boundary communication
  - Package registered notification
  - Package assigned notification
  - Package picked up notification
  - Package at distribution center notification
  - Package in transit notification
  - Package was delivered notification
  - Package failed delivery notification
  - Package was updated notification
  - Package canceled notification
- Package history tracking with automatic audit trail
  - Automatic creation on status changes
  - Automatic creation on delivery person assignment
  - Manual use case for administrative entries
- WatchedList pattern for tracking collection changes
- Notification system for recipients
- Email verification system with time-limited codes
  - 8-digit cryptographically secure verification codes
  - 5-minute expiration window
  - Validation status tracking
  - Send verification code use cases for all user types (Admin, Delivery Person, Recipient)
  - Rate limiting to prevent code spam (can't request new code until current expires)
  - Email service abstraction with EmailSender interface
- Comprehensive unit tests for domain logic (200+ passing tests)
  - Email verification expiration logic tests
  - Authentication with unverified email rejection tests
  - Verification code format validation tests
- Test data factories for easy test setup with automatic email verification
- Functional error handling with Either monad pattern

### Infrastructure ✅

- **Database**: Drizzle ORM with PostgreSQL — connection pool, schema definitions with enums, indexes, FK constraints
  - All repository implementations wired into `DatabaseModule` (admin/delivery/recipient people, email verifications, packages, packages history, package attachments, attachments, notifications)
  - Domain ↔ persistence mappers for every aggregate
  - Pool lifecycle + per-query debug logging
- **Email**: Resend integration for sending verification codes (with structured error logging)
- **File Storage**: Cloudflare R2 (S3-compatible) for delivery proof photos (with structured error logging)
- **HTTP Client**: Fetch-based client for external service calls (ViaCEP postal code lookup) with retry-attempt + final-failure logs
- **Password Validation**: External password strength validation service
- **Observability**: OpenTelemetry SDK with OTLP trace, metric and log exporters → [Grafana LGTM stack](https://github.com/viniciusferreira7/observability)
- **Logging**: Pino with env-aware transports (pretty for dev/test, OTLP for dev/prod) and a global `AllExceptionsFilter` that logs every unhandled HTTP error
- **Auth**: JWT strategy + guard with unauthorized-request warnings
- **Environment**: Zod-validated environment configuration with per-environment rules
- **Integration Tests**: 9 infrastructure + 9 repository integration test suites

### In Progress 🚧
- HTTP/REST API endpoints with NestJS controllers
- Package CRUD operations API
- Recipient management API
- Photo upload for delivery proof
- Location-based package filtering
- E2E tests

## 🤝 Contributing

This is a portfolio project, but suggestions and feedback are welcome!

### Development Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project conventions:
   - Use conventional commits (feat, fix, chore, test, refactor, docs)
   - Write unit tests for new features
   - Follow the existing code structure and patterns

3. **Run quality checks**
   ```bash
   pnpm run verify
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `chore:` Maintenance tasks
- `perf:` Performance improvements

Semantic Release automatically generates versions and changelogs based on commit messages.

## 📄 License

UNLICENSED - This is a course challenge project.

## 👤 Author

Built as part of a portfolio project based on a course challenge.

## 🙏 Acknowledgments

- Course challenge based on Rocketseat's Node.js learning path
- Built with NestJS, following DDD and Clean Architecture principles
