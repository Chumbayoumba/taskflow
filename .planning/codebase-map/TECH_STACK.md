# Technology Stack

**Analysis Date:** 2025-01-27

## Languages

**Primary:**
- TypeScript 5.x — All application code (`src/**/*.ts`, `src/**/*.tsx`)
- Strict mode enabled in `tsconfig.json` (`"strict": true`)
- Target: ES2017, Module: ESNext, Module resolution: Bundler
- Path alias: `@/*` → `./src/*`

**Secondary:**
- CSS (Tailwind CSS 4) — `src/app/globals.css`
- SQL (via Prisma ORM) — `prisma/schema.prisma`

## Runtime

**Environment:**
- Node.js 20+ (stated in `README.md` requirements)
- Next.js 16 runtime (React Server Components + Edge Middleware)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js `16.1.6` — Full-stack React framework (App Router, Server Components, Server Actions)
- React `19.2.3` — UI library (latest React 19 with RSC support)
- React DOM `19.2.3` — DOM renderer

**Authentication:**
- NextAuth (Auth.js v5) `^5.0.0-beta.30` — Credentials provider with JWT sessions

**ORM/Database:**
- Prisma `^7.5.0` — ORM with PostgreSQL driver adapter
- `@prisma/client` `^7.5.0` — Generated client (output: `src/generated/prisma`)
- `@prisma/adapter-pg` `^7.5.0` — PostgreSQL driver adapter for Prisma 7

**Styling:**
- Tailwind CSS `^4` — Utility-first CSS framework (v4 with `@import "tailwindcss"` syntax)
- shadcn/ui `^4.0.6` — Component library (style: `base-nova`, base color: `neutral`)

**State Management:**
- Zustand `^5.0.11` — Client-side state (Kanban board optimistic updates)

**Validation:**
- Zod `^4.3.6` — Runtime validation on client and server

**Build/Dev:**
- ESLint `^9` — Linting (flat config format)
- `eslint-config-next` `16.1.6` — Next.js ESLint rules (core-web-vitals + TypeScript)
- `@tailwindcss/postcss` `^4` — PostCSS integration for Tailwind CSS 4
- TypeScript `^5` — Type checking

## Key Dependencies

**Critical (Application Logic):**
- `next-auth` `^5.0.0-beta.30` — Authentication (JWT strategy, Credentials provider)
- `@prisma/client` `^7.5.0` — Database access layer
- `@prisma/adapter-pg` `^7.5.0` — PostgreSQL connection via `pg` pool
- `pg` `^8.20.0` — PostgreSQL client driver
- `zod` `^4.3.6` — Schema validation for forms and server actions
- `zustand` `^5.0.11` — Kanban board state management
- `bcryptjs` `^3.0.3` — Password hashing (12 rounds)

**UI Components:**
- `@base-ui/react` `^1.3.0` — Base UI primitives (used by shadcn/ui `base-nova` style)
- `class-variance-authority` `^0.7.1` — Variant-based component styling (CVA)
- `clsx` `^2.1.1` — Conditional CSS class names
- `tailwind-merge` `^3.5.0` — Tailwind class deduplication (used in `cn()` utility at `src/lib/utils.ts`)
- `lucide-react` `^0.577.0` — Icon library
- `sonner` `^2.0.7` — Toast notifications
- `tw-animate-css` `^1.4.0` — Tailwind animation utilities

**Feature-Specific:**
- `@dnd-kit/react` `^0.3.2` — Drag and drop (with `@dnd-kit/abstract`, `@dnd-kit/dom`, `@dnd-kit/helpers`)
- `recharts` `^3.8.0` — Charts/analytics visualization
- `react-day-picker` `^9.14.0` — Date picker component
- `date-fns` `^4.1.0` — Date formatting utilities

**Unused/Legacy (present but may not be actively used):**
- `@auth/prisma-adapter` `^2.11.1` — Prisma adapter for Auth.js (NOT used; app uses JWT sessions, not database sessions)
- `@prisma/adapter-better-sqlite3` `^7.5.0` — SQLite adapter (NOT used in production; production uses PostgreSQL)
- `better-sqlite3` `^12.6.2` — SQLite driver (NOT used in production)
- `@neondatabase/serverless` `^1.0.2` — Neon serverless driver (NOT used; `src/lib/prisma.ts` uses `pg` pool directly)
- `tinyexec` `^1.0.3` — Purpose unclear in this codebase

## Database

**Engine:** PostgreSQL 16+
**ORM:** Prisma 7 with driver adapter pattern (`@prisma/adapter-pg`)
**Schema:** `prisma/schema.prisma`
**Migrations:** `prisma/migrations/` (single migration: `20260313181305_init`)
**Seed:** `prisma/seed.ts` (creates demo users, projects, tasks, notifications)
**Generated Client:** `src/generated/prisma` (gitignored, regenerated via `npx prisma generate`)

**Connection Pattern:** (`src/lib/prisma.ts`)
```typescript
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);
// Global singleton pattern for dev hot-reload
```

**Models (5 tables):**
| Model | Key Fields | Relationships |
|-------|-----------|---------------|
| `User` | id (cuid), email (unique), name, passwordHash | owns Projects, member of ProjectMembers, assigned/created Tasks, has Notifications |
| `Project` | id (cuid), name, description, color, ownerId | belongs to User (owner), has ProjectMembers, has Tasks |
| `ProjectMember` | id (cuid), role (OWNER/ADMIN/MEMBER), userId, projectId | belongs to User + Project, unique constraint on [userId, projectId] |
| `Task` | id (cuid), title, status (TODO/IN_PROGRESS/REVIEW/DONE), priority (LOW/MEDIUM/HIGH/URGENT), order, deadline, assigneeId, creatorId, projectId | belongs to Project, assignee User, creator User, has Notifications |
| `Notification` | id (cuid), type, message, read, userId, taskId | belongs to User, optionally linked to Task |

**Indexes:**
- `Project`: `@@index([ownerId])`
- `ProjectMember`: `@@index([projectId])`, `@@unique([userId, projectId])`
- `Task`: `@@index([projectId, status])`, `@@index([assigneeId])`, `@@index([deadline])`
- `Notification`: `@@index([userId, read])`, `@@index([createdAt])`

## Styling System

**Framework:** Tailwind CSS 4 (PostCSS plugin via `@tailwindcss/postcss`)
**Component Library:** shadcn/ui v4 (`base-nova` style, RSC-enabled)
**Configuration:** `components.json`
- Style: `base-nova`
- Base color: `neutral`
- CSS variables: enabled (oklch color space)
- Icon library: `lucide`
- Component aliases: `@/components/ui`, `@/components`, `@/lib`, `@/hooks`

**CSS Architecture:** (`src/app/globals.css`)
- Tailwind CSS 4 import syntax: `@import "tailwindcss"`
- `tw-animate-css` animations
- `shadcn/tailwind.css` base styles
- CSS custom properties for theming (light + dark mode via `.dark` class)
- Custom fonts: Inter (sans), JetBrains Mono (mono)

**shadcn/ui Components Installed (17):**
`avatar`, `badge`, `button`, `calendar`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `select`, `separator`, `sheet`, `switch`, `tabs`, `textarea`, `tooltip`

**Utility Function:** `cn()` at `src/lib/utils.ts` — combines `clsx` + `tailwind-merge`

## Authentication

**Provider:** Auth.js v5 (NextAuth) `^5.0.0-beta.30`
**Strategy:** Credentials (email + password) with JWT sessions
**Password Hashing:** bcryptjs (12 rounds)

**Configuration Files:**
- `src/auth.ts` — Main auth config with Credentials provider, JWT callbacks, authorization logic
- `src/auth.config.ts` — Edge-compatible config (no DB imports) for middleware
- `src/middleware.ts` — Edge middleware using lightweight auth config
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route handler

**Session Shape:**
```typescript
// JWT token includes user.id
// Session includes session.user.id
```

**Route Protection:**
- `/dashboard/*`, `/projects/*`, `/notifications/*` — require authentication (redirect to login)
- `/login`, `/register` — redirect to `/dashboard` if already authenticated
- Middleware matcher excludes: `api`, `_next/static`, `_next/image`, static assets

**Custom Pages:**
- Sign-in: `/login`

## API Layer

**Primary Pattern:** Next.js Server Actions (`"use server"` directives)
- `src/actions/auth.ts` — `register()`, `login()`
- `src/actions/projects.ts` — `createProject()`, `getProjects()`, `getProject()`, `updateProject()`, `deleteProject()`, `addMember()`, `removeMember()`, `changeMemberRole()`
- `src/actions/tasks.ts` — `createTask()`, `updateTask()`, `moveTask()`, `deleteTask()`, `getProjectTasks()`
- `src/actions/notifications.ts` — `getNotifications()`, `getUnreadCount()`, `markAsRead()`, `markAllAsRead()`, `checkDeadlines()`
- `src/actions/user.ts` — `updateProfile()`, `searchGlobal()`

**API Routes:**
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler only

**No tRPC, no REST API layer.** All data mutations/queries go through Server Actions.

**Action Pattern:**
```typescript
// Every action follows this pattern:
// 1. Get current user from session via auth()
// 2. Validate input with Zod
// 3. Check authorization (project membership)
// 4. Perform DB operation via Prisma
// 5. Create notifications if needed
// 6. revalidatePath() for cache invalidation
// 7. Return ActionResult<T> type
```

**Result Type:** (`src/types/index.ts`)
```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
```

## State Management

**Server State:** Next.js Server Components fetch data directly (no client-side data fetching library)
**Client State:** Zustand `^5.0.11`
- `src/store/kanban-store.ts` — Kanban board columns, optimistic task move/add/update/remove
**Session State:** `next-auth/react` `useSession()` via `SessionProvider` (wrapped in dashboard layout)
**Custom Hooks:**
- `src/hooks/use-current-user.ts` — Extracts typed user from session
- `src/hooks/use-notifications.ts` — Polls unread count every 30 seconds

## Fonts

- **Primary (sans):** Inter — loaded via `next/font/google` (subsets: latin, cyrillic)
- **Monospace:** JetBrains Mono — loaded via `next/font/google` (subsets: latin, cyrillic)
- CSS variables: `--font-inter`, `--font-jetbrains-mono`

## Localization

**Language:** Russian (UI labels, validation messages, notification text)
- `<html lang="ru">` in root layout
- All user-facing strings are in Russian
- Cyrillic font subsets loaded

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript config (strict, path aliases) |
| `next.config.ts` | Next.js config (empty — defaults) |
| `eslint.config.mjs` | ESLint 9 flat config (next core-web-vitals + TS) |
| `postcss.config.mjs` | PostCSS with `@tailwindcss/postcss` plugin |
| `components.json` | shadcn/ui configuration |
| `prisma.config.ts` | Prisma config (schema path, migrations path, datasource URL) |
| `prisma/schema.prisma` | Database schema |
| `.gitignore` | Git ignore rules |

## Environment Variables

**Required (from README.md):**
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Auth.js secret key
- `NEXTAUTH_URL` — Application URL
- `NEXT_PUBLIC_APP_URL` — Public application URL
- `AUTH_TRUST_HOST` — Set to `true` for reverse proxy deployments

**Files:** `.env` present (gitignored), `.env.example` present

## NPM Scripts

```bash
npm run dev       # next dev — development server
npm run build     # next build — production build
npm run start     # next start — production server
npm run lint      # eslint — run linting
```

## Testing

**No testing framework configured.** No test files exist, no jest/vitest config, no test dependencies.

## Deployment

**Production:** Hetzner VPS
- Nginx reverse proxy with Cloudflare SSL
- PM2 process manager for Node.js
- PostgreSQL 16 database
- Node.js 20 runtime

**Local Development:**
- SQLite support is present as a dependency but not configured in `src/lib/prisma.ts` (uses PostgreSQL)
- `dev.db` file exists (likely leftover from early development with SQLite)

---

*Stack analysis: 2025-01-27*
