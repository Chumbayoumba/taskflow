import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import "dotenv/config";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../src/generated/prisma/client");
const prisma = new PrismaClient({ adapter });

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean existing data (order matters for foreign keys) ──
  await prisma.taskActivity.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  console.log("🗑️  Existing data cleaned");

  // ── Users (upsert for re-run safety) ──
  const passwordHash = await bcrypt.hash("Password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Алиса Иванова",
      email: "alice@example.com",
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Борис Петров",
      email: "bob@example.com",
      passwordHash,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      name: "Чарли Сидоров",
      email: "charlie@example.com",
      passwordHash,
    },
  });

  console.log("✅ Users created");

  // ── Projects ──
  const project1 = await prisma.project.create({
    data: {
      name: "TaskFlow MVP",
      description: "Разработка MVP платформы управления задачами",
      color: "#6366f1",
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "OWNER" },
          { userId: bob.id, role: "ADMIN" },
          { userId: charlie.id, role: "MEMBER" },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Маркетинг Q1",
      description: "Маркетинговые задачи на первый квартал",
      color: "#ec4899",
      ownerId: bob.id,
      members: {
        create: [
          { userId: bob.id, role: "OWNER" },
          { userId: alice.id, role: "MEMBER" },
        ],
      },
    },
  });

  console.log("✅ Projects created");

  // ── Tasks (created individually to capture IDs) ──
  const taskCiCd = await prisma.task.create({
    data: {
      title: "Настроить CI/CD pipeline",
      description: "Настроить GitHub Actions для автоматического деплоя",
      status: "DONE",
      priority: "HIGH",
      order: 0,
      deadline: daysAgo(2),
      projectId: project1.id,
      assigneeId: bob.id,
      creatorId: alice.id,
    },
  });

  const taskKanban = await prisma.task.create({
    data: {
      title: "Дизайн Kanban-доски",
      description: "Создать макет Kanban-доски с drag-and-drop",
      status: "DONE",
      priority: "URGENT",
      order: 1,
      deadline: daysAgo(1),
      projectId: project1.id,
      assigneeId: alice.id,
      creatorId: alice.id,
    },
  });

  const taskAuth = await prisma.task.create({
    data: {
      title: "Реализовать аутентификацию",
      description: "Email + пароль через Auth.js v5",
      status: "IN_PROGRESS",
      priority: "HIGH",
      order: 0,
      deadline: daysFromNow(1),
      projectId: project1.id,
      assigneeId: alice.id,
      creatorId: alice.id,
    },
  });

  const taskApi = await prisma.task.create({
    data: {
      title: "API для задач",
      description: "CRUD операции для задач через Server Actions",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      order: 1,
      deadline: daysFromNow(2),
      projectId: project1.id,
      assigneeId: bob.id,
      creatorId: alice.id,
    },
  });

  const taskNotifications = await prisma.task.create({
    data: {
      title: "Система уведомлений",
      description: "Уведомления о дедлайнах и назначениях",
      status: "REVIEW",
      priority: "MEDIUM",
      order: 0,
      deadline: daysFromNow(3),
      projectId: project1.id,
      assigneeId: charlie.id,
      creatorId: alice.id,
    },
  });

  const taskAnalytics = await prisma.task.create({
    data: {
      title: "Аналитика проекта",
      description: "Графики и статистика по задачам",
      status: "TODO",
      priority: "LOW",
      order: 0,
      deadline: daysFromNow(7),
      projectId: project1.id,
      assigneeId: null,
      creatorId: alice.id,
    },
  });

  const taskMobile = await prisma.task.create({
    data: {
      title: "Мобильная адаптация",
      description: "Responsive дизайн для мобильных устройств",
      status: "TODO",
      priority: "MEDIUM",
      order: 1,
      deadline: daysFromNow(10),
      projectId: project1.id,
      assigneeId: bob.id,
      creatorId: alice.id,
    },
  });

  const taskTests = await prisma.task.create({
    data: {
      title: "Написать тесты",
      description: "Unit и integration тесты",
      status: "TODO",
      priority: "HIGH",
      order: 2,
      deadline: null,
      projectId: project1.id,
      assigneeId: charlie.id,
      creatorId: bob.id,
    },
  });

  // Project 2 tasks
  const taskBlog = await prisma.task.create({
    data: {
      title: "Написать блог-пост о запуске",
      status: "TODO",
      priority: "HIGH",
      order: 0,
      deadline: daysFromNow(5),
      projectId: project2.id,
      assigneeId: alice.id,
      creatorId: bob.id,
    },
  });

  const taskSocial = await prisma.task.create({
    data: {
      title: "Подготовить контент для соцсетей",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      order: 0,
      projectId: project2.id,
      assigneeId: bob.id,
      creatorId: bob.id,
    },
  });

  const taskReadme = await prisma.task.create({
    data: {
      title: "Обновить README",
      description: "Добавить скриншоты и документацию",
      status: "TODO",
      priority: "LOW",
      order: 1,
      deadline: daysAgo(1), // overdue!
      projectId: project2.id,
      assigneeId: bob.id,
      creatorId: bob.id,
    },
  });

  console.log("✅ Tasks created (11)");

  // ── Tags ──
  await prisma.tag.create({ data: { name: "Bug", color: "#ef4444", projectId: project1.id } });
  const tagFeature = await prisma.tag.create({ data: { name: "Feature", color: "#3b82f6", projectId: project1.id } });
  const tagUiUx = await prisma.tag.create({ data: { name: "UI/UX", color: "#8b5cf6", projectId: project1.id } });
  const tagBackend = await prisma.tag.create({ data: { name: "Backend", color: "#f59e0b", projectId: project1.id } });
  const tagFrontend = await prisma.tag.create({ data: { name: "Frontend", color: "#10b981", projectId: project1.id } });
  const tagDocs = await prisma.tag.create({ data: { name: "Documentation", color: "#6b7280", projectId: project1.id } });
  await prisma.tag.create({ data: { name: "Urgent", color: "#dc2626", projectId: project1.id } });
  const tagImprovement = await prisma.tag.create({ data: { name: "Improvement", color: "#06b6d4", projectId: project1.id } });

  const tagContent = await prisma.tag.create({ data: { name: "Content", color: "#ec4899", projectId: project2.id } });
  const tagDesign = await prisma.tag.create({ data: { name: "Design", color: "#8b5cf6", projectId: project2.id } });
  const tagSeo = await prisma.tag.create({ data: { name: "SEO", color: "#f59e0b", projectId: project2.id } });
  const tagSocial = await prisma.tag.create({ data: { name: "Social", color: "#3b82f6", projectId: project2.id } });

  console.log("✅ Tags created (12)");

  // ── TaskTags ──
  const taskTagData = [
    // Настроить CI/CD pipeline → Backend
    { taskId: taskCiCd.id, tagId: tagBackend.id },
    // Дизайн Kanban-доски → UI/UX, Frontend
    { taskId: taskKanban.id, tagId: tagUiUx.id },
    { taskId: taskKanban.id, tagId: tagFrontend.id },
    // Реализовать аутентификацию → Backend, Feature
    { taskId: taskAuth.id, tagId: tagBackend.id },
    { taskId: taskAuth.id, tagId: tagFeature.id },
    // API для задач → Backend, Feature
    { taskId: taskApi.id, tagId: tagBackend.id },
    { taskId: taskApi.id, tagId: tagFeature.id },
    // Система уведомлений → Feature, Backend
    { taskId: taskNotifications.id, tagId: tagFeature.id },
    { taskId: taskNotifications.id, tagId: tagBackend.id },
    // Аналитика проекта → Feature, UI/UX
    { taskId: taskAnalytics.id, tagId: tagFeature.id },
    { taskId: taskAnalytics.id, tagId: tagUiUx.id },
    // Мобильная адаптация → UI/UX, Frontend, Improvement
    { taskId: taskMobile.id, tagId: tagUiUx.id },
    { taskId: taskMobile.id, tagId: tagFrontend.id },
    { taskId: taskMobile.id, tagId: tagImprovement.id },
    // Написать тесты → Backend, Documentation
    { taskId: taskTests.id, tagId: tagBackend.id },
    { taskId: taskTests.id, tagId: tagDocs.id },
    // Project 2: Блог-пост → Content, SEO
    { taskId: taskBlog.id, tagId: tagContent.id },
    { taskId: taskBlog.id, tagId: tagSeo.id },
    // Контент для соцсетей → Social, Content
    { taskId: taskSocial.id, tagId: tagSocial.id },
    { taskId: taskSocial.id, tagId: tagContent.id },
    // Обновить README → Content, Design
    { taskId: taskReadme.id, tagId: tagContent.id },
    { taskId: taskReadme.id, tagId: tagDesign.id },
  ];

  for (const tt of taskTagData) {
    await prisma.taskTag.create({ data: tt });
  }

  console.log("✅ TaskTags created (" + taskTagData.length + ")");

  // ── Comments ──
  const commentsData = [
    // Реализовать аутентификацию
    { content: "Используем Auth.js v5 с email провайдером. Credentials + JWT strategy.", taskId: taskAuth.id, authorId: alice.id, createdAt: daysAgo(5) },
    { content: "Нужно добавить валидацию пароля — минимум 8 символов, одна заглавная буква.", taskId: taskAuth.id, authorId: bob.id, createdAt: daysAgo(4) },
    { content: "Готово, добавила zod-схему для валидации. Проверь PR #12.", taskId: taskAuth.id, authorId: alice.id, createdAt: daysAgo(3) },
    { content: "Ещё бы добавить rate limiting на форму логина.", taskId: taskAuth.id, authorId: charlie.id, createdAt: daysAgo(2) },

    // API для задач
    { content: "Server Actions работают быстрее чем API routes для нашего кейса.", taskId: taskApi.id, authorId: bob.id, createdAt: daysAgo(4) },
    { content: "Согласен, плюс типизация из коробки. Начал реализацию createTask и getTasks.", taskId: taskApi.id, authorId: charlie.id, createdAt: daysAgo(3) },
    { content: "Нужно добавить пагинацию для списка задач. Cursor-based или offset?", taskId: taskApi.id, authorId: bob.id, createdAt: daysAgo(2) },
    { content: "Давайте cursor-based — работает лучше с infinite scroll.", taskId: taskApi.id, authorId: alice.id, createdAt: daysAgo(1) },

    // Система уведомлений
    { content: "Уведомления по email пока не делаю, только in-app.", taskId: taskNotifications.id, authorId: charlie.id, createdAt: daysAgo(3) },
    { content: "Ок, email можно добавить позже. Сейчас важнее real-time в UI.", taskId: taskNotifications.id, authorId: alice.id, createdAt: daysAgo(2) },
    { content: "Добавил компонент NotificationBell с badge и dropdown.", taskId: taskNotifications.id, authorId: charlie.id, createdAt: daysAgo(1) },

    // Дизайн Kanban-доски
    { content: "Drag-n-drop через @dnd-kit работает отлично. Лёгкая библиотека.", taskId: taskKanban.id, authorId: alice.id, createdAt: daysAgo(6) },
    { content: "Нужно добавить анимации при перетаскивании карточек.", taskId: taskKanban.id, authorId: bob.id, createdAt: daysAgo(5) },
    { content: "Готово! Добавила spring animation через framer-motion.", taskId: taskKanban.id, authorId: alice.id, createdAt: daysAgo(4) },

    // Настроить CI/CD pipeline
    { content: "GitHub Actions настроен: lint → test → build → deploy на Vercel.", taskId: taskCiCd.id, authorId: bob.id, createdAt: daysAgo(7) },
    { content: "Отлично, добавь ещё кеширование node_modules для скорости.", taskId: taskCiCd.id, authorId: alice.id, createdAt: daysAgo(6) },

    // Мобильная адаптация
    { content: "Начну с sidebar — на мобильных должен быть drawer.", taskId: taskMobile.id, authorId: bob.id, createdAt: hoursAgo(12) },

    // Написать тесты
    { content: "Предлагаю Vitest вместо Jest — быстрее и нативная поддержка ESM.", taskId: taskTests.id, authorId: charlie.id, createdAt: hoursAgo(6) },
    { content: "Хорошая идея. Плюс совместим с Vite если перейдём позже.", taskId: taskTests.id, authorId: bob.id, createdAt: hoursAgo(3) },
  ];

  for (const c of commentsData) {
    await prisma.comment.create({ data: c });
  }

  console.log("✅ Comments created (" + commentsData.length + ")");

  // ── ChecklistItems ──
  const checklistData = [
    // Реализовать аутентификацию
    { title: "Форма входа", completed: true, order: 0, taskId: taskAuth.id },
    { title: "Форма регистрации", completed: true, order: 1, taskId: taskAuth.id },
    { title: "Защита роутов (middleware)", completed: true, order: 2, taskId: taskAuth.id },
    { title: "Сброс пароля", completed: false, order: 3, taskId: taskAuth.id },
    { title: "OAuth провайдеры (Google, GitHub)", completed: false, order: 4, taskId: taskAuth.id },

    // API для задач
    { title: "Create task", completed: true, order: 0, taskId: taskApi.id },
    { title: "Read tasks (list + single)", completed: true, order: 1, taskId: taskApi.id },
    { title: "Update task", completed: false, order: 2, taskId: taskApi.id },
    { title: "Delete task", completed: false, order: 3, taskId: taskApi.id },
    { title: "Bulk operations", completed: false, order: 4, taskId: taskApi.id },

    // Система уведомлений
    { title: "Модель уведомлений в Prisma", completed: true, order: 0, taskId: taskNotifications.id },
    { title: "UI компонент NotificationBell", completed: true, order: 1, taskId: taskNotifications.id },
    { title: "Отметка прочитанных", completed: false, order: 2, taskId: taskNotifications.id },
    { title: "Фильтры по типу", completed: false, order: 3, taskId: taskNotifications.id },

    // Мобильная адаптация
    { title: "Sidebar responsive (drawer)", completed: false, order: 0, taskId: taskMobile.id },
    { title: "Kanban horizontal scroll", completed: false, order: 1, taskId: taskMobile.id },
    { title: "Touch-friendly drag-n-drop", completed: false, order: 2, taskId: taskMobile.id },
    { title: "Mobile bottom navigation", completed: false, order: 3, taskId: taskMobile.id },

    // Написать тесты
    { title: "Setup Vitest + testing-library", completed: false, order: 0, taskId: taskTests.id },
    { title: "Auth flow tests", completed: false, order: 1, taskId: taskTests.id },
    { title: "Task CRUD tests", completed: false, order: 2, taskId: taskTests.id },
    { title: "E2E tests (Playwright)", completed: false, order: 3, taskId: taskTests.id },
  ];

  for (const cl of checklistData) {
    await prisma.checklistItem.create({ data: cl });
  }

  console.log("✅ ChecklistItems created (" + checklistData.length + ")");

  // ── TaskDependencies ──
  await prisma.taskDependency.create({
    data: { taskId: taskApi.id, dependsOnId: taskAuth.id },
  });
  await prisma.taskDependency.create({
    data: { taskId: taskNotifications.id, dependsOnId: taskApi.id },
  });
  await prisma.taskDependency.create({
    data: { taskId: taskAnalytics.id, dependsOnId: taskApi.id },
  });
  await prisma.taskDependency.create({
    data: { taskId: taskMobile.id, dependsOnId: taskKanban.id },
  });

  console.log("✅ TaskDependencies created (4)");

  // ── Notifications ──
  await prisma.notification.createMany({
    data: [
      {
        type: "TASK_ASSIGNED",
        message: 'Вам назначена задача "Реализовать аутентификацию"',
        userId: alice.id,
      },
      {
        type: "DEADLINE_WARNING",
        message: 'Дедлайн задачи "API для задач" через 24 часа',
        userId: bob.id,
      },
      {
        type: "PROJECT_INVITED",
        message: 'Вы добавлены в проект "TaskFlow MVP"',
        userId: charlie.id,
        read: true,
      },
      {
        type: "TASK_STATUS_CHANGED",
        message: 'Задача "Дизайн Kanban-доски" завершена',
        userId: alice.id,
        read: true,
      },
    ],
  });

  console.log("✅ Notifications created (4)");

  // ── TaskActivity ──
  const activityData = [
    // ── Настроить CI/CD pipeline (DONE) ──
    { action: "CREATED", taskId: taskCiCd.id, userId: alice.id, createdAt: daysAgo(10) },
    { action: "ASSIGNED", taskId: taskCiCd.id, userId: alice.id, newValue: bob.id, createdAt: daysAgo(10) },
    { action: "TAG_ADDED", taskId: taskCiCd.id, userId: alice.id, newValue: "Backend", createdAt: daysAgo(10) },
    { action: "STATUS_CHANGED", oldValue: "TODO", newValue: "IN_PROGRESS", taskId: taskCiCd.id, userId: bob.id, createdAt: daysAgo(8) },
    { action: "STATUS_CHANGED", oldValue: "IN_PROGRESS", newValue: "DONE", taskId: taskCiCd.id, userId: bob.id, createdAt: daysAgo(3) },

    // ── Дизайн Kanban-доски (DONE) ──
    { action: "CREATED", taskId: taskKanban.id, userId: alice.id, createdAt: daysAgo(9) },
    { action: "ASSIGNED", taskId: taskKanban.id, userId: alice.id, newValue: alice.id, createdAt: daysAgo(9) },
    { action: "TAG_ADDED", taskId: taskKanban.id, userId: alice.id, newValue: "UI/UX", createdAt: daysAgo(9) },
    { action: "TAG_ADDED", taskId: taskKanban.id, userId: alice.id, newValue: "Frontend", createdAt: daysAgo(9) },
    { action: "PRIORITY_CHANGED", oldValue: "HIGH", newValue: "URGENT", taskId: taskKanban.id, userId: alice.id, createdAt: daysAgo(8) },
    { action: "STATUS_CHANGED", oldValue: "TODO", newValue: "IN_PROGRESS", taskId: taskKanban.id, userId: alice.id, createdAt: daysAgo(7) },
    { action: "COMMENT_ADDED", taskId: taskKanban.id, userId: alice.id, createdAt: daysAgo(6) },
    { action: "STATUS_CHANGED", oldValue: "IN_PROGRESS", newValue: "DONE", taskId: taskKanban.id, userId: alice.id, createdAt: daysAgo(2) },

    // ── Реализовать аутентификацию (IN_PROGRESS) ──
    { action: "CREATED", taskId: taskAuth.id, userId: alice.id, createdAt: daysAgo(8) },
    { action: "ASSIGNED", taskId: taskAuth.id, userId: alice.id, newValue: alice.id, createdAt: daysAgo(8) },
    { action: "TAG_ADDED", taskId: taskAuth.id, userId: alice.id, newValue: "Backend", createdAt: daysAgo(8) },
    { action: "TAG_ADDED", taskId: taskAuth.id, userId: alice.id, newValue: "Feature", createdAt: daysAgo(8) },
    { action: "STATUS_CHANGED", oldValue: "TODO", newValue: "IN_PROGRESS", taskId: taskAuth.id, userId: alice.id, createdAt: daysAgo(5) },
    { action: "CHECKLIST_UPDATED", taskId: taskAuth.id, userId: alice.id, newValue: "Форма входа — done", createdAt: daysAgo(4) },
    { action: "COMMENT_ADDED", taskId: taskAuth.id, userId: bob.id, createdAt: daysAgo(4) },

    // ── API для задач (IN_PROGRESS) ──
    { action: "CREATED", taskId: taskApi.id, userId: alice.id, createdAt: daysAgo(7) },
    { action: "ASSIGNED", taskId: taskApi.id, userId: alice.id, newValue: bob.id, createdAt: daysAgo(7) },
    { action: "TAG_ADDED", taskId: taskApi.id, userId: alice.id, newValue: "Backend", createdAt: daysAgo(7) },
    { action: "TAG_ADDED", taskId: taskApi.id, userId: alice.id, newValue: "Feature", createdAt: daysAgo(7) },
    { action: "STATUS_CHANGED", oldValue: "TODO", newValue: "IN_PROGRESS", taskId: taskApi.id, userId: bob.id, createdAt: daysAgo(4) },
    { action: "CHECKLIST_UPDATED", taskId: taskApi.id, userId: bob.id, newValue: "Create task — done", createdAt: daysAgo(3) },

    // ── Система уведомлений (REVIEW) ──
    { action: "CREATED", taskId: taskNotifications.id, userId: alice.id, createdAt: daysAgo(6) },
    { action: "ASSIGNED", taskId: taskNotifications.id, userId: alice.id, newValue: charlie.id, createdAt: daysAgo(6) },
    { action: "STATUS_CHANGED", oldValue: "TODO", newValue: "IN_PROGRESS", taskId: taskNotifications.id, userId: charlie.id, createdAt: daysAgo(4) },
    { action: "STATUS_CHANGED", oldValue: "IN_PROGRESS", newValue: "REVIEW", taskId: taskNotifications.id, userId: charlie.id, createdAt: daysAgo(1) },

    // ── Аналитика проекта (TODO) ──
    { action: "CREATED", taskId: taskAnalytics.id, userId: alice.id, createdAt: daysAgo(5) },
    { action: "TAG_ADDED", taskId: taskAnalytics.id, userId: alice.id, newValue: "Feature", createdAt: daysAgo(5) },

    // ── Мобильная адаптация (TODO) ──
    { action: "CREATED", taskId: taskMobile.id, userId: alice.id, createdAt: daysAgo(4) },
    { action: "ASSIGNED", taskId: taskMobile.id, userId: alice.id, newValue: bob.id, createdAt: daysAgo(4) },
    { action: "TAG_ADDED", taskId: taskMobile.id, userId: alice.id, newValue: "UI/UX", createdAt: daysAgo(4) },

    // ── Написать тесты (TODO) ──
    { action: "CREATED", taskId: taskTests.id, userId: bob.id, createdAt: daysAgo(3) },
    { action: "ASSIGNED", taskId: taskTests.id, userId: bob.id, newValue: charlie.id, createdAt: daysAgo(3) },
    { action: "TAG_ADDED", taskId: taskTests.id, userId: bob.id, newValue: "Backend", createdAt: daysAgo(3) },
    { action: "TAG_ADDED", taskId: taskTests.id, userId: bob.id, newValue: "Documentation", createdAt: daysAgo(3) },

    // ── Project 2 tasks ──
    { action: "CREATED", taskId: taskBlog.id, userId: bob.id, createdAt: daysAgo(3) },
    { action: "ASSIGNED", taskId: taskBlog.id, userId: bob.id, newValue: alice.id, createdAt: daysAgo(3) },

    { action: "CREATED", taskId: taskSocial.id, userId: bob.id, createdAt: daysAgo(3) },
    { action: "ASSIGNED", taskId: taskSocial.id, userId: bob.id, newValue: bob.id, createdAt: daysAgo(3) },
    { action: "STATUS_CHANGED", oldValue: "TODO", newValue: "IN_PROGRESS", taskId: taskSocial.id, userId: bob.id, createdAt: daysAgo(1) },

    { action: "CREATED", taskId: taskReadme.id, userId: bob.id, createdAt: daysAgo(5) },
    { action: "ASSIGNED", taskId: taskReadme.id, userId: bob.id, newValue: bob.id, createdAt: daysAgo(5) },
    { action: "PRIORITY_CHANGED", oldValue: "MEDIUM", newValue: "LOW", taskId: taskReadme.id, userId: bob.id, createdAt: daysAgo(2) },
  ];

  for (const a of activityData) {
    await prisma.taskActivity.create({ data: a });
  }

  console.log("✅ TaskActivity created (" + activityData.length + ")");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
