# TaskFlow — Project Overview

## Purpose
TaskFlow is a SaaS task management platform with Kanban boards, team collaboration, analytics, and notifications.

## Tech Stack
- **Framework**: Next.js 16.1.6 + React 19.2.3
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL via Prisma 7.5.0
- **Auth**: Auth.js v5 (next-auth beta 30)
- **State Management**: Zustand 5.x
- **UI**: Tailwind CSS 4 + shadcn/ui + Lucide React icons
- **Validation**: Zod 4.x
- **Charts**: Recharts 3.x
- **Dates**: date-fns 4.x
- **Notifications**: Sonner 2.x (toast)

## Architecture
- Server Actions pattern (`src/actions/`)
- App Router with route groups: `(auth)`, `(dashboard)`
- Prisma client generated to `src/generated/prisma`
- Components organized by feature: kanban, analytics, members, notifications, search, etc.

## Key Models
User, Project, ProjectMember, Task, Notification

## Codebase Structure
```
src/
  actions/     — Server Actions (auth, tasks, projects, notifications, user)
  app/         — Next.js App Router pages
  components/  — UI components by feature
  generated/   — Prisma client
  hooks/       — Custom React hooks
  lib/         — Utils, constants, prisma client
  store/       — Zustand stores
  types/       — TypeScript types
  validations/ — Zod schemas
prisma/
  schema.prisma — Database schema
  seed.ts       — Seed script
```

## UI Language
Interface is in Russian. Code is in English.
