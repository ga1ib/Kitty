# Database

MongoDB collections in the current API foundation:

- `users`: unique normalized email, indexed role/status, password hash excluded from normal reads.
- `sellerprofiles`: unique user and shop slug; approval status and seller summary fields.
- `categories`: unique slug, parent reference, active flag and display order.
- `products`: owner and category references, inventory counters, moderation/publication status, text index across name/brand/tags/SKU, and compound catalog indexes.
- `pets`: buyer reference and pet preferences.
- `auditlogs`: actor/action/entity indexes and creation timestamp.

Recommended next collections: addresses, carts, wishlists, orders, seller orders, order items, reviews, notifications, reports, coupons, flash sales, recently viewed products, and seller follows. Multi-seller checkout should create a parent order and seller suborders in a MongoDB transaction, reserve stock atomically, and write the resulting commission amounts to order items. A transaction-capable MongoDB replica set is required for that flow.

Seed baseline categories and admin: set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run `npm run seed`. The script is idempotent and uses environment credentials only.
