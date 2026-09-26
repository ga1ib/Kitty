# API Reference

Base URL: `http://localhost:4000/api/v1`. Responses use `{ success, message, data }`; list endpoints also return pagination. Login and signup set a two-hour HTTP-only `accessToken` cookie; protected routes also accept `Authorization: Bearer <JWT>` for API clients. Validation failures return HTTP 400; unauthenticated requests return 401 and role/ownership failures return 403 or 404.

## Authentication

| Method | Endpoint | Access | Request | Response |
|---|---|---|---|---|
| POST | `/auth/register` | Public | `firstName,lastName,email,phone,password,role?`; buyers submit address details, sellers submit shop and business address details | 201, user and HTTP-only session cookie |
| POST | `/auth/login` | Public | `email,password` | 200, user and HTTP-only session cookie |
| POST | `/auth/logout` | Public | — | Clears the session cookie |
| GET | `/auth/me` | Any authenticated user | — | 200, current account |

Seller registration creates a `PENDING` shop profile. Product publishing is denied until an administrator approves it. Public signup accepts only `BUYER` or `SELLER`; the only admin is seeded from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the private environment file. MongoDB enforces a unique partial index allowing only one admin record.

## Catalog

| Method | Endpoint | Access | Request | Response |
|---|---|---|---|---|
| GET | `/categories` | Public | `includeInactive=true` is reserved for admin use | Ordered active categories |
| POST | `/categories` | Admin | `name,slug,description?,image?,parentId?,order?` | 201, category |
| PATCH | `/categories/:id` | Admin | Any category fields | Updated category |
| GET | `/products` | Public | `page,limit,q,category,seller,species,minPrice,maxPrice,available,sort` | Products, pagination |
| GET | `/products/:slug` | Public | — | Product and shop summary |
| POST | `/products` | Approved seller | Product fields; seller ID comes from token | 201, product |
| PATCH | `/products/:id` | Owner seller or admin | Partial product fields | Updated product |
| DELETE | `/products/:id` | Owner seller or admin | — | Product archived |
| GET | `/sellers/:slug` | Public | `page,limit` | Shop and paginated products |

Sort values: `newest`, `price_asc`, `price_desc`, `rating`, `popular`. Public catalog reads only return published products. Price and stock values used in future checkout must always be loaded and calculated by the API.

## Platform endpoints planned

The remaining order, cart, review, notifications, reports, coupons, moderation, analytics, and audit-log APIs are documented in the architecture/data model as extension points and are not currently exposed as active routes. Do not integrate a UI flow as a real transaction until its corresponding API is implemented.
