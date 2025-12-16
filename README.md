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

# Build
pnpm run build              # Build the application

# Production
pnpm run start:prod         # Run production build

# Code Quality
pnpm run check              # Run Biome checks
pnpm run check:fix          # Fix Biome issues automatically
pnpm run lint               # Run Biome linter
pnpm run format             # Format code with Biome
pnpm run check:type         # TypeScript type checking

# Testing
pnpm run test               # Run unit tests
pnpm run test:watch         # Run tests in watch mode
pnpm run test:cov           # Run tests with coverage
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

## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-Based Access Control (RBAC)
- Two user roles: Admin and Delivery Person
- Login with CPF and password

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

The project includes comprehensive testing:

- **Unit Tests**: Testing individual components and services
- **E2E Tests**: Testing complete user flows
- **Coverage Reports**: Track code coverage metrics

## 📄 License

UNLICENSED - This is a course challenge project.

## 👤 Author

Built as part of a portfolio project based on a course challenge.
