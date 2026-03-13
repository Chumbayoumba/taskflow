# 🚀 TaskFlow — SaaS Task Management Platform

A full-featured project management platform with Kanban boards, team collaboration, analytics, and real-time notifications.

## ✨ Features

- **📋 Kanban Board** — Drag-and-drop task management with 4 columns (To Do → In Progress → Review → Done)
- **👥 Team Collaboration** — Create projects, invite members, assign roles (Owner/Admin/Member)
- **🔐 Authentication** — Secure email/password auth with JWT sessions
- **📊 Analytics** — Task distribution by status/priority, overdue tracking, completion rates
- **🔔 Notifications** — Deadline warnings, task assignments, status changes
- **📱 Responsive** — Works on desktop, tablet, and mobile

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Server Components) |
| **Language** | TypeScript (strict mode) |
| **ORM** | Prisma 7 |
| **Database** | SQLite (dev) / PostgreSQL (production) |
| **Auth** | Auth.js v5 (NextAuth) with JWT |
| **UI** | shadcn/ui + Tailwind CSS 4 |
| **Drag & Drop** | HTML5 DnD API |
| **State** | Zustand |
| **Validation** | Zod |
| **Charts** | Recharts |
| **Icons** | Lucide React |

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & Register pages
│   ├── (dashboard)/     # Protected routes
│   │   ├── dashboard/   # Main dashboard
│   │   ├── projects/    # Projects CRUD + Kanban + Analytics
│   │   └── notifications/
│   └── api/auth/        # Auth.js API routes
├── actions/             # Server Actions (auth, projects, tasks, notifications)
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Login/Register forms
│   ├── dashboard/       # Sidebar, Header
│   └── kanban/          # Board, Column, TaskCard, TaskDialog
├── lib/                 # Prisma client, utils, constants
├── store/               # Zustand stores
├── hooks/               # Custom React hooks
├── validations/         # Zod schemas
└── types/               # TypeScript types
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/taskflow.git
cd taskflow

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database (optional)
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (SQLite for local dev)
DATABASE_URL="file:./dev.db"

# Auth.js Secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your-secret-key-here"

# App URL
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Demo Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@taskflow.com | password123 | Project Owner |
| dev@taskflow.com | password123 | Developer |
| designer@taskflow.com | password123 | Designer |

## 📊 Database Schema

- **User** — Authentication & profile
- **Project** — Teams with color coding
- **ProjectMember** — Role-based membership (Owner/Admin/Member)
- **Task** — Title, description, status, priority, assignee, deadline
- **Notification** — Assignment, deadline, status change alerts

## 🏗 Architecture Decisions

- **Server Components by default** — Client Components only for interactivity
- **Server Actions** — All mutations through Next.js Server Actions
- **JWT Sessions** — Optimized for serverless deployment
- **Optimistic Updates** — Zustand store for instant Kanban feedback
- **Zod Validation** — Shared schemas between client and server

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set environment variables
4. Deploy

For production, switch to PostgreSQL (e.g., Neon):

```env
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
```

## 📄 License

MIT
