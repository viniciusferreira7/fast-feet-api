# 📦 FastFeet API

## 🚀 Application Features

* [X] Two types of users: delivery person and admin
* [X] Login with CPF and password
* [X] CRUD for delivery persons
* [ ] CRUD for packages
* [X] CRUD for recipients
* [X] Mark package as **waiting** (available for pickup)
* [ ] Pick up a package
* [ ] Mark package as **delivered**
* [ ] Mark package as **returned**
* [X] List packages near the delivery person's location
* [X] Change a user's password
* [ ] List a user's deliveries
* [ ] Notify the recipient on each status change

---

## ⚖️ Business Rules

* [ ] Only admins can perform CRUD operations on packages
* [X] Only admins can perform CRUD operations on delivery persons
* [X] Only admins can perform CRUD operations on recipients
* [ ] Delivered packages must have a **mandatory photo**
* [ ] Only the delivery person who picked up the package can mark it as delivered
* [ ] Only admins can change a user's password
* [ ] Delivery persons cannot list deliveries from other delivery persons

---

## 🧠 Practiced Concepts

* [ ] Domain-Driven Design (DDD), Domain Events and Clean Architecture
* [ ] Authentication and authorization with RBAC
* [ ] Unit and end-to-end (E2E) tests
* [ ] Integration with external services (e.g., notifications)