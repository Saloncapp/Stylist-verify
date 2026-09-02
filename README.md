# Stylist Verify

A SaaS employment verification and hiring platform for the Indian salon industry. Salon owners can register stylists, verify backgrounds, manage employment history, post jobs, and hire talent. Stylists can maintain profiles, browse jobs, apply for positions, and manage account security.

This repository is the **Next.js website and REST API**. The mobile app lives in [`Stylist-verify-app`](../Stylist-verify-app) and uses the same API.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Framer Motion |
| Forms | React Hook Form, Zod |
| Database | MongoDB Atlas, Mongoose 9 |
| Authentication | Firebase Phone Auth (OTP), JWT (`jose`) |
| File Storage | Cloudinary |
| Security | Aadhaar encryption (AES), bcrypt recovery PIN |

## Features

### Public

- Landing page with mobile OTP login
- Public stylist verification (Aadhaar or mobile — privacy-safe preview)
- Account recovery (recovery PIN + new phone OTP)

### Salon Dashboard (`/dashboard/*`)

- Dashboard stats and hiring previews
- Stylist roster — add, edit, status updates, performance ratings, documents
- Find Stylist — private verification and open-to-work talent pool
- Job posting and applicant management (interested, hired, rejected)
- Salon profile with logo upload and social links
- Account security — phone change, recovery PIN, security notifications

### Stylist Portal (`/stylist/*`)

- Dashboard with job and application stats
- Browse jobs and apply
- Respond to salon interest invites
- View application status and employment history
- Profile with open-to-work toggle
- Account security — phone change, recovery PIN, security notifications

### API

All business logic is exposed via REST API under `/api/*`. The mobile app and website share this backend.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- MongoDB Atlas (or local MongoDB)
- Firebase project with Phone Authentication enabled
- Cloudinary account

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing session JWTs |
| `AADHAAR_ENCRYPTION_KEY` | Yes | 32-byte key for Aadhaar AES encryption |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Firebase client config |
| `FIREBASE_PROJECT_ID` | Yes | Firebase Admin project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase Admin service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase Admin private key |
| `FIREBASE_PHONE_AUTH_DISABLE_APP_VERIFICATION` | Dev | Set `true` for Firebase test phone numbers |

### 3. (Optional) Build India location data

```bash
npm run build:lgd-locations
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run build:lgd-locations` | Build India state/district location data |

## Test Login (Development)

Configure Firebase test phone numbers, then use:

| Role | Phone | OTP |
|------|-------|-----|
| Salon | `9345837813` | `123456` |
| Stylist | `7777777777` | `123456` |
| Additional | `8888888888`, `9999999999` | `123456` |

Requires `FIREBASE_PHONE_AUTH_DISABLE_APP_VERIFICATION=true` in `.env.local`.

## Project Structure

```
src/
├── app/
│   ├── api/              # REST API routes
│   ├── dashboard/        # Salon owner pages
│   ├── stylist/          # Stylist portal pages
│   ├── recover/          # Account recovery
│   ├── verify/           # Public verification
│   ├── page.tsx          # Landing + OTP login
│   └── layout.tsx
├── components/
│   ├── account/          # Security, recovery, phone change
│   ├── auth/             # OTP auth, registration
│   ├── dashboard/        # Salon dashboard UI
│   ├── stylist/          # Stylist portal UI
│   ├── hiring/           # Jobs, applicants, open-to-work
│   ├── verify/           # Public verification UI
│   ├── landing/          # Landing page sections
│   ├── layout/           # Navbar, footer
│   └── ui/               # shadcn/ui primitives
├── lib/                  # Business logic (auth, hiring, verify, recovery)
├── models/               # Mongoose schemas
├── types/                # Shared TypeScript types
├── data/                 # Static JSON (India locations)
└── middleware.ts         # Role-based route protection
```

## Routes

### Public

| Route | Description |
|-------|-------------|
| `/` | Landing page + mobile OTP login |
| `/verify` | Public stylist verification |
| `/recover` | Account recovery |

### Salon (`/dashboard/*`)

| Route | Description |
|-------|-------------|
| `/dashboard` | Dashboard stats |
| `/dashboard/stylists` | Stylist list |
| `/dashboard/stylists/add` | Add stylist |
| `/dashboard/stylists/[id]` | Stylist detail |
| `/dashboard/verify` | Find Stylist (private verify + open-to-work) |
| `/dashboard/jobs` | Job postings |
| `/dashboard/applicants` | Applicant review and hire |
| `/dashboard/profile` | Salon profile |
| `/dashboard/security` | Account security |

### Stylist (`/stylist/*`)

| Route | Description |
|-------|-------------|
| `/stylist` | Dashboard |
| `/stylist/jobs` | Browse and apply for jobs |
| `/stylist/interests` | Salon interest invites |
| `/stylist/applications` | My applications |
| `/stylist/employment` | Employment history |
| `/stylist/profile` | Stylist profile |
| `/stylist/security` | Account security |

## API Overview

| Area | Endpoints |
|------|-----------|
| Auth | `/api/auth/otp/*`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout` |
| Salon | `/api/salon/profile`, `/api/stylists/*` |
| Stylist (self) | `/api/me/stylist`, `/api/me/dashboard`, `/api/me/applications`, `/api/me/interests/*` |
| Hiring | `/api/jobs/*`, `/api/applications/*` |
| Verification | `/api/verify`, `/api/verify/private` |
| Account | `/api/account/security`, `/api/account/recovery-pin`, `/api/account/phone-change/*`, `/api/account/recover/*` |
| Utilities | `/api/upload`, `/api/locations/*` |

Full API reference: [`stylist-verify-documentation/TECHNICAL_DOCUMENTATION.md`](../stylist-verify-documentation/TECHNICAL_DOCUMENTATION.md#7-api-documentation)

## Related Projects

| Project | Description |
|---------|-------------|
| [`Stylist-verify-app`](../Stylist-verify-app) | Expo React Native mobile client |
| [`stylist-verify-documentation`](../stylist-verify-documentation) | Technical and functional documentation |

### Mobile App Quick Start

```bash
cd ../Stylist-verify-app
cp .env.example .env
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL=http://localhost:3000` (or your LAN IP for physical devices).

## Documentation

| Document | Description |
|----------|-------------|
| [Technical Documentation](../stylist-verify-documentation/TECHNICAL_DOCUMENTATION.md) | Architecture, API, database, security, setup |
| [Functional Documentation](../stylist-verify-documentation/FUNCTIONAL_DOCUMENTATION.md) | Requirements, workflows, business rules |

## User Roles

| Role | Login identifier | Access |
|------|------------------|--------|
| **Salon** | `salonNumber` (mobile) | `/dashboard/*` |
| **Stylist** | `mobileNumber` | `/stylist/*` |
| **Public** | — | `/`, `/verify`, `/recover` |

Authentication uses Firebase Phone OTP. Sessions are stored as JWT in httpOnly cookies (web) or Bearer tokens (mobile API).
