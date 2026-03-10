# 📦 FastFeet API

## 🚀 Application Features

- [x] Two types of users: delivery person and admin
- [x] Login with CPF and password
- [x] CRUD for delivery persons
- [ ] CRUD for packages
- [x] CRUD for recipients
- [x] Mark package as **waiting** (available for pickup)
- [x] Mark package as **delivered**
- [ ] Mark package as **returned**
- [x] List packages near the delivery person's location
- [x] Change a user's password
- [x] List a user's deliveries
- [ ] Notify the recipient on each status change

---

## ⚖️ Business Rules

- [ ] Only admins can perform CRUD operations on packages
- [x] Only admins can perform CRUD operations on delivery persons
- [x] Only admins can perform CRUD operations on recipients
- [ ] Delivered packages must have a **mandatory photo**
- [ ] Only the delivery person who picked up the package can mark it as delivered
- [x] Only admins can change a user's password
- [x] Delivery persons cannot list deliveries from other delivery persons

---

## 🧠 Practiced Concepts

- [ ] Domain-Driven Design (DDD), Domain Events and Clean Architecture
- [ ] Authentication and authorization with RBAC
- [ ] Unit and end-to-end (E2E) tests
- [ ] Integration with external services (e.g., notifications)
