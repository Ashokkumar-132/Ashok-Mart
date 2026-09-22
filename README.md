# AshokMart

**Everything You Need. Delivered.**

> **Status:** Implementation complete — all buyer, seller, admin, review and chatbot features are functional.

AshokMart is a complete multi-seller e-commerce web application built as a final-year capstone project. It supports three roles — **Buyer**, **Seller** and **Admin** — with a real database, real stock handling, server-side order totals and an AI shopping assistant. All prices are in Indian Rupees (₹).

---

## Features

### Buyer
- Register (name, email, password), login, logout
- Browse products, search, filter by category
- Product details with price, stock, specifications and reviews
- Cart: add, remove, increase/decrease quantity, subtotal and total
- Delivery address management
- Checkout flow: Cart → Checkout → Delivery Address → Order Summary → Confirm Order → Order Successful
- Order history with order status
- Rate (1–5) and review a product after purchase

### Seller
- Register as a seller, login, logout
- Seller dashboard with product, stock and order summary
- Add / edit / delete own products (name, description, category, price, stock, image)
- Manage stock and price
- View orders received and update delivery status

### Admin
- Separate admin login (no public admin registration)
- View all users (buyers and sellers), all orders and all products
- Remove inappropriate products from the storefront (and restore them)

### AI Shopping Assistant
- Floating chat widget available on every buyer page
- Answers questions about searching, cart, checkout, orders, reviews and becoming a seller
- Runs entirely server-side; the AI key is never exposed to the browser

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, TanStack Router, Tailwind CSS v4 |
| Backend | TanStack Start server functions + PostgreSQL functions (RPC) |
| Database | Managed PostgreSQL (Supabase-compatible) with Row Level Security |
| Auth | Email + password with hashed credentials, role-based access |
| AI | Hosted AI gateway (server-side only) |
| Build | Vite 7, Bun / npm |

> Note: this project runs on a JavaScript/TypeScript server runtime rather than Java Spring Boot, because the hosting platform does not run a JVM. The layering is equivalent: routes (controllers) → server functions & SQL functions (services) → Supabase client & SQL (repositories) → tables (entities).

---

## Project structure

```
src/                          # Application source (frontend + server functions)
  routes/                     # Pages, URL structure and API/server routes
    index.tsx                 # Buyer / seller login
    register.tsx              # Registration
    admin.tsx                 # Admin login
    _authenticated/           # Signed-in area (auth gate)
      home.tsx                # Product listing, search, categories
      product.$id.tsx         # Product details + reviews
      cart.tsx, checkout.tsx  # Cart and checkout
      order-confirmation.$id.tsx, orders.tsx
      address.tsx, account.tsx
      seller/                 # Seller dashboard, products, inventory, orders
      admin/                  # Admin dashboard, users, orders, products
  components/                 # UI grouped by layout, navigation, products, reviews and assistant
  services/                   # Server-side services: authentication, cart, assistant
  lib/                        # Shared formatting and utility helpers
  hooks/                      # Account, role and shopping data hooks
  integrations/               # Generated database client and types
  assets/, styles.css         # Images and global styles
public/                       # Static files served as-is
database/
  migrations/                 # Versioned SQL: schema, policies, seed data
  schema/                     # Typed schema definition
docs/                         # Project documentation and roadmap
```

---

## Database

Tables: `profiles`, `user_roles`, `addresses`, `products`, `cart_items`, `orders`, `order_items`, `reviews`.

Relationships:
- `products.seller_id` → seller (user)
- `orders.user_id` → buyer (user)
- `orders` → `order_items` (one to many)
- `order_items.product_id` → product, `order_items.seller_id` → seller
- `reviews.product_id` → product, `reviews.user_id` → user
- `cart_items` links user ↔ product with a quantity

Business rules enforced in the database:
- `place_order()` recalculates the subtotal from the stored product prices — frontend totals are never trusted
- Orders are rejected when the requested quantity exceeds stock
- Stock is decremented automatically on a confirmed order and the cart is cleared
- Delivery charge ₹49, free above ₹500
- Row Level Security keeps buyers, sellers and admins to their own data

---

## Local setup

```sh
git clone <your-repository-url>
cd ashokmart
npm install
npm run dev
```

The app runs at `http://localhost:8080`.

### Environment variables

Create a `.env` file (never commit secrets):

```
VITE_SUPABASE_URL=<your database URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_URL=<your database URL>
SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — server only>
LOVABLE_API_KEY=<AI gateway key — server only>
```

Only `VITE_`-prefixed values reach the browser. Service keys and the AI key are server-side only.

### Database setup

The SQL migrations in `database/migrations/` create the schema, policies, the `place_order` function and 24 demo products across 10 categories. Apply them in order against a PostgreSQL database.

---

## Demo accounts

| Role | How to access |
|---|---|
| Buyer | Register from the login page with the "User / Customer" role |
| Seller | Register from the login page with the "Seller" role |
| Admin | "Administrator login" link on the login page (credentials are created internally) |

---

## Deployment

- Frontend and server functions deploy together as one application.
- Configure the environment variables above in the hosting provider's settings.
- Point the app at a cloud-hosted PostgreSQL instance and run the migrations before the first deploy.
- Never hard-code database passwords, service keys or AI keys in the repository.

---

## Scope

Deliberately **not** included: real payment gateway, wishlist, coupons, loyalty points, recommendation engine, social login beyond Google, live delivery tracking and seller subscriptions.
