# CLAUDE.md

## Project Overview

RealWorld "Conduit" - a Medium.com clone backend API. Reference implementation of the [RealWorld spec](https://github.com/gothinkster/realworld).

## Tech Stack

- **Runtime:** Bun
- **Framework:** Nitro (UnJS)
- **Language:** TypeScript
- **ORM:** Prisma 7 (LibSQL adapter, SQLite)
- **Auth:** JWT (60-day expiry)
- **Validation:** Zod
- **Password Hashing:** bcryptjs
- **API Testing:** Hurl (source of truth), Bruno (generated from Hurl)

## Project Structure

```
apps/api/                     # Main API application
  server/
    routes/api/               # File-based routing (Nitro convention)
      articles/               # CRUD + feed, favorites, comments
      notifications/          # List, mark read (single + bulk)
      profiles/               # Follow/unfollow
      tags/                   # Tag listing
      user/                   # Current user get/update
      users/                  # Register, login
    utils/                    # Helpers, mappers, validators
    models/                   # TypeScript interfaces
    schemas/                  # Zod validation schemas
    auth-event-handler.ts     # JWT auth middleware
    error-handler.ts          # Global error handler
  prisma/
    schema.prisma             # DB schema (User, Article, Comment, Tag, Notification)
apps/documentation/           # Astro/Starlight docs site
specs/api/                    # Hurl & Bruno test collections, openapi.yml
```

## Common Commands

```bash
# Setup
make reference-implementation-setup

# Dev server (port 3000)
make reference-implementation-run-for-hurl

# Unit tests
make reference-implementation-unit-test
# or: cd apps/api && bun test

# API integration tests
make reference-implementation-test-with-hurl
make reference-implementation-test-with-bruno

# DB operations
cd apps/api && bun run db:generate   # Generate Prisma client
cd apps/api && bun run db:push       # Apply schema changes

# Cleanup
make running-processes-clean         # Kill stray Nitro processes
```

## Environment Variables

- `JWT_SECRET` (required) - JWT signing secret; app fails fast if missing
- `DATABASE_URL` (optional) - defaults to `file:./dev.db`
- `BCRYPT_SALT_ROUNDS` (optional) - defaults to 10

## Key Conventions

- **Route files:** `[param]/index.get.ts` pattern for file-based routing
- **Protected routes:** Wrap with `definePrivateEventHandler`; optional auth via `{requireAuth: false}`
- **Utils:** Prefixed with `use` (e.g., `usePrisma()`, `useHashPassword()`)
- **Mappers:** `articleMapper`, `authorMapper`, `notificationMapper` transform DB models to API response format
- **Notifications:** Created via `useCreateNotification()` on follow, favorite, and comment events; self-notifications are skipped
- **Error handling:** `HttpException` class for structured errors; Zod errors -> 422; unique constraint (P2002) -> 409
- **DB patterns:** `connectOrCreate` for tags, `_count` for aggregates, transactions for atomic operations
- **Slugs:** Title + random UUID suffix to allow duplicate titles
- **Response format:** Always wrapped (e.g., `{ article: {...} }`, `{ user: {...} }`)
- **Error response format:** `{ errors: { field: ["message"] } }`

## Commit Conventions

Types: `docs`, `feat`, `fix`. Scopes: `specs`, `project`. 100 char line limit. See CONTRIBUTING.md.
