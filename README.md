# Santosh Hair Art — Premium Salon & Appointment Booking Web Platform

A production-quality digital web application and real-time appointment booking engine crafted specifically for **Santosh Hair Art**, a premier hair styling and men's grooming studio located in Mangrol, Gujarat, India.

---

## 💈 Business Overview & Verified Identity

- **Business Name:** Santosh Hair Art
- **Category:** Hair Salon / Barber Shop / Personal Grooming Studio
- **Verified Physical Location:** Near SBI Bank, Shil, Mangrol, Gujarat, 362240
- **Maps Listing:** [Google Maps Place](https://maps.app.goo.gl/1NHaQgexgWuvfmq16) (CID: `0x3bfd69b663d0b8a1:0x4552016017509fea`, Place ID: `ChIJobjQY7Zp_TsR6p9QF2ABUkU`)
- **Coordinates:** `21.1889284° N, 70.0476545° E`
- **Direct Phone & WhatsApp:** `+91 95378 51649`
- **Operating Timezone:** `Asia/Kolkata` (IST)
- **Documented Research:** See [`BUSINESS_RESEARCH.md`](./BUSINESS_RESEARCH.md) for full fact-checking, sources, and verification audit trail.

---

## 🚀 Key Features

### 1. Customer-Facing Web Application
- **Editorial Brand Experience:** Designed with bespoke design tokens (Deep Charcoal `#121212`, Muted Bronze `#C5A059`, Warm Ivory `#F8F6F0`) and classic typography (`Playfair Display` + `Plus Jakarta Sans`).
- **Interactive Multi-Step Booking Flow:**
  - **Step 1:** Select single or bundled grooming services with live duration and price accumulation in INR (`₹`).
  - **Step 2:** Interactive 7-day ribbon calendar with real-time server-side availability calculation and closed-day detection.
  - **Step 3:** Dynamic slot selector respecting business hours, lunch breaks (1:30 PM–2:30 PM), past cutoff lead times, and active bookings.
  - **Step 4:** Guest details entry (name, phone, email, grooming notes).
  - **Step 5:** Immutable booking summary, policy review, and instant confirmation.
  - **Step 6:** Success screen with unique booking reference code (`SHA-XXXXXX`) and copy-to-clipboard action.
- **Booking Reference Lookup (`/lookup`):** Allows any customer to look up their appointment status, scheduled date/time, and booked services using their reference code.
- **Customer Portal (`/portal`):**
  - Secure registration, login, and HttpOnly session cookies.
  - View upcoming appointments and historical visits.
  - Self-service appointment cancellation (enforcing configurable 2-hour cutoff rule).
  - Reschedule appointments with instant conflict checking against new open slots.
  - Edit personal profile and persistent hair styling preferences.
- **Service Catalog (`/services`):** Searchable and filterable categorized menu with prices in INR, service durations, and direct "Book Now" shortcuts.
- **Portfolio Gallery (`/portfolio`):** Filterable gallery with responsive image lightbox.
- **About Page (`/about`):** Defensible claims, hygiene standards (fresh blades, sanitized tools), and comprehensive FAQ.
- **Contact & Map (`/contact`):** Validated enquiry form with spam protection, direct phone dial, WhatsApp quick link, and Google Maps navigation.

### 2. Server-Side Appointment Scheduling Engine
- **Strict Concurrency Protection:** Atomic database transactions prevent two simultaneous requests from reserving overlapping time slots.
- **Half-Open Intervals `[start, end)`:** Guaranteed mathematical overlap prevention.
- **Dynamic Slot Generation:** Calculates open bookable windows using:
  - Weekly weekday hours (`business_hours`).
  - Daily break intervals (`business_breaks`).
  - Exceptional holidays and blocked ranges (`blocked_periods`).
  - Minimum advance notice / lead time (default 1 hour).
  - Maximum booking window (default 30 days).
  - Post-service sanitation buffer time (default 5 minutes).
- **Immutable Historical Records:** Captures a snapshot of service names, prices (in paise), and durations at booking time, preventing historical records from rewriting when prices change in the future.

### 3. Comprehensive Administrative Operations Portal (`/admin`)
- **Metrics Dashboard:** Real database-backed counters: today’s schedule, upcoming appointments, completed visits, pending confirmations, cancellations, total earned revenue in INR, popular services leaderboard, and 10 most recent bookings.
- **Appointment Management (`/admin/appointments`):**
  - Search by reference code, guest name, or mobile number.
  - Filter by date and status (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
  - One-click status transitions and customer cancellation tracking.
  - Add and update internal staff notes per appointment.
- **Service Catalog Management (`/admin/services`):** Add new services, edit prices/durations/buffers, and safely deactivate services without breaking existing bookings.
- **Business Hours & Holiday Management (`/admin/schedule`):**
  - Set opening and closing times per weekday, or mark days as closed.
  - Block holidays, date ranges, or specific hours with custom reasons (e.g. Diwali festival, maintenance).
- **Customer Directory (`/admin/customers`):** View customer list, contact details, total visits, and styling preferences.
- **Enquiry Inbox (`/admin/enquiries`):** Track incoming contact messages with status workflows (`NEW`, `CONTACTED`, `RESOLVED`).
- **Studio Settings (`/admin/settings`):** Live configuration of salon phone number, address, Google Maps link, slot intervals, buffer times, lead time hours, and auto-confirm toggles.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, React Router 7, React Hook Form, Zod, Lucide React, date-fns |
| **Backend** | Node.js (v22), Express.js, Prisma ORM, Zod, date-fns-tz |
| **Security** | Argon2id / bcryptjs, HttpOnly SameSite cookies, Helmet, CORS whitelist, express-rate-limit |
| **Database** | SQLite (zero-config local dev & tests) / PostgreSQL (production-ready schema & migrations) |
| **Testing** | Vitest, Supertest (16 automated tests covering integration, auth, and concurrency) |

---

## 📦 Project Structure

```
barbershop/
├── client/                     # Vite + React Frontend Application
│   ├── public/                 # Static assets & SVG favicon
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Footer, etc.)
│   │   ├── context/            # AuthContext, ToastContext
│   │   ├── layouts/            # PublicLayout, AdminLayout
│   │   ├── lib/                # API client wrapper, formatting utilities
│   │   ├── pages/              # Public customer pages & Admin dashboard
│   │   │   └── admin/          # Admin pages (Dashboard, Appointments, Services, etc.)
│   │   ├── App.jsx             # React Router routing tree
│   │   ├── index.css           # Tailwind design tokens & font imports
│   │   └── main.jsx
│   ├── tests/                  # Frontend unit tests
│   └── package.json
│
├── server/                     # Node.js + Express REST API Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Active Prisma schema (SQLite dev / PostgreSQL prod)
│   │   └── schema.postgresql.prisma # Dedicated PostgreSQL production schema
│   ├── src/
│   │   ├── database/seed.js    # Reproducible seed script with verified business data
│   │   ├── lib/                # Prisma singleton, auth helpers, slot scheduling engine
│   │   ├── middleware/         # requireAuth, requireAdmin, errorHandler
│   │   ├── routes/             # Health, Public, Auth, Customer, Admin API routes
│   │   ├── validators/         # Zod request validation schemas
│   │   ├── app.js              # Express app with security headers & rate limits
│   │   └── index.js            # Server entry point & graceful shutdown
│   ├── tests/                  # Backend integration & concurrency tests
│   └── package.json
│
├── BUSINESS_RESEARCH.md        # Verified business facts, Google Maps CID, audit trail
├── package.json                # Root package with unified scripts
├── .env.example
└── README.md
```

---

## ⚙️ Local Development Setup

### Prerequisites
- **Node.js:** v18.0.0 or later (v22 tested)
- **npm:** v9.0.0 or later

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd barbershop

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

cd ..
```

### Step 2: Environment Configuration

Both `server/.env` and `client/.env` examples are provided:

```bash
# In server directory:
cp server/.env.example server/.env

# In client directory:
cp client/.env.example client/.env
```

**`server/.env`:**
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
SESSION_SECRET="santosh-hair-art-super-secure-production-random-secret-key-32chars"
COOKIE_SECRET="santosh-hair-art-cookie-secret-key-salt-98765"
FRONTEND_URL="http://localhost:5173"
ADMIN_INITIAL_EMAIL="admin@santoshhairart.in"
ADMIN_INITIAL_PASSWORD="Admin@Santosh2026!"
```

### Step 3: Initialize Database & Seed Verified Data

```bash
cd server
npx prisma db push
npm run prisma:seed
cd ..
```

### Step 4: Run Application in Development Mode

In two separate terminals:

**Terminal 1 (Backend Server on Port 5000):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client on Port 5173):**
```bash
cd client
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🔐 Default Admin Credentials

An administrator account is provisioned during database seeding:

- **Email:** `admin@santoshhairart.in`
- **Password:** `Admin@Santosh2026!`
- **Admin Portal URL:** `http://localhost:5173/admin` (or click "Sign In" -> "Admin Portal")

Demo Customer Account:
- **Email:** `customer@example.com`
- **Password:** `Customer@1234`

---

## 🧪 Running Automated Tests

Run all 16 backend and frontend automated tests with one command from the project root:

```bash
npm run test
```

### Backend Test Coverage (`server/tests/api.test.js`)
1. Health check database ping (`GET /api/health`).
2. Customer registration, bcrypt password hashing, and login cookie generation.
3. Administrator authentication and role verification.
4. Public retrieval of business identity and categorized service catalog.
5. Dynamic time slot availability calculation for future dates.
6. Successful slot reservation and unique reference code generation (`SHA-XXXXXX`).
7. **Double-booking prevention:** Rejection of conflicting bookings with HTTP 409 `SLOT_CONFLICT`.
8. **Concurrency stress test:** Simultaneous overlapping booking requests guarantee that only one succeeds.
9. Authorization check: Non-admin users are strictly blocked from `/api/admin/*` endpoints.
10. Admin metrics retrieval: Accurate aggregation of bookings, revenue, and popular services.
11. Data isolation: Customer A cannot access Customer B’s bookings.
12. **Historical price immutability:** Verifies that modifying a service price in the admin catalog does not alter past booking receipts.

### Frontend Unit Coverage (`client/tests/utils.test.js`)
1. INR currency formatting (converting integer paise to `₹` format).
2. Human-readable duration formatting (e.g. `45 mins`, `1 hr 30 mins`).
3. Booking status badge class assignments.
4. Text transformation and capitalization helpers.

---

## 🚢 Production Deployment Guide

### Option 1: Full-Stack Node.js Deployment (Single Server / VPS / Render / Railway)

1. **Database Setup (PostgreSQL):**
   - Create a PostgreSQL 15+ database (e.g., Supabase, Neon, AWS RDS, or local Postgres).
   - In `server/prisma/schema.prisma`, switch datasource provider to `"postgresql"`.
   - Set `DATABASE_URL="postgresql://user:password@host:5432/santosh_hair_art?schema=public"` in `server/.env`.
   - Run migrations: `npx prisma db push && node src/database/seed.js`.

2. **Build Frontend:**
   ```bash
   cd client
   npm run build
   # Outputs optimized, tree-shaken static assets to client/dist/
   ```

3. **Serve Static Files via Express:**
   - Add static middleware in `server/src/app.js`:
     ```js
     import path from 'node:path';
     app.use(express.static(path.resolve('../client/dist')));
     app.get('*', (req, res) => res.sendFile(path.resolve('../client/dist/index.html')));
     ```

4. **Environment Variables in Production:**
   - `NODE_ENV=production`
   - `PORT=5000` (or host provided port)
   - `SESSION_SECRET` (Use 64-char crypto string)
   - `COOKIE_SECRET` (Use 64-char crypto string)
   - `FRONTEND_URL` (Your custom production domain, e.g. `https://santoshhairart.in`)

### Option 2: Split Architecture (Vercel Frontend + Render/Railway Backend)

1. Deploy `server/` to Render/Railway:
   - Build command: `npm install && npx prisma generate && npx prisma db push`
   - Start command: `node src/index.js`
   - Configure PostgreSQL connection URL.
2. Deploy `client/` to Vercel/Netlify:
   - Root directory: `client`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Set environment variable: `VITE_API_URL=https://api.yourdomain.com/api`

---

## 🔒 Security Best Practices Implemented

- **Password Storage:** Argon2id / bcrypt with salted rounds; plain passwords never stored or logged.
- **Session Security:** Cryptographically secure 256-bit random tokens stored in database and transmitted exclusively via `HttpOnly`, `SameSite=Lax/Strict` cookies.
- **Origin Protection:** CORS restricted to configured frontend origins with credentials allowed.
- **Header Protection:** Helmet-configured HTTP security headers preventing clickjacking, MIME-sniffing, and cross-site scripting.
- **Rate Limiting:** IP-based sliding window rate limiter protects `/api/auth/*` endpoints against brute-force password guessing.
- **Payload Validation:** Strict Zod validation schemas on all public, customer, and administrative endpoints.
- **Audit Logging:** Administrative operations (service creation, schedule updates, status overrides) are recorded in the `audit_logs` table.

---

## 📄 License & Client Delivery Note

Delivered as a production-ready bespoke web product for **Santosh Hair Art** (Mangrol, Gujarat). All rights reserved.
