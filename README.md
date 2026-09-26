# KITTY — Everything Your Pet Loves.

KITTY is a TypeScript MERN marketplace starter for pet supplies, built around buyer, seller, and admin roles. The current workspace provides a complete responsive marketplace UI, demo buyer/seller/admin navigation, a modular Express + MongoDB API foundation, product and category endpoints, authentication middleware, and documentation for extending the purchase lifecycle.

## Stack

React, TypeScript, Vite, React Router, Tailwind CSS, TanStack Query, React Hook Form, Zod, Axios, Lucide, Recharts, Framer Motion, Sonner; Node, Express, TypeScript, MongoDB/Mongoose, JWT, bcrypt, Helmet, CORS, rate limiting, Morgan.

## Setup

Requirements: Node.js 20+, npm 10+, MongoDB 7+ (local or managed).

1. Copy `.env.example` to `server/.env` and set `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_PASSWORD`. Keep the environment file private. This workspace's Atlas configuration is stored in a mode-600 per-user file at `/home/galib/.config/kitty/server.env`; `server/.env` is an ignored symlink to it.
2. Install from the repository root: `npm install`.
3. Start both applications: `npm run dev`.
4. Open `http://localhost:5173` (API health: `http://localhost:4000/api/v1/health`).

The storefront includes sample catalog fallback when the API is unavailable. Buyer and seller signup and role-specific dashboards use the signed-in account; the server derives permissions from its HTTP-only session cookie. Public signup only permits buyers and sellers. The one admin account uses the configured `ADMIN_EMAIL` and `ADMIN_PASSWORD` and is created by the seed command.

## Commands

- `npm run dev` — run client and API in parallel
- `npm run build` — type-check and build both workspaces
- `npm run lint` — lint both workspaces
- `npm run test -w server` — run API validation unit tests
- `npm run seed` — seed initial categories and an admin from environment variables

## Environment

See `.env.example`. Never commit secrets. `ADMIN_EMAIL` defaults to the single account name `admin@kitty.local`; set a strong `ADMIN_PASSWORD` before running the seed command. A partial unique index prevents creation of a second admin. Cloudinary, SMTP, and payment provider variables are optional until their adapters are configured. Payment supports a COD abstraction; online providers are intentionally not represented as active integrations.

Google OAuth is enabled by setting `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`. Register the callback URL in Google Cloud exactly as configured (for local development, `http://localhost:4000/api/v1/auth/google/callback`). Google sign-in supports existing verified accounts; a new Google identity becomes a buyer account. Seller applications still use the seller signup form.

The admin console is backed by admin-only API routes for users, seller approvals, product moderation, orders, reports, categories, analytics, and audit logs. Writes are recorded in the audit log. The theme toggle persists a light or dark choice in the browser.

## Roles and API

The API is versioned under `/api/v1`. Public product/category reads are open. Buyer, seller, and admin mutations are protected with JWT auth and backend RBAC. Sellers must have an approved `SellerProfile` before publishing products and can only mutate their own products. See [docs/API.md](docs/API.md), [docs/DATABASE.md](docs/DATABASE.md), and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Production build and deployment

Run `npm run build`, then deploy the static `client/dist` directory to a static host and `server/dist` to a Node host. Configure a managed MongoDB URI, strong random JWT secrets, exact `CLIENT_URL`, and HTTPS. Configure a real image storage adapter, SMTP provider, and payment gateway before enabling those production flows. Set `NODE_ENV=production`.

## Current implementation boundary

The storefront still uses sample fallback products and browser-local cart/wishlist state when its API data is unavailable. Google sign-in requires OAuth credentials; online payment, email delivery, and real payouts require provider configuration. Order and report administration operates on records in MongoDB, and those collections remain empty until the related buyer checkout and reporting flows are connected. Review production security settings and configure external providers before taking live payments.
