# GlobeTrotter — Personalized Multi-City Route Planner

An editorial, cartography-inspired multi-city travel itinerary planner and journal built for modern explorers. GlobeTrotter helps travelers effortlessly organize destinations, construct chronological daily itineraries, manage multi-currency budgets, and share interactive route logs with the explorer community.

---

## 1. System Architecture

GlobeTrotter is built as a high-performance **Turborepo monorepo** with dedicated full-stack services and shared packages:

```
GlobeTrotter/
├── apps/
│   ├── web/                 # Next.js 15 App Router Frontend (React 19, Tailwind CSS v4)
│   └── api/                 # NestJS TypeScript Backend REST API (MongoDB + Mongoose)
├── packages/
│   ├── ui/                  # Shared Atlas & Ink Design System & Component Library
│   └── config/              # Shared TypeScript & ESLint configurations
└── GlobeTrotter_blueprint/  # Engineering Master Blueprints & Motion Design Specs
```

### Technology Stack

| Layer | Technologies |
|---|---|
| **Web Frontend** | **Next.js 15** (App Router), **React 19**, **TypeScript** |
| **Styling & Design System** | **Tailwind CSS v4**, **Atlas & Ink** design tokens, Vanilla CSS custom properties |
| **Component Primitives** | **Radix UI** primitives, custom accessible UI components, **Lucide Icons** |
| **Motion & Animation** | **Framer Motion** (staggered entrances, layout transitions), **GSAP** (route thread animation) |
| **API Backend** | **NestJS 11** (modular architecture, controllers, services, guards, interceptors) |
| **Database & ODM** | **MongoDB** (v7.0+) with **Mongoose ODM** (nested subdocuments, compound indexes) |
| **Authentication** | **JWT Access + Refresh Token Rotation** via NestJS Passport, **Bcrypt** (12 rounds) |
| **File Storage** | Multi-part local/cloud image upload pipeline (`/uploads/avatars`) |
| **Notifications** | **Sonner** stacked toast system with dark/light theme support |

---

## 2. Product Flow

GlobeTrotter guides travelers through an intuitive, editorial expedition journey:

```mermaid
graph LR
    A[Register / Login] --> B[Dashboard]
    B --> C[Create Trip]
    C --> D[Itinerary Builder]
    D --> E[Itinerary & Budget]
    E --> F[Calendar View]
    F --> G[Share & Community]
    G --> H[Explorer Profile]
```

1. **Registration & Onboarding**: Create an explorer profile with avatar upload, bio, travel style, and credentials.
2. **Authentication**: Secure login via email or username, issuing JWT access tokens and long-lived refresh tokens.
3. **Explorer Dashboard**: High-level overview of active journeys, top regional destinations, stats, and trip shortcuts.
4. **Create Trip**: Step-by-step route initialization (Trip Name, Start/End Dates, Budget Estimate, Visibility).
5. **Itinerary Builder**: Multi-stop ordering with drag-and-drop sections, day schedules, and activity assignments.
6. **Itinerary & Budget**: Chronological activity timeline paired with categorized expense tracking (Transport, Stay, Activity, Meals).
7. **Calendar**: Multi-month interactive grid visualizing trip spans and day activities.
8. **Community & Dispatch Log**: Share public trip links, explore community dispatches, and like/bookmark routes.
9. **Admin Panel**: User role management, city/activity catalog moderation, and global platform trends.

---

## 3. Current Implementation Progress

| Milestone | Status | Description |
|---|---|---|
| **Phase 0 — Foundations** | ✅ Complete | Monorepo scaffold, Atlas & Ink design tokens, responsive layout shells, theme provider |
| **Phase 1 — Authentication** | ✅ Complete | Full registration & login screens, form validation (Zod), JWT access/refresh token rotation, bcrypt password hashing, MongoDB user persistence |
| **Global UI Consistency Pass** | ✅ Complete | Standardized cartographic navbar across all routes, 44px touch targets, deterministic input padding, zero text/icon overlap |
| **Global Theme System** | ✅ Complete | Dark-first default (`#0E1420`), full light-mode support (`#F6F1E4`), theme persistence |
| **Database Migration (MongoDB)** | ✅ Complete | Replaced legacy relational setup with MongoDB + Mongoose, index optimization, clean schema models |
| **Phase 2 — Dashboard & Trips** | 🔄 In Progress | Dashboard home, top cities discovery, trip creation models, and user profile management |

---

## 4. MongoDB Data Architecture

GlobeTrotter utilizes **MongoDB** as its primary and only database. The data model is optimized for document nesting, fast indexed queries, and flexible itinerary structures.

### Core Collections & Models

- **`users`**: Explorer profiles, email/username unique indices, hashed credentials, roles (`USER` / `ADMIN`), location metadata.
- **`refresh_tokens`**: Hashed rotation tokens linked to user IDs with automated expiry and revocation flags.
- **`trips`**: Multi-city journey documents embedding nested **`stops`** and chronological **`itineraryItems`**.
- **`cities`**: Global destination directory indexed by name and country with cost and popularity metrics.
- **`activities`**: Curated city activities with category, duration, cost, and ratings.
- **`expenses`**: Multi-currency expense records tied to trips and optional stops across categories (`TRANSPORT`, `STAY`, `ACTIVITY`, `MEAL`, `OTHER`).
- **`community_posts`**: Explorer travel dispatches and photo logs.
- **`comments` & `likes`**: Interactive engagement data with compound unique indices.
- **`shared_itineraries`**: Unique public sharing tokens with view counts.
- **`saved_destinations`**: User bookmarks and wishlists.

---

## 5. Visual Identity — "Atlas & Ink"

GlobeTrotter avoids generic SaaS/AI aesthetics in favor of a bespoke **travel-journal and cartographic design language**:

- **Dark-First Core**: Solid `#0E1420` (`ink-950`) canvas with `#141C2C` (`ink-900`) surfaces.
- **Warm Light Mode**: Refined `#F6F1E4` (`parchment-50`) background with high-contrast slate ink.
- **Restrained Brass Accents**: Primary action token `#C9973F` (`brass-500`) and hover token `#DDB35F` (`brass-400`).
- **Typography Hierarchy**:
  - **Fraunces**: Editorial serif for headlines, journal stamps, and screen titles.
  - **Inter**: Clean sans-serif workhorse for inputs, controls, and body copy.
  - **JetBrains Mono**: Monospace precision for coordinates, budgets, and timestamps.
- **Route Thread Signature**: Dashed brass connecting line with centered compass log badge.
- **Zero-Defect Standards**: Tested down to **320px width**, zero horizontal scroll, minimum 44×44px touch targets.

---

## 6. Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x` or `v11.x`
- **MongoDB**: `v7.0+` running locally on port `27017` (or MongoDB Atlas URI)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/MeghPatel0106/GlobeTrotter.git
cd GlobeTrotter

# Install all monorepo dependencies
npm install
```

### 2. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Review `.env` settings:

```env
MONGODB_URI="mongodb://localhost:27017/globetrotter"
JWT_SECRET="globetrotter_atlas_ink_secret_jwt_access_2026_x89"
JWT_REFRESH_SECRET="globetrotter_atlas_ink_secret_jwt_refresh_2026_x92"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
PORT=4000
NEXT_PUBLIC_API_URL="http://localhost:4000"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Start MongoDB

Ensure MongoDB is running locally:

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Docker alternative
docker run -d -p 27017:27017 --name globetrotter-mongo mongo:7.0
```

### 4. Run the Application

Start all services concurrently with Turborepo:

```bash
npm run dev
```

Or run services individually:

```bash
# Web Frontend (Next.js) -> http://localhost:3000
npm --prefix apps/web run dev

# API Backend (NestJS) -> http://localhost:4000
npm --prefix apps/api run dev
```

### 5. Build & Typecheck

```bash
# Typecheck entire monorepo
npm run typecheck

# Production build
npm run build
```

---

## 7. API Reference Summary

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/auth/register` | `POST` | Public | Register new explorer and create MongoDB document |
| `/auth/login` | `POST` | Public | Authenticate via email or username, returns JWT tokens |
| `/auth/refresh` | `POST` | Public | Exchange valid refresh token for new access/refresh pair |
| `/auth/logout` | `POST` | Authenticated | Revoke active refresh tokens |
| `/users/me` | `GET` | Authenticated | Fetch authenticated user profile data |
| `/users/me` | `PATCH` | Authenticated | Update user profile, bio, location, avatar |
| `/uploads/avatar` | `POST` | Public | Upload profile image (JPEG, PNG, WebP ≤ 5MB) |

---

## 8. License

Built for the **Odoo × LDCE Hackathon 2026** by the GlobeTrotter team.
