# Code Style & Conventions

## TypeScript
- Strict mode enabled
- `type` imports preferred over `interface` for data shapes
- Server Actions use `"use server"` directive
- Client components use `"use client"` directive
- Zod schemas in `src/validations/`

## Naming
- Files: kebab-case (`task-card.tsx`, `kanban-store.ts`)
- Components: PascalCase (`TaskCard`, `Board`)
- Functions: camelCase (`createTask`, `getProjectTasks`)
- Constants: UPPER_SNAKE_CASE (`TASK_STATUSES`, `PRIORITY_CONFIG`)
- DB models: PascalCase singular (`Task`, `User`)
- DB fields: camelCase (`creatorId`, `assigneeId`)

## Patterns
- ActionResult<T> type for server action responses
- `getCurrentUserId()` helper in each action file
- `checkProjectAccess()` for authorization
- `revalidatePath()` after mutations
- Zustand stores for client-side state
- shadcn/ui components in `src/components/ui/`

## Task Completion
- Run `npm run lint` to check for errors
- Run `npm run build` to verify build passes
- Test affected pages manually via dev server
