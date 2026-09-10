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
| Security | Aadhaar encryption (AES), bcrypt recovery PIN, session versioning |

## Features

### Public

- Landing page with mobile OTP login / register
- Public stylist verification (Aadhaar or mobile — privacy-safe preview)
- Account recovery via home continue flow (recovery PIN + new phone OTP)
- Privacy Policy and Terms of Service pages
- Light/dark theme toggle

### Salon Dashboard (`/dashboard/*`)

- Dashboard stats and hiring previews (SSR)
- Stylist roster — add via modal (`?add=1`), edit, status updates, performance ratings, documents
- Find Stylist — private verification and open-to-work talent pool
- Dedicated open-to-work page; job posting and applicant management
- Salon profile with logo upload and social links
- Account security — phone change, recovery PIN, security notifications (old sessions invalidated)

### Stylist Portal (`/stylist/*`)

- Dashboard with job and application stats
- Browse jobs and apply; respond to salon interest invites
- View application status and employment history
- Profile with open-to-work toggle (header chip; not sidebar)
- Account security — phone change, recovery PIN, security notifications

### API

All business logic is exposed via REST API under `/api/*`. The mobile app and website share this backend. Salon dashboard pages are mostly SSR; `GET /api/me/dashboard` is **stylist-only**.

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
| `FIREBASE_WEB_API_KEY` | No | Server OTP alias (defaults to `NEXT_PUBLIC_FIREBASE_API_KEY`) |
| `FIREBASE_PHONE_AUTH_DISABLE_APP_VERIFICATION` | Dev | Set `true` for Firebase test phone numbers |

### 3. (Optional) Build India location data

```bash
npm run build:lgd-locations
```

### 4. Run database migrations (when needed)

Migrations (stylist unify + hiring indexes) do **not** run on app connect. Run manually:

```bash
npm run db:migrate
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Physical phone / Expo:** bind to all interfaces so the device can reach the API on your LAN IP:

```bash
npx next dev --hostname 0.0.0.0 --port 3000
```

Then set the mobile app `EXPO_PUBLIC_API_URL` to `http://<YOUR_LAN_IP>:3000` (not `localhost`).

### Production

```bash
npm run build
npm start
```

For LAN access in production mode: `npx next start --hostname 0.0.0.0 --port 3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run build:lgd-locations` | Build India state/district location data |
| `npm run db:migrate` | Run DB migrations (indexes / stylist unify) |

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
Stylist-verify/
├── scripts/                 # LGD locations, db:migrate, helpers
├── src/
│   ├── app/
│   │   ├── api/             # REST API routes
│   │   ├── dashboard/       # Salon owner pages
│   │   ├── stylist/         # Stylist portal pages
│   │   ├── verify/          # Public verification
│   │   ├── privacy/         # Privacy policy
│   │   ├── terms/           # Terms of service
│   │   ├── setup-recovery-pin/
│   │   ├── login/           # Legacy redirect → /
│   │   ├── register/        # Legacy redirect → /
│   │   ├── recover/         # Legacy redirect → /?recover=1
│   │   ├── page.tsx         # Landing + OTP login / recover
│   │   └── layout.tsx
│   ├── components/
│   │   ├── account/         # Security, recovery, phone change, PIN setup
│   │   ├── auth/            # OTP auth, registration
│   │   ├── dashboard/       # Salon UI (incl. add-stylist modal)
│   │   ├── stylist/         # Stylist portal UI
│   │   ├── hiring/          # Jobs, applicants, open-to-work
│   │   ├── performance/     # Ratings UI
│   │   ├── verify/
│   │   ├── landing/
│   │   ├── layout/          # Navbar, footer, legal shell
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   ├── models/
│   ├── types/
│   ├── data/
│   └── middleware.ts
├── .env.example
└── package.json
```

## Routes

### Public

| Route | Description |
|-------|-------------|
| `/` | Landing + OTP login; recover via `?recover=1#continue-with-mobile` |
| `/verify` | Public stylist verification |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/setup-recovery-pin` | Post-registration recovery PIN setup |
| `/login`, `/register` | Legacy redirects → `/` |
| `/recover` | Legacy redirect → `/?recover=1#continue-with-mobile` |

### Salon (`/dashboard/*`)

| Route | Description |
|-------|-------------|
| `/dashboard` | Dashboard stats; `?add=1` opens Add Stylist modal |
| `/dashboard/stylists` | Stylist list |
| `/dashboard/stylists/add` | Legacy redirect → `/dashboard?add=1` |
| `/dashboard/stylists/[id]` | Stylist detail |
| `/dashboard/verify` | Find Stylist (private verify + open-to-work) |
| `/dashboard/open-to-work` | Open-to-work talent pool |
| `/dashboard/jobs` | Job postings |
| `/dashboard/hiring` | Legacy redirect → `/dashboard/jobs` |
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
| `/stylist/profile` | Stylist profile (header chip) |
| `/stylist/security` | Account security |

## API Overview

| Area | Endpoints |
|------|-----------|
| Auth | `/api/auth/otp/*`, `/api/auth/register`, `/api/auth/stylist-aadhaar`, `/api/auth/session`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/clear-session` |
| Salon | `/api/salon/profile`, `/api/salon/stylist-phone/*`, `/api/stylists/*`, `/api/stylists/open-to-work`, `/api/stylists/open-to-work/count` |
| Stylist (self) | `/api/me/stylist`, `/api/me/dashboard` (stylist-only), `/api/me/applications`, `/api/me/interests/*` |
| Hiring | `/api/jobs/*`, `/api/jobs/mine`, `/api/jobs/open-count`, `/api/applications/*` |
| Verification | `/api/verify` (public, locked), `/api/verify/private` (salon) |
| Account | `/api/account/security`, `/api/account/recovery-pin/*`, `/api/account/phone-change/*`, `/api/account/recover/*`, `/api/account/security-events` |
| Utilities | `/api/health`, `/api/upload`, `/api/locations/*` |

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

1. Start this API with LAN bind: `npx next dev --hostname 0.0.0.0 --port 3000`
2. Set `EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:3000` in the app `.env` (not `localhost` on a physical phone)
3. Phone and PC must be on the same Wi‑Fi; restart Expo after changing `.env`

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
| **Public** | — | `/`, `/verify`, `/privacy`, `/terms`, `/setup-recovery-pin`, recover via home query |

Authentication uses Firebase Phone OTP. Sessions are JWTs in httpOnly cookies (web) or Bearer tokens (mobile). Phone change / recovery bumps `authSessionVersion` and invalidates older sessions.
