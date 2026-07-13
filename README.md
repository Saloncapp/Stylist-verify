# StylistVerify

A SaaS employment verification platform for the salon industry. Salon owners can register stylists, manage employment status, and verify stylist backgrounds before hiring.

## Tech Stack

- **Next.js 15** (App Router) with React 19
- **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **Framer Motion**
- **MongoDB Atlas** + **Mongoose**
- **Cloudinary** (image storage)
- **JWT** session authentication

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT sessions |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `http://localhost:3000`) |

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Landing page** — Hero, benefits, how-it-works, FAQ
- **Salon registration & login** — Email/password auth with JWT cookies
- **Dashboard** — Stats for total, active, relieved, and absconded stylists
- **Stylist management** — Add stylists with photo upload, update status with remarks
- **Public verification** — Search by Aadhaar or mobile number across all salons
- **Employment history** — Chronological records with salon name, status, dates, and remarks
- **Dark mode** — Light and dark theme support

## Project Structure

```
src/
├── app/
│   ├── api/           # REST API routes
│   ├── dashboard/     # Protected salon owner pages
│   ├── login/         # Auth pages
│   ├── register/
│   └── verify/        # Public verification page
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── landing/
│   ├── layout/
│   ├── ui/            # shadcn/ui components
│   └── verify/
├── lib/               # Utilities (db, auth, validations)
├── models/            # Mongoose models
└── types/             # Shared TypeScript types
```

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register salon |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current session |
| GET/POST | `/api/stylists` | List / create stylists |
| GET/PATCH | `/api/stylists/[id]` | Get / update stylist |
| POST | `/api/verify` | Public verification search |
| POST | `/api/upload` | Cloudinary image upload |

## Future Scope

The architecture supports future expansion: stylist login, job marketplace, skill verification, certifications, ratings, and AI employment insights.
