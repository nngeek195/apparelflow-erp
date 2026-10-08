# ApparelFlow ERP — Garment Manufacturing Operations System

> A full-stack, multi-role Enterprise Resource Planning (ERP) web application built for the apparel manufacturing industry. It manages the complete lifecycle of garment production — from cutting batch initiation through QA verification to sewing assembly — with role-based access control, real-time order tracking, and an immutable audit trail.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions) |
| **Language** | TypeScript 5 |
| **Authentication** | [Supabase Auth](https://supabase.com/docs/guides/auth) (email/password, JWT, user metadata roles) |
| **Database** | [Supabase PostgreSQL](https://supabase.com/docs/guides/database) (hosted on AWS ap-northeast-2) |
| **ORM** | [Prisma 5](https://www.prisma.io/) (query engine, schema management, transactions) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Admin SDK** | Firebase Admin (secondary auth integration) |
| **Email** | Resend |
| **Connection Pooler** | PgBouncer (via Supabase pooler URL) |

---

## 📋 What Was Built

ApparelFlow ERP implements a **4-role, 4-stage production workflow** designed for a real garment factory. Each role has a dedicated dashboard and scoped API access. The system enforces:

- **Role-based route protection** (Next.js Middleware)
- **Server-side RBAC** on every API endpoint
- **Hard-stop QA enforcement** (server validates shortage before allowing approval)
- **Immutable audit trail** (verification logs stored permanently)
- **Multi-step state machine** for every cutting order

---

## 🔄 Production Workflow State Machine

```
[Cutting Supervisor]
       │
       ▼
 CUTTING_IN_PROGRESS
       │
       │ "Send to QA" action
       ▼
 PENDING_VERIFICATION
       │
   [Verifier runs audit]
       │
   ┌───┴────────────────────┐
   ▼                        ▼
VERIFIED                REJECTED
   │                        │
[Sewing Queue]    [Back to Cutting Table for rework]
```

Every order transition is tracked in the database with timestamps and user IDs.

---

## 🗂️ Project Structure

```
apparelflow-erp/
├── app/
│   ├── action/
│   │   ├── admin.ts          # Server Actions: create/update/delete/list staff
│   │   └── auth.ts           # Server Actions: login, signup, signOut
│   ├── admin/
│   │   └── page.tsx          # 🔒 Admin-only Supreme Control Panel
│   ├── cutting-supervisor/
│   │   └── page.tsx          # 🔒 Cutting Supervisor dashboard
│   ├── verification/
│   │   └── page.tsx          # 🔒 Cutting Verifier QC Station
│   ├── sewing/
│   │   └── page.tsx          # 🔒 Sewing Supervisor Assembly Floor
│   ├── dashboard/
│   │   └── page.tsx          # Role-based redirect router
│   ├── login/
│   │   └── page.tsx          # Login entry point
│   └── api/
│       ├── orders/
│       │   ├── route.ts              # GET all orders / POST new order
│       │   ├── [id]/route.ts         # PATCH order status
│       │   └── [id]/verify/route.ts  # POST QC audit decision
│       ├── recipes/
│       │   ├── route.ts              # GET all recipes / POST new recipe
│       │   └── [id]/route.ts         # PUT update / DELETE recipe
│       ├── sewing/queue/
│       │   └── route.ts              # GET verified orders only
│       └── stats/
│           └── route.ts              # GET factory-wide KPI stats
├── components/
│   ├── AuthContext.tsx        # React context: session + role state
│   ├── LoginForm.tsx          # Login UI with role-based redirect
│   ├── Navbar.tsx             # Role-aware navigation bar
│   ├── NewOrderModal.tsx      # (Modal component)
│   ├── NewRecipeModal.tsx     # (Modal component)
│   └── VerificationModal.tsx  # (Modal component)
├── lib/
│   └── prisma.ts              # Singleton Prisma client
├── utils/supabase/
│   ├── client.ts              # Browser-side Supabase client
│   ├── server.ts              # Server-side Supabase client (cookie-based)
│   └── admin.ts               # Admin Supabase client (service role key)
├── prisma/
│   ├── schema.prisma          # Full database schema
│   └── seed.ts                # Initial recipe seed data
└── middleware.ts               # Route protection + role gating
```

---

## 🌐 All Features

### 🔐 Authentication & Role Management

- **Email + Password login** via Supabase Auth
- **Role stored in `user_metadata`** (no separate DB table needed)
- **Automatic role-based redirect** on login — each role lands on their dedicated dashboard
- **Auto-confirmed email** for internal staff accounts (no email verification step)
- **Session persistence** via HTTP-only cookies (SSR-safe with `@supabase/ssr`)
- **Middleware-level protection** — unauthenticated requests redirect to `/login` before hitting any page

---

### 👑 Admin Dashboard (`/admin`)

The supreme control panel with full plant-wide authority.

**KPI Analytics Cards:**
- Total garments produced across all production lines
- Plant average fabric wastage % (with 6.5% tolerance indicator)
- Plant rejection rate (rejected vs. verified orders)
- Total fabric yards consumed and total cutting batches

**Apparel Style Recipe Management (Full CRUD):**
- Create new recipes with: code, name, category, standard fabric yards/piece, wastage cap %, and component manifest
- Edit any existing recipe (components can be added/removed dynamically)
- Delete recipes (with cascade protection warning)
- Each recipe card shows: recipe code, category, std yards, wastage cap, all components with piece-per-garment multipliers

**Cross-Departmental Order Tracker:**
- Full table of all cutting orders across the entire factory
- State machine filter tabs: `ALL | CUTTING | QA Pending | Verified | Rejected`
- Each row shows: batch order number, style recipe, fabric roll ID, target qty, yards cut, state badge, auditor/rejection notes

**Staff User Management:**
- List all staff accounts (fetched from Supabase Auth admin API)
- Create new staff with: email, password, full name, and role assignment
- Change any user's role via dropdown (live update via Supabase Admin API)
- Delete staff accounts
- View last sign-in timestamp per user

**Department Navigation Shortcuts:**
- Quick-links to all 3 departmental dashboards (Cutting Floor, Verification QC, Sewing Assembly)

---

### ✂️ Cutting Supervisor Dashboard (`/cutting-supervisor`)

**Today's Stats Cards:**
- Total batches cut today
- Total fabric yards consumed today
- Active cutting throughput (garments count, in-progress vs. rejected)

**Active Cutting Table:**
- Live view of all `CUTTING_IN_PROGRESS` and `REJECTED` (returned for rework) orders
- For REJECTED orders: shows rejection note from verifier in an inline callout card
- Action button: **"Send to QA"** — transitions order to `PENDING_VERIFICATION`
- Rejected orders show **"Resubmit to QA"** button with red styling

**Initiate New Cutting Batch Modal:**
- Select recipe (dropdown with code + std yards/piece)
- Enter target garment quantity
- Enter fabric roll ID (e.g., `ROLL-9021`)
- Enter actual fabric yards cut
- On submit: creates order + automatically generates `VerificationItem` rows using the **Multiplier Engine** (`targetQty × piecesPerGarment` per component)

**Standard Production Recipes Reference:**
- Browse all available styles with spec cards (category, std yards, wastage cap, component list)

---

### ✅ Cutting Verifier Dashboard (`/verification`)

**Traffic Light Rules Guide:**
- 🟢 **GREEN** — Actual count exactly matches expected
- 🟡 **YELLOW** — Surplus detected (over expected)
- 🔴 **RED** — Shortage (under expected) → Hard Stop engaged

**Pending Verification Queue:**
- Card grid of all orders in `PENDING_VERIFICATION` state
- Each card shows: order number, dispatch time, style recipe, fabric roll, target qty, component count

**Interactive QC Audit Terminal (Modal):**
- Launched per order with "Launch Interactive Audit Terminal" button
- Component-by-component physical count table:
  - Component name
  - Pieces per garment
  - Expected quantity (auto-calculated)
  - Physical audit count input (editable number field, colour-coded live)
  - QC status badge (GREEN / YELLOW / RED updates instantly)
- **Hard-Stop Banner** appears when any component is RED — approval button is disabled
- **Rejection Note textarea** (mandatory if rejecting)
- **"Sign-Off & Approve Batch"** — sends `APPROVED` decision → order becomes `VERIFIED`
- **"Reject & Return to Cutting Table"** — sends `REJECTED` decision + note → order returns to cutting floor

---

### 🧵 Sewing Supervisor Dashboard (`/sewing`)

**Queue Statistics:**
- Verified queue depth (batches ready for assembly)
- Total garments ready for sewing machines
- Active assembly clearances (batches cleared this session)

**Verified Sewing Queue:**
- Only shows `VERIFIED` orders (enforced by isolated `/api/sewing/queue` endpoint)
- Each card shows:
  - QC Certified Passed badge
  - Order number, style recipe, target garment count
  - **Immutable Audit Trail**: QC verifier name + audit timestamp
  - **Fabric Wastage Rate**: actual % vs. recipe cap (red indicator if over cap)
  - Component piece manifest breakdown (all parts with actual counted quantities)
- **"Start Assembly • Clear for Operators"** button

**Assembly Clearance Modal:**
- View target garment qty
- Select designated assembly line (Alpha/Beta/Gamma with station numbers)
- Add optional operator notes
- Confirm and release — batch removed from queue locally (session-based clearance)

---

## 🗄️ Database Schema (Supabase PostgreSQL via Prisma)

### How Prisma Connects to Supabase

The project uses **two connection strings** to handle both connection pooling and direct migrations:

```env
# PgBouncer pooler (for app queries — used in production)
DATABASE_URL="postgresql://postgres.wvlbtyosjmcjdchdcewd:<password>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for Prisma migrations and introspection)
DIRECT_URL="postgresql://postgres.wvlbtyosjmcjdchdcewd:<password>@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

In `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // PgBouncer pooler (port 6543)
  directUrl = env("DIRECT_URL")      // Direct connection (port 5432)
}
```

- **`DATABASE_URL`** (port 6543) uses PgBouncer — ideal for serverless Next.js functions that open/close connections frequently
- **`DIRECT_URL`** (port 5432) bypasses PgBouncer — required for `prisma migrate` and `prisma db push` because migrations need a persistent connection

---

### Tables

#### `Recipe`
Master garment style specification (created and managed exclusively by Admins).

| Column | Type | Description |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `recipeCode` | `String` (UNIQUE) | Short code like `REC-BL01` |
| `name` | `String` | Style name (e.g., "Casual Blouse") |
| `category` | `String` | Garment category (e.g., "Blouse", "Crop Top") |
| `stdFabricYards` | `Float` | Standard fabric yards required per garment |
| `wastageCap` | `Float` | Maximum allowed fabric wastage % |
| `createdAt` | `DateTime` | Auto-generated timestamp |

**Relations:** one-to-many with `RecipeComponent`, one-to-many with `CuttingOrder`

---

#### `RecipeComponent`
Each individual cut piece that makes up a garment in a recipe.

| Column | Type | Description |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `recipeId` | `String` | FK → `Recipe.id` (cascade delete) |
| `componentName` | `String` | Piece name (e.g., "Front Body Panel", "Sleeves (Left & Right)") |
| `piecesPerGarment` | `Int` | How many of this piece per garment (e.g., 2 for sleeves) |
| `imageUrl` | `String?` | Optional reference image |

**Relations:** belongs to `Recipe`, one-to-many with `VerificationItem`

---

#### `CuttingOrder`
A production batch created by the Cutting Supervisor.

| Column | Type | Description |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `orderNo` | `String` (UNIQUE) | Auto-generated (e.g., `ORD-2026-0001`) |
| `recipeId` | `String` | FK → `Recipe.id` |
| `targetQty` | `Int` | How many garments to cut |
| `fabricRollId` | `String` | Fabric roll identifier (e.g., `ROLL-9021`) |
| `actualFabricYds` | `Float` | Actual fabric consumed in yards |
| `status` | `OrderStatus` (enum) | Current state: `CUTTING_IN_PROGRESS`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED` |
| `creatorId` | `String` | Supabase user ID of the cutting supervisor |
| `creatorEmail` | `String?` | Email of creator |
| `creatorName` | `String?` | Full name of creator |
| `createdAt` | `DateTime` | Auto-timestamp |
| `updatedAt` | `DateTime` | Auto-updated timestamp |

**Enums:**
```prisma
enum OrderStatus {
  CUTTING_IN_PROGRESS
  PENDING_VERIFICATION
  VERIFIED
  REJECTED
}
```

**Relations:** belongs to `Recipe`, one-to-many with `VerificationItem`, one-to-one with `VerificationLog`

---

#### `VerificationItem`
Auto-generated per component when an order is created. Stores the physical count result after QC audit.

| Column | Type | Description |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `orderId` | `String` | FK → `CuttingOrder.id` (cascade delete) |
| `componentId` | `String` | FK → `RecipeComponent.id` |
| `expectedQty` | `Int` | Auto-calculated: `targetQty × piecesPerGarment` |
| `actualQty` | `Int` | Physical count entered by verifier |
| `status` | `ItemStatus` (enum) | Traffic light: `GREEN`, `YELLOW`, `RED` |

**Enums:**
```prisma
enum ItemStatus {
  GREEN   # actualQty == expectedQty
  YELLOW  # actualQty > expectedQty (surplus)
  RED     # actualQty < expectedQty (shortage)
}
```

> **Multiplier Engine:** When a Cutting Supervisor creates an order for 100 garments with a recipe that has "Sleeves (pair)" at 2 pieces/garment, the system automatically creates a `VerificationItem` with `expectedQty = 200`.

---

#### `VerificationLog`
Immutable audit record written when a verifier makes their decision.

| Column | Type | Description |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `orderId` | `String` (UNIQUE) | FK → `CuttingOrder.id` (cascade delete) |
| `verifierId` | `String` | Supabase user ID of the verifier |
| `verifierName` | `String?` | Full name of verifier |
| `decision` | `String` | `"APPROVED"` or `"REJECTED"` |
| `rejectionNote` | `String?` | Mandatory defect description if rejected |
| `wastagePct` | `Float` | Auto-calculated: `((actualFabricYds - expectedFabric) / expectedFabric) × 100` |
| `timestamp` | `DateTime` | Auto-timestamp of audit decision |

> This log is **never updated** — it's an immutable audit trail visible to Admin and Sewing Supervisor.

---

## 🔑 Supabase Connection Architecture

### Three Supabase Clients

The project uses three distinct Supabase client configurations:

#### 1. Browser Client (`utils/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr';
// Used in React components and Client Components
// Uses ANON key — limited public access
```
Used in: `LoginForm.tsx`, `Navbar.tsx`, `AuthContext.tsx`

#### 2. Server Client (`utils/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Cookie-based session for Server Components and API Routes
// Reads/writes the auth session from HTTP cookies
```
Used in: API routes, Server Actions for auth, Middleware

#### 3. Admin Client (`utils/supabase/admin.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';
// Uses SERVICE_ROLE key — bypasses all Row Level Security
// Can create, delete, and modify any user
```
Used in: `app/action/admin.ts` only — server-side staff management

---

## 🛡️ How Admin Permissions Work

### Role Storage
Roles are stored in **Supabase `user_metadata`** — not in any database table. This means:
- No extra DB table for user roles
- Role travels with the JWT token automatically
- The middleware can read the role without a DB round-trip

```typescript
// User metadata structure
{
  fullName: "John Smith",
  role: "CUTTING_SUPERVISOR"  // or ADMIN, CUTTING_VERIFIER, SEWING_SUPERVISOR
}
```

---

### Layer 1: Middleware Route Protection (`middleware.ts`)

Every request (except static assets and API routes) passes through the middleware **before** reaching any page.

```
Request → middleware.ts
  ├── No session? → redirect to /login
  ├── Has session + visiting /login? → redirect to their dashboard
  └── Has session + wrong department? → redirect to their dashboard
```

**Role-to-Route mapping:**
| Role | Allowed Route | Redirect If Wrong |
|---|---|---|
| `ADMIN` | ALL routes (`/admin`, `/cutting-supervisor`, `/verification`, `/sewing`) | — |
| `CUTTING_SUPERVISOR` | `/cutting-supervisor` only | → `/cutting-supervisor` |
| `CUTTING_VERIFIER` | `/verification` only | → `/verification` |
| `SEWING_SUPERVISOR` | `/sewing` only | → `/sewing` |

---

### Layer 2: Page-Level Role Gate (each dashboard page)

Every dashboard page checks the role via `useAuth()` and immediately redirects if the role doesn't match:

```typescript
// Example from cutting-supervisor/page.tsx
const isAuthorized = role === 'CUTTING_SUPERVISOR' || role === 'ADMIN';

useEffect(() => {
  if (!authLoading && !user) router.push('/login');
  else if (!authLoading && user && !isAuthorized) router.push('/dashboard');
}, [user, authLoading, isAuthorized]);

if (!isAuthorized) return null; // Renders nothing until authorized
```

---

### Layer 3: Server-Side RBAC on Every API Endpoint

**Every mutating API route** re-validates the JWT on the server before processing:

```typescript
// Example from POST /api/orders
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const role = (user.user_metadata?.role || '').toUpperCase();
if (role !== 'ADMIN' && role !== 'CUTTING_SUPERVISOR') {
  return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
}
```

**API RBAC Matrix:**
| Endpoint | ADMIN | CUTTING_SUPERVISOR | CUTTING_VERIFIER | SEWING_SUPERVISOR |
|---|:---:|:---:|:---:|:---:|
| `POST /api/orders` | ✅ | ✅ | ❌ | ❌ |
| `GET /api/orders` | ✅ | ✅ | ✅ | ✅ |
| `PATCH /api/orders/[id]` | ✅ | ✅ | ❌ | ❌ |
| `POST /api/orders/[id]/verify` | ✅ | ❌ | ✅ | ❌ |
| `POST /api/recipes` | ✅ | ✅ | ❌ | ❌ |
| `PUT /api/recipes/[id]` | ✅ | ✅ | ❌ | ❌ |
| `DELETE /api/recipes/[id]` | ✅ | ✅ | ❌ | ❌ |
| `GET /api/sewing/queue` | ✅ | ✅ | ✅ | ✅ |
| Admin Server Actions | ✅ | ❌ | ❌ | ❌ |

---

### Layer 4: Hard-Stop Business Rule Enforcement (Server-side)

The verification endpoint enforces the hard-stop rule **server-side** — the client cannot bypass it:

```typescript
// POST /api/orders/[id]/verify
const hasShortage = processedItems.some(item => item.status === 'RED');

// SERVER-SIDE HARD STOP — no workaround possible
if (decision === 'APPROVED' && hasShortage) {
  return NextResponse.json({
    error: 'HARD STOP: Cannot approve an order with RED (shortage) components.'
  }, { status: 422 });
}
```

Even if someone bypasses the UI and calls the API directly with `APPROVED`, the server rejects it.

---

### Admin Staff Management Actions

The Admin uses Supabase's **Admin Auth API** (via service role key) to manage users:

```typescript
// Create user (admin.ts server actions)
supabaseAdmin.auth.admin.createUser({
  email, password,
  email_confirm: true,     // No email confirmation needed for internal staff
  user_metadata: { fullName, role }
})

// Update role
supabaseAdmin.auth.admin.updateUserById(userId, {
  user_metadata: { role: newRole }
})

// Delete user
supabaseAdmin.auth.admin.deleteUser(userId)

// List all users
supabaseAdmin.auth.admin.listUsers()
```

All of these use the `SUPABASE_SERVICE_ROLE_KEY` which has unrestricted admin access. These functions are `'use server'` — they only run on the server and are never exposed to the browser.

---

## ⚙️ Environment Variables

Create a `.env` file (or use the root-level `.env`) with:

```env
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase (Admin — Server Only, NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database — Prisma connections
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

# Firebase (if using Firebase Admin for secondary auth)
NEXT_PUBLIC_FIREBASE_API_KEY=...
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Push Database Schema to Supabase
```bash
npx prisma db push
```

### 3. Seed Initial Recipes
```bash
npm run seed
```
This creates two starter recipes:
- **Casual Blouse** (`REC-BL01`) — 1.8 yds/pc, 5% cap, 5 components
- **Crop Top** (`REC-CT02`) — 1.1 yds/pc, 8% cap, 5 components

### 4. Run Development Server
```bash
npm run dev
```

### 5. Create the First Admin Account
Go to your Supabase Dashboard → Authentication → Add User, then set `user_metadata` to:
```json
{
  "fullName": "System Administrator",
  "role": "ADMIN"
}
```

Or use the Supabase Dashboard SQL editor:
```sql
UPDATE auth.users
SET raw_user_meta_data = '{"fullName": "Admin", "role": "ADMIN"}'::jsonb
WHERE email = 'admin@yourcompany.com';
```

Once an admin exists, they can create all other staff accounts from the `/admin` dashboard.

---

## 👥 User Roles Summary

| Role | Dashboard | Can Do |
|---|---|---|
| `ADMIN` | `/admin` | Everything: create/manage recipes, view all orders, manage staff, access all departments |
| `CUTTING_SUPERVISOR` | `/cutting-supervisor` | Create cutting batches, send to QA, view rejection feedback, rework and resubmit |
| `CUTTING_VERIFIER` | `/verification` | Audit pending orders component-by-component, approve (if no shortage) or reject with note |
| `SEWING_SUPERVISOR` | `/sewing` | View QC-certified orders, check audit trail + wastage, start assembly line clearance |

---

## 📜 Scripts

```bash
npm run dev        # Start Next.js development server
npm run build      # Production build
npm run start      # Start production server
npm run seed       # Seed initial recipe data
npm run lint       # Run ESLint
```

---

## 🔁 Key Design Decisions

1. **Roles in user_metadata, not DB** — Avoids a join on every request; the JWT carries the role automatically.

2. **Three Supabase clients** — Browser, Server (cookie-based), and Admin (service role) each serve different needs and security contexts.

3. **PgBouncer pooler URL** — Next.js serverless functions open/close DB connections on every request. PgBouncer pools those connections to prevent exhausting Postgres connection limits.

4. **Prisma transactions** — Order creation and verification both use `prisma.$transaction()` to ensure atomicity (either everything saves or nothing does).

5. **Immutable audit log** — `VerificationLog` is written once and never updated. The sewing supervisor sees the exact state the verifier certified.

6. **Server-side hard stop** — The shortage check runs on the server (`status 422`) so it cannot be bypassed by API manipulation or UI hacking.

7. **Multiplier Engine** — `expectedQty = targetQty × piecesPerGarment` is computed and stored at order creation time, so the verifier sees the exact required count without recalculating.
