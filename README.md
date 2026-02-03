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
│   ├── events/                     # Domain events infrastructure
│   │   ├── domain-event.ts        # Domain event interface
│   │   └── domain-events.ts       # Domain events dispatcher
│   ├── watched-list.ts            # Watched list for tracking collection changes
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
│   │   │       └── package-assigned-to-a-delivery-person-event.ts
│   │   ├── application/            # Application business rules
│   │   │   ├── use-cases/          # Use cases (application services)
│   │   │   │   ├── register-admin-person.ts
│   │   │   │   ├── register-delivery-person.ts
│   │   │   │   ├── register-recipient-person.ts
│   │   │   │   ├── authenticate-admin-person.ts
│   │   │   │   ├── authenticate-delivery-person.ts
│   │   │   │   ├── authenticate-recipient-person.ts
│   │   │   │   ├── send-admin-person-code.ts
│   │   │   │   ├── send-delivery-person-code.ts
│   │   │   │   ├── send-recipient-person-code.ts
│   │   │   │   ├── register-package.ts
│   │   │   │   ├── assign-package-to-a-delivery-person.ts
│   │   │   │   ├── register-package-history.ts
│   │   │   │   └── errors/         # Use case errors
│   │   │   │       ├── person-already-exists-error.ts
│   │   │   │       ├── wrong-credentials-error.ts
│   │   │   │       ├── email-code-has-not-been-verified-error.ts
│   │   │   │       └── time-to-send-new-email-code-error.ts
│   │   │   ├── repositories/       # Repository interfaces
│   │   │   ├── email/              # Email service interfaces
│   │   │   │   └── email-sender.ts
│   │   │   ├── cryptography/       # Cryptography interfaces
│   │   │   └── validation/         # Validation interfaces
│   │   │       ├── cpf-validator.ts
│   │   │       ├── password-validator.ts
│   │   │       └── postal-code-validator.ts
│   │   └── errors/                 # Domain-specific errors
│   │       ├── invalid-cpf-error.ts
│   │       ├── invalidate-cpf-error.ts
│   │       ├── external-cpf-validation-error.ts
│   │       ├── external-password-validation-error.ts
│   │       ├── email-code-expired-error.ts
│   │       └── invalid-email-code-error.ts
│   │
│   └── notification/               # Notification context (bounded context)
│       ├── enterprise/             # Enterprise business rules
│       │   └── entities/           # Domain entities
│       │       └── notification.ts
│       ├── application/            # Application business rules
│       │   └── use-cases/          # Use cases
│       │       └── send-notification.ts
│       └── subscribers/            # Event subscribers (cross-boundary communication)
│           ├── on-package-registered-send-notification.ts
│           └── on-package-assigned-send-notification.ts
│
└── infra/                          # Infrastructure layer
    └── env/                        # Environment configuration
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
  - Triggers notification to recipient about new package
  - Contains package history and package ID

- **PackageAssignedToADeliveryPersonEvent**: Dispatched when a package is assigned to a delivery person
  - Triggers notification to recipient about assignment
  - Contains package history and package ID

#### Subscribers

- **OnPackageRegisteredSendNotification**: Listens to `PackageRegisteredEvent`
  - Sends notification to recipient when their package is registered
  - Cross-boundary communication between delivery and notification contexts

- **OnPackageAssignedSendNotification**: Listens to `PackageAssignedToADeliveryPersonEvent`
  - Sends notification to recipient when delivery person is assigned
  - Cross-boundary communication between delivery and notification contexts

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

The project includes comprehensive testing with Vitest:

- **Unit Tests**: Testing individual components, use cases, and domain logic
  - Value object validation (CPF, PackageCode, PackageStatus, PostalCode, VerificationCode)
  - Entity logic (EmailVerification expiration, validation status)
  - Use case business logic (RegisterAdminPerson, RegisterDeliveryPerson, RegisterRecipientPerson, AuthenticateAdminPerson, AuthenticateDeliveryPerson, AuthenticateRecipientPerson, RegisterPackage, AssignPackageToADeliveryPerson)
  - Email verification requirement in authentication flow
  - Entity behavior and state management
  - Domain event subscribers (OnPackageRegisteredSendNotification, OnPackageAssignedSendNotification)
  - In-memory repository implementations for isolated testing
  - Comprehensive test coverage with 190+ passing tests

- **E2E Tests**: Testing complete user flows and API endpoints
  - Full request/response cycles
  - Database integration
  - Authentication flows

- **Coverage Reports**: Track code coverage metrics with Vitest coverage tools

- **Test Utilities**:
  - Fake implementations (FakeHasher for password hashing, FakeEncrypter for JWT encryption, FakeCpfValidator for CPF validation, FakePostalCodeValidator for postal code validation, FakePasswordValidator for password validation, FakeEmailSender for email delivery)
  - In-memory repositories (InMemoryAdminPeopleRepository, InMemoryDeliveryPeopleRepository, InMemoryRecipientPeopleRepository, InMemoryPackagesRepository, InMemoryPackagesHistoryRepository, InMemoryNotificationsRepository)
  - Test data factories (makeAdminPerson, makeDeliveryPerson, makeRecipientPerson, makePackage, makePackageHistory, makePackageAttachment) with automatic email verification creation
  - Test data generators (CPF generator, ULID generator, verification code generator)

### Test Structure
```
test/
├── cryptography/           # Fake cryptography implementations
│   ├── fake-hasher.ts
│   └── faker-encrypter.ts
├── email/                  # Fake email implementations
│   └── fake-email-sender.ts
├── factories/              # Test data factories
│   ├── make-admin-person.ts
│   ├── make-delivery-person.ts
│   ├── make-recipient-person.ts
│   ├── make-package.ts
│   ├── make-package-attachment.ts
│   └── make-package-history.ts
├── repositories/           # In-memory repository implementations
│   ├── in-memory-admin-people-repository.ts
│   ├── in-memory-delivery-people-repository.ts
│   ├── in-memory-recipient-people-repository.ts
│   ├── in-memory-packages-repository.ts
│   ├── in-memory-packages-history-repository.ts
│   └── in-memory-notifications-repository.ts
├── validation/             # Fake validation implementations
│   ├── fake-cpf-validator.ts
│   ├── fake-password-validator.ts
│   └── fake-postal-code-validator.ts
└── utils/                  # Test utilities and helpers
```

## 🗃️ Database

- **PostgreSQL**: Primary database (managed via Docker Compose)
- **Automatic Setup**: Run `pnpm run prestart:dev` to start PostgreSQL
- **Environment Variables**: Configure database connection in `.env` file

### Required Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3333
NODE_ENV="dev"  # Options: dev, test, production

# JWT (RS256 - Public/Private Key Authentication)
# Generate keys with:
# Private: openssl genrsa -out private_key.pem 2048
# Public: openssl rsa -in private_key.pem -pubout -out public_key.pem
# Then encode to base64:
# JWT_PRIVATE_KEY=$(cat private_key.pem | base64)
# JWT_PUBLIC_KEY=$(cat public_key.pem | base64)
JWT_PRIVATE_KEY="base64-encoded-private-key"
JWT_PUBLIC_KEY="base64-encoded-public-key"

# Database (optional - for production)
DATABASE_URL="postgresql://user:password@localhost:5432/fastfeet"
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
- Package registration with postal code validation
- Package assignment to delivery person with automatic status updates
- Password hashing with cryptography layer
- External CPF validation with dependency injection pattern
- External postal code validation with dependency injection pattern
- External password strength validation with dependency injection pattern
- Repository pattern with in-memory implementations for testing
- Domain events infrastructure for event-driven architecture
- Event subscribers for cross-boundary communication
  - Package registered notification
  - Package assigned notification
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
- Comprehensive unit tests for domain logic (190 passing tests)
  - Email verification expiration logic tests
  - Authentication with unverified email rejection tests
  - Verification code format validation tests
- Test data factories for easy test setup with automatic email verification
- Functional error handling with Either monad pattern

### In Progress 🚧
- HTTP/REST API endpoints with NestJS controllers
- JWT authentication middleware and guards
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
