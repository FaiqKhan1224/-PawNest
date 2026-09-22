# PawNest - Better Care. Happier Pets.

A full-stack pet-food e-commerce platform: **React (Vite) + Node/Express + MongoDB**, with a separate
customer storefront, a separate admin panel and **PawAI**, a backend-powered AI shopping assistant.

Theme: Baby Pink + Light White + Soft Purple + Navy.

---

## 1. Quick start

**Requirements:** Node.js 18.17 or newer (https://nodejs.org) and a MongoDB (see options below).

```bash
npm install        # installs root + backend + frontend automatically
npm run dev        # API on http://localhost:5000  +  website on http://localhost:5173
```

Open **http://localhost:5173**.

Windows: double-click `start-windows.bat`. macOS/Linux: `./start.sh`.

On first start the database is empty, so PawNest **automatically loads demo data**
(56 products, 3 images each, ~1,500 reviews, 48 orders, 12 customers, coupons, categories).

### MongoDB - pick one

| Option | What to do |
| --- | --- |
| **A. Local MongoDB** | Install MongoDB Community Server and start it. Nothing else to do (default `mongodb://127.0.0.1:27017/pawnest`). |
| **B. MongoDB Atlas (free cloud)** | Create a free cluster, copy the connection string into `backend/.env` -> `MONGODB_URI=...` |
| **C. No MongoDB installed** | Run `npm run install:memory-db --prefix backend` once. PawNest then starts an embedded MongoDB automatically (data is kept in `backend/.mongo-data`). |

### Production-style run (one server, one port)

```bash
npm start          # builds the website and serves everything from http://localhost:5000
```
Set `NODE_ENV=production` and a long random `JWT_SECRET` in `backend/.env` when you deploy.

---

## 2. Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@pawnest.com` | `Admin@123` |
| Customer | `ali@gmail.com` | `User@1234` |

Admin sign-in: `/admin/login` (also works from the normal sign-in page). **Change these passwords before going live.**

Coupons in the demo data: `WELCOME500` (Rs. 500 off Rs. 3,000+), `PAWS10` (10 % off, max Rs. 1,000).

---

## 3. PawAI (OpenAI)

PawAI works in two modes:

* **Basic mode** (no key): built-in multilingual answers + real product recommendations from MongoDB.
* **OpenAI mode**: put your key in `backend/.env`:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```
Restart the backend. The key **never leaves the server** - the browser only calls `POST /api/ai/chat`.

How it works: the backend understands English / Urdu / Roman Urdu / mixed messages, detects the pet, category, brand
and budget, loads matching **real products from MongoDB**, sends only those to the model, and only returns products that
exist in that list. Hidden prices are never sent to the model. Admin -> AI Management shows status, usage and popular questions.

---

## 4. What is where

### Customer storefront (pink, rounded, shopping-focused)
Home - Shop (filters, brands, price range, rating, sort, pagination) - Product details (gallery, specs, tabs, reviews, ask PawAI, related) -
Cart (server-priced, coupons) - Checkout (COD / online) - Order confirmation - My Orders / Order details - Track order -
User dashboard (pets, orders) - Pet profile - PawAI chat - Wishlist - Account settings - About / Contact / Shipping / Returns / FAQs.

### Admin panel (`/admin`, lavender workspace with sidebar and an ADMIN PANEL badge)
Dashboard - Products (add / edit / delete / disable) - Categories - Orders (status updates) - Customers - Reviews (hide / reply / delete) -
Coupons - Inventory - Analytics - AI Management - Settings.

### Show / hide / unhide prices
Admin -> Products: click the green **Shown** / amber **Hidden** pill on any product, or use **Show Price / Hide Price** in
Products -> Edit -> Pricing & Stock. When hidden, the **server removes the price** from every public API response
(product cards, details, search, lists, cart, PawAI). Customers see "Price unavailable" and a "Contact us for price" link;
the item can't be added to the cart until you show the price again. Two demo products start with hidden prices
(e.g. *Royal Canin Golden Retriever Adult Dog Food*).

### Brands
Every food category has 3+ brands (Dogs: Royal Canin, Pedigree, Purina, Hill's - Cats: Royal Canin, Whiskas, Me-O, Hill's -
Birds: Versele-Laga, Vitakraft, Hagen - Rabbits / Small pets: Versele-Laga, Vitakraft, Oxbow - Fish: Tetra, Hikari, Sera).

### Product images
No internet is needed: the demo product images are **illustrated pack shots** generated in brand-inspired colours
(`backend/public/products`). Replace them with real photos any time in Admin -> Products -> Edit -> Media (upload or link).
The hero uses a built-in illustration; upload a photo in Admin -> Settings -> Hero image.

---

## 5. Project structure

```
pawnest/
  backend/                 Express + Mongoose API
    server.js              starts DB, auto-seed, HTTP
    src/config             env + MongoDB connection
    src/models             User, Product, Review, Order, Coupon, Pet, Category, Setting, AIUsage ...
    src/routes             public/customer API      src/routes/admin   admin API (admin-only)
    src/services           cart pricing, ratings, PawAI (OpenAI + retrieval)
    src/utils              price hiding (serialize.js), totals (pricing.js), PawAI language/intent (aiText.js)
    src/seed               catalogue, review generator, seeding
    public/products        generated product images
    scripts                image generator, .env creator
  frontend/                React + Vite
    src/styles             base.css (theme) - customer.css - admin.css
    src/components         ui kit, shop, pawai, admin charts
    src/context            auth, cart, wishlist, settings, toasts
    src/layouts            CustomerLayout, AdminLayout
    src/pages/customer     storefront pages     src/pages/admin   admin pages
```

Useful commands: `npm run seed:reset` (wipe + reseed demo data), `npm run images --prefix backend` (regenerate product images).

## 6. Security notes
* Passwords are hashed (bcrypt); JWT auth; admin routes require the `admin` role.
* Cart/checkout prices are always recalculated on the server; stock is reserved atomically.
* Rate limits on login/register, newsletter and PawAI. Uploads are limited to 4 MB images.
* Online payment (card/JazzCash/Easypaisa) records the order as *payment pending* and shows your instructions
  (Admin -> Settings). Connect a payment gateway if you need automatic card capture.
