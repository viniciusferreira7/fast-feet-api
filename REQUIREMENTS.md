# 📦 FastFeet API

## 🚀 Application Features

- [x] Two types of users: delivery person and admin
- [x] Login with CPF and password
- [x] CRUD for delivery persons
- [X] CRUD for packages
- [x] CRUD for recipients
- [x] Mark package as **waiting** (available for pickup)
- [x] Mark package as **delivered**
- [X] Mark package as **returned**
- [x] List packages near the delivery person's location
- [x] Change a user's password
- [x] List a user's deliveries
- [X] Notify the recipient on each status change

---

## ⚖️ Business Rules

- [X] Only admins can perform CRUD operations on packages
- [x] Only admins can perform CRUD operations on delivery persons
- [x] Only admins can perform CRUD operations on recipients
- [X] Delivered packages must have a **mandatory photo**
- [X] Only the delivery person who picked up the package can mark it as delivered
- [x] Only admins can change a user's password
- [x] Delivery persons cannot list deliveries from other delivery persons

---

## 🧠 Practiced Concepts

- [X] Domain-Driven Design (DDD), Domain Events and Clean Architecture
- [X] Authentication and authorization with RBAC
- [X] Unit and end-to-end (E2E) tests
- [X] Integration with external services (e.g., notifications)