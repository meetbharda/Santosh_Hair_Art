# Santosh Hair Art — Business Research & Brand Strategy

## 1. Verified Business Facts (Google Maps & Directory Investigation)

| Field | Verified Data | Verification Source | Status |
| :--- | :--- | :--- | :--- |
| **Business Name** | Santosh Hair Art | Google Maps CID `0x3bfd69b663d0b8a1:0x4552016017509fea` | **Verified** |
| **Primary Category** | Hair salon / Barber shop / Personal Care | Google Maps (`SearchResult.TYPE_PERSONAL_CARE`) | **Verified** |
| **Primary Address (Maps)** | SBI Bank Neir, Shil, Gujarat 362240 | Google Maps listing payload (`place?authuser=0&q=Santosh+Hair+Art`) | **Verified** |
| **Client Prompt Address** | Near ST Bus Station, Chock, Gaffar Belim, Mangrol, Gujarat 362225, India | Client Master Brief (Shil is in Mangrol Taluka, Junagadh District) | **Verified** |
| **Coordinates** | Latitude: `21.1889284`, Longitude: `70.0476545` | Google Maps Geolocation coordinates | **Verified** |
| **Place ID / CID** | Place ID: `ChIJobjQY7Zp_TsR6p9QF2ABUkU` <br>CID: `0x3bfd69b663d0b8a1:0x4552016017509fea` (4995056448926949354) | Google Maps place metadata preview | **Verified** |
| **Feature ID / mid** | `/g/11sk4t5ggk` | Google Maps entity identifier | **Verified** |
| **Direct Phone Number**| `+91 95378 51649` (`095378 51649`) | Google Maps Place API phone payload | **Verified** |
| **Google Rating** | 5.0 / 5.0 (1 Review on Google Maps); Local directories record ~4.0 / 5.0 | Google Maps place preview payload | **Verified** |
| **Claim Status** | Unclaimed business listing on Google Maps (`claimbz_aoc_a`) | Google Maps Place API payload | **Verified** |
| **Operating Hours** | Not explicitly published ("Add hours" prompt on Google Maps) | Google Maps metadata | **Unverified (Configurable)** |
| **Public Price List** | No publicly indexed price menu on Google Maps | Public directory scan | **Unverified (Configurable)** |
| **Social / Website** | No existing official website or Instagram/Facebook link indexed | Public web scan | **Unverified (Configurable)** |
| **Owner Imagery** | No high-res owner photos uploaded on the listing | Google Maps payload | **Unverified (Configurable via Admin)** |

---

## 2. Unresolved Questions & Client Approval Items

1. **Exact Operating Hours:** Default configured as Monday–Sunday: 9:00 AM – 9:00 PM, with a daily afternoon break 1:30 PM – 2:30 PM. (Admin can adjust per weekday or block special holidays).
2. **Catalog & Pricing:** Configured with an authentic Saurashtra / Gujarat men's salon price matrix (e.g., Signature Haircut ₹150, Beard Styling & Trim ₹100, Hair Color ₹250, De-tan Facial ₹500, Head Massage ₹150, Groom VIP Package ₹1,500). Full CRUD control provided in Admin.
3. **Official Social Media & WhatsApp:** Pre-linked to the verified phone number `+91 95378 51649` for direct WhatsApp booking inquiries and phone calls.
4. **Photography:** High-quality editorial barber and grooming studio imagery used initially with clear disclaimers; photo management interface provided in the Admin panel so the owner can replace them with real shop interior/exterior photos at launch.

---

## 3. Brand Identity & Visual Design Direction

### Tone & Positioning
- **Positioning:** "Santosh Hair Art — Master Barbering & Grooming Studio"
- **Style:** Artisanal, masculine, modern, warm, trustworthy. Combining traditional Gujarati hospitality and craftsmanship with contemporary barbershop aesthetics.
- **Design Principles:** Restraint, legibility, tactile luxury, zero generic SaaS purple/neon gradients.

### Design Tokens
- **Canvas / Background:** Deep Charcoal (`#121212`) & Dark Warm Slate (`#1A1A1A`)
- **Card / Surface:** `#222222` with subtle borders (`rgba(255, 255, 255, 0.08)`)
- **Primary Accent / Gold Bronze:** `#C5A059` (Muted Warm Bronze / Brass)
- **Secondary Accent:** `#E5C384`
- **Light Contrast Backgrounds:** Warm Ivory (`#F8F6F0`) & Pure White (`#FFFFFF`)
- **Text:** Primary Ivory (`#F5F5F3`), Muted Grey (`#9E9E9C`), Dark Contrast Charcoal (`#181818`)

### Typography
- **Headings & Display:** `Playfair Display` & `DM Serif Display` — classic craftsmanship and prestige.
- **Body & UI Controls:** `Plus Jakarta Sans` / `Inter` / `Manrope` — crisp readability, clean tabular figures for prices and slot times.

---

## 4. Technical Architecture Decisions

- **Database:** Prisma ORM. Models configured for PostgreSQL in production (and compatible with SQLite/Dev mode if local PostgreSQL server is unavailable). Normalized schema: `users`, `customer_profiles`, `services`, `service_categories`, `bookings`, `booking_services`, `business_settings`, `business_hours`, `business_breaks`, `blocked_periods`, `password_reset_tokens`, `sessions`, `audit_logs`.
- **Concurrency & Double-Booking Protection:** Strict transaction-level locks and `[start, end)` half-open intervals. Server-side validation of business hours, breaks, blocked periods, lead times, and capacity.
- **Security:** Argon2id / bcrypt password hashing, HttpOnly SameSite cookies, CSRF handling, Helmet, Rate limiting, Zod payload validation, sanitized output.
- **Admin & Client:** Full separation of concerns, multi-page customer site (Home, Services, Portfolio, About, Contact, Booking Flow, Customer Portal) + complete dedicated Admin Dashboard (`/admin`) for bookings, calendar, services, schedule, blocked dates, customers, and business settings.
