# TaskFlow

SaaS-приложение для командного управления задачами: проекты, Kanban-доски, детальные страницы задач, комментарии, чеклисты, зависимости, теги, аналитика и уведомления.

Прод: [https://taskflow.egor-dev.ru](https://taskflow.egor-dev.ru)

GitHub: [https://github.com/Chumbayoumba/taskflow](https://github.com/Chumbayoumba/taskflow)

## Что реализовано

### Core workflow

- Регистрация и логин через email + password
- Проекты с owner / admin / member ролями
- Kanban flow: `TODO → IN_PROGRESS → REVIEW → DONE`
- Drag-and-drop задач на доске
- Приоритеты: `LOW / MEDIUM / HIGH / URGENT`
- Дедлайны, исполнитель, создатель, история изменений

### Task management

- Отдельная страница задачи
- Комментарии внутри задачи
- Activity feed по изменениям
- Checklist с отметкой времени завершения
- Зависимости между задачами
- Теги и фильтрация доски
- Глобальный поиск по задачам и проектам

### Notifications

- Уведомления о назначении задачи
- Уведомления о смене статуса
- Deadline warning за 24 часа
- Overdue notifications
- Badge непрочитанных уведомлений в header и sidebar
- Toast-уведомления в интерфейсе
- Настройки типов уведомлений в профиле

### Profile / UX

- Загрузка аватара в настройках
- Мгновенное обновление аватара в settings, header и sidebar
- Аватары в карточках и деталях задач
- Responsive layout

### Analytics

- Общая статистика по проекту
- Распределение задач по статусам
- Распределение по приоритетам
- Completion rate
- Просроченные задачи

## Технический стек

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Prisma 7
- Auth.js v5
- Zustand
- Tailwind CSS 4
- shadcn/ui + Base UI
- Sonner
- Recharts
- Vitest

## База данных и Prisma

Проект поддерживает два режима:

- **local/dev**: SQLite через `@prisma/adapter-better-sqlite3`
- **production**: PostgreSQL через `@prisma/adapter-pg`

Выбор адаптера делается автоматически по `DATABASE_URL`.

Примеры:

```env
# Local SQLite
DATABASE_URL="file:./dev.db"

# Production PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/taskflow"
```

## Быстрый старт

### 1. Установка

```bash
git clone https://github.com/Chumbayoumba/taskflow.git
cd taskflow
npm install
```

### 2. Настройка окружения

Создай `.env`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
```

### 3. Prisma

```bash
npx prisma generate
npx prisma db push
```

### 4. Seed (опционально)

```bash
npx tsx prisma/seed.ts
```

### 5. Запуск

```bash
npm run dev
```

## Команды

```bash
npm run dev
npm run test
npm run lint
npm run build
```

## Структура проекта

```text
src/
  actions/        server actions
  app/            routes and pages
  components/     UI by feature
  generated/      prisma client
  hooks/          custom hooks
  lib/            prisma, constants, utils
  store/          zustand stores
  types/          shared types
  validations/    zod schemas
prisma/
  schema.prisma
  seed.ts
```

## Ключевые архитектурные решения

- Server Actions для мутаций
- JWT session strategy в Auth.js
- Optimistic UI для Kanban
- Автоматическая генерация deadline notifications при notification polling
- Общий session-based current user для header/sidebar
- Regression tests на критичные баги уведомлений и аватаров

## Верификация

Перед последним деплоем проект был полностью проверен:

- `npm run test`
- `npm run lint`
- `npm run build`

Все проверки проходят успешно.

## Production

Текущий production deploy:

- VPS + PM2
- Nginx reverse proxy
- Cloudflare
- PostgreSQL

URL: [https://taskflow.egor-dev.ru](https://taskflow.egor-dev.ru)

## Статус репозитория

Репозиторий поддерживается в актуальном состоянии. README описывает текущее поведение системы, включая:

- task detail workflow
- notifications
- avatars
- local/prod database setup
- verification commands

## License

MIT
