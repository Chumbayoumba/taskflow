# 🚀 TaskFlow — SaaS Task Management Platform

**Live Demo:** [https://taskflow.egor-dev.ru](https://taskflow.egor-dev.ru)

A full-featured SaaS project management platform with Kanban boards, team collaboration, role-based access control, analytics, and real-time notifications.

## ✨ Features

- **📋 Kanban Board** — Drag-and-drop task management with 4 columns (To Do → In Progress → Review → Done)
- **👥 Team Collaboration** — Create projects, invite members by email, assign roles (Owner/Admin/Member)
- **🔐 Authentication** — Secure email/password auth with Auth.js v5 (JWT sessions)
- **📊 Analytics** — Task distribution by status/priority, overdue tracking, completion rates with Recharts
- **🔔 Notifications** — Deadline warnings (24h auto-check), task assignments, status changes
- **⚙️ Project Settings** — Rename, description, color picker, member management, delete (Owner only)
- **🎨 Modern UI** — Inter font, priority/status color coding, responsive design
- **🔒 Role-Based Access** — Owner > Admin > Member with granular permissions

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Server Components) |
| **Language** | TypeScript (strict mode) |
| **ORM** | Prisma 7 with PostgreSQL driver adapter |
| **Database** | PostgreSQL 16 |
| **Auth** | Auth.js v5 (NextAuth) with Credentials + JWT |
| **UI** | shadcn/ui (Base UI variant) + Tailwind CSS 4 |
| **Drag & Drop** | HTML5 DnD API |
| **State** | Zustand |
| **Validation** | Zod |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Hosting** | Hetzner VPS + Nginx + PM2 + Cloudflare |

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login & Register pages
│   ├── (dashboard)/         # Protected routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── projects/        # Projects CRUD
│   │   │   └── [projectId]/ # Project sub-pages
│   │   │       ├── board/   # Kanban board
│   │   │       ├── members/ # Member management
│   │   │       ├── analytics/ # Charts & stats
│   │   │       └── settings/  # Project settings
│   │   ├── notifications/   # Notification center
│   │   └── settings/        # User settings
│   └── api/auth/            # Auth.js API routes
├── actions/                 # Server Actions (auth, projects, tasks, notifications)
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Login/Register forms
│   ├── dashboard/           # Sidebar, Header
│   ├── kanban/              # Board, Column, TaskCard, TaskDialog
│   ├── members/             # Member management
│   └── project/             # Project tabs, settings
├── lib/                     # Prisma client, utils, constants
├── store/                   # Zustand stores
├── hooks/                   # Custom React hooks
├── validations/             # Zod schemas
└── types/                   # TypeScript types
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Installation

```bash
# Clone the repository
git clone https://github.com/egordev-playground/taskflow.git
cd taskflow

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional — creates demo users & projects)
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/taskflow"

# Auth.js Secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your-secret-key-here"

# App URL
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
```

### Demo Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | Password123 | Project Owner |
| bob@example.com | Password123 | Admin |
| charlie@example.com | Password123 | Member |

## 📊 Database Schema

- **User** — Authentication & profile
- **Project** — Teams with color coding and descriptions
- **ProjectMember** — Role-based membership (Owner/Admin/Member)
- **Task** — Title, description, status, priority, assignee, deadline
- **Notification** — Assignment, deadline warning/overdue, status change, invite alerts

## 🏗 Architecture Decisions

- **Server Components by default** — Client Components only for interactivity
- **Server Actions** — All mutations through Next.js Server Actions with Zod validation
- **JWT Sessions** — Optimized for Edge middleware
- **Optimistic Updates** — Zustand store for instant Kanban drag-and-drop feedback
- **Auto Deadline Check** — Integrated into notification polling (checks every fetch)
- **Role-Based Permissions** — Owner controls membership and project settings

## 📦 Deployment

Deployed on Hetzner VPS with:
- **Nginx** reverse proxy with SSL (Cloudflare)
- **PM2** process manager
- **PostgreSQL 16** database
- **Node.js 20** runtime

Live at: [https://taskflow.egor-dev.ru](https://taskflow.egor-dev.ru)

## 📄 License

MIT
