<div align="center">

# ⬡ Stratix BMS

### Business Management System

*A full-stack, production-ready platform for managing invoices, inventory, clients, procurement, and analytics.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br/>

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Scripts](#-scripts)

---

## 🌟 Overview

**Stratix BMS** is a PERN-stack business management system that unifies all the tools a modern business needs into one cohesive platform. From raising invoices to tracking procurement, analysing revenue trends to managing user permissions — everything is built in, beautifully designed, and production-ready.

The application features a **fully responsive UI**, **light/dark mode**, **real-time notifications**, **role-based access control**, and **PDF generation** out of the box.

---

## ✨ Features

<table>
<tr>
<td width="50%">

**📄 Invoicing**
- Auto-numbered professional invoices
- PDF generation & download
- Payment recording
- Status tracking (Draft → Issued → Paid → Overdue)

**📦 Inventory Management**
- Real-time stock tracking
- Low-stock alerts
- Bulk CSV import / export
- Full stock adjustment audit log

**👥 Client Management**
- Centralised client profiles
- Invoice history per client
- Total spend analytics
- Smart search & sort

**📊 Quotations**
- Build professional quotes
- One-click convert to invoice
- Expiry date tracking
- Status pipeline (Draft → Sent → Accepted)

</td>
<td width="50%">

**📈 Analytics & Reports**
- Revenue vs expense P&L charts
- Top products & clients
- Invoice aging buckets
- Custom date range filters

**💸 Expense Tracking**
- Log expenses by category
- CSV export with date filters
- Total spend summaries

**🚚 Suppliers & Procurement**
- Supplier profiles
- Purchase orders with status pipeline
- Auto stock update on PO receipt

**🔔 Notifications**
- Real-time in-app alerts
- Low stock & overdue invoice triggers
- Mark read / mark all read

**🛡️ Admin Panel**
- System KPIs & health overview
- User management (create, edit, activate/deactivate)
- Full audit log of all actions
- Role & permission editor

</td>
</tr>
</table>

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 14 | App framework (App Router) |
| [TypeScript](https://www.typescriptlang.org/) | 5.4 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Utility-first styling |
| [Framer Motion](https://www.framer-motion.com/) | 11 | Animations & transitions |
| [Zustand](https://zustand-demo.pmnd.rs/) | 4.5 | Global state management |
| [TanStack Query](https://tanstack.com/query) | 5 | Server state & caching |
| [Lucide React](https://lucide.dev/) | 0.395 | Icon library |
| [Recharts](https://recharts.org/) | 2.12 | Data visualisation charts |
| [React Hook Form](https://react-hook-form.com/) | 7.75 | Form handling |
| [Axios](https://axios-http.com/) | 1.7 | HTTP client |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| [Express.js](https://expressjs.com/) | 4.19 | REST API framework |
| [PostgreSQL](https://www.postgresql.org/) | 16 | Relational database |
| [node-postgres (pg)](https://node-postgres.com/) | 8.11 | PostgreSQL client |
| [Passport.js](https://www.passportjs.org/) | 0.7 | OAuth 2.0 (Google, Facebook, LinkedIn) |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9.0 | JWT access & refresh tokens |
| [speakeasy](https://github.com/speakeasyjs/speakeasy) | 2.0 | TOTP two-factor authentication |
| [PDFKit](https://pdfkit.org/) | 0.15 | Invoice PDF generation |
| [Winston](https://github.com/winstonjs/winston) | 3.13 | Structured logging |
| [Helmet](https://helmetjs.github.io/) | 7.1 | HTTP security headers |
| [Multer](https://github.com/expressjs/multer) | 1.4 | File upload handling |
| [Nodemailer](https://nodemailer.com/) | 6.9 | Transactional email |
| [node-cron](https://github.com/node-cron/node-cron) | 3.0 | Scheduled jobs (overdue checks) |

---

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** or **yarn**

### 1. Clone the repository

```bash
git clone https://github.com/your-username/stratix-bms.git
cd stratix-bms
```

### 2. Set up the Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and fill in your values
cp .env.example .env

# Run database migrations
npm run migrate

# (Optional) Seed with demo data
npm run seed

# Start the development server
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3. Set up the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env.local

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Default Admin Credentials (after seeding)

```
Email:    admin@stratix.com
Password: Admin@123
```

> ⚠️ Change these immediately in a production environment.

---
## 📡 API Reference

All endpoints are prefixed with `/api/v1`. Protected routes require a valid `Authorization: Bearer <token>` header.

| Module | Base Path | Key Operations |
|---|---|---|
| **Auth** | `/auth` | Login, register, refresh, logout, forgot/reset password, 2FA setup & verify, OAuth |
| **Products** | `/products` | CRUD, categories, bulk CSV import, image upload, stock filtering |
| **Clients** | `/clients` | CRUD, detail view with invoice history & total spend |
| **Invoices** | `/invoices` | CRUD, PDF download, payment recording, status updates |
| **Quotations** | `/quotations` | CRUD, convert to invoice |
| **Expenses** | `/expenses` | CRUD, categories, CSV export, date-range filtering |
| **Suppliers** | `/suppliers` | CRUD, detail view |
| **Purchase Orders** | `/purchase-orders` | CRUD, status pipeline, auto stock update on receipt |
| **Stock Adjustments** | `/stock-adjustments` | Create adjustments, audit history |
| **Payments** | `/payments` | Record & list payments per invoice |
| **Analytics** | `/analytics` | Revenue overview, top products, invoice aging, stock summary |
| **Notifications** | `/notifications` | List, mark read, mark all read |
| **Settings** | `/settings` | Get & update company/invoice/security/notification settings |
| **Admin** | `/admin` | System stats, user management, audit log, permissions |

---

## 🔐 Security

Stratix BMS implements multiple layers of security:

- **JWT Authentication** — short-lived access tokens (15 min) + rotating refresh tokens (7 days) stored in `HttpOnly` cookies
- **Role-Based Access Control (RBAC)** — `admin`, `manager`, `employee` roles with granular route-level permissions
- **Two-Factor Authentication (2FA)** — TOTP (compatible with Google Authenticator / Authy) with QR code setup
- **OAuth 2.0** — Google, Facebook, and LinkedIn social login via Passport.js
- **Rate Limiting** — per-route limits on auth endpoints to prevent brute-force attacks
- **Security Headers** — Helmet.js sets `CSP`, `HSTS`, `X-Frame-Options`, and other HTTP security headers
- **Password Hashing** — bcrypt with configurable salt rounds
- **Audit Logging** — every create/update/delete action is logged with user ID, IP, and timestamp
- **Input Validation** — Joi schema validation on all API inputs

---

## 📜 Scripts

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot-reload) |
| `npm start` | Start in production mode |
| `npm run migrate` | Run all SQL migration files |
| `npm run seed` | Seed the database with demo data |
| `node scripts/create-employee.js` | Interactive CLI to create a staff account |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |

---

<div align="center">

Built with the **PERN** stack · PostgreSQL · Express · React (Next.js) · Node.js

</div>
