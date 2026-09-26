# Architecture

The root npm workspace contains independent `client` and `server` packages. The Vite React app owns presentation, forms, client query caching, and navigation. The Express API owns authentication, authorization, input validation, product ownership, and persisted state. Mongoose models define indexes and references. The API is versioned at `/api/v1` and centralizes errors.

## Trust boundaries

- Registration only accepts `BUYER` or `SELLER`; clients cannot create admins.
- Every seller product write derives `sellerId` from the authenticated account. Seller updates and archives include both product ID and owner ID in the database predicate.
- Seller publishing requires an approved seller profile.
- Public product queries expose only `PUBLISHED` products.
- Admin-only category mutations verify the role on the server.
- Product input is Zod validated; prices cannot have a discount greater than the list price.
- The demo role switcher is a presentation preview, not an authorization control.

## Provider seams

Uploads should be implemented behind a storage service interface, with Cloudinary as a configurable adapter. Payment should be a provider interface that supports COD first and later SSLCommerz/bKash/Nagad; never accept card details. Email verification, reset links, and notifications need a configured email/queue provider. The current app deliberately reports these production dependencies in setup documentation.

## UI

The client is a responsive editorial storefront with catalog, item detail, cart drawer, seller/admin/buyer overview, and local demonstration data. It uses React Router, TanStack Query provider, Framer Motion, and Sonner. Catalog samples in `client/src/data.ts` are visual demo content; connect public product queries before launch and remove demo data fallback for production.
