import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import "dotenv/config";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../src/generated/prisma/client");
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
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

  // Create projects
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

  // Create tasks for project 1
  const now = new Date();
  const tasks = [
    {
      title: "Настроить CI/CD pipeline",
      description: "Настроить GitHub Actions для автоматического деплоя",
      status: "DONE",
      priority: "HIGH",
      order: 0,
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: bob.id,
      creatorId: alice.id,
    },
    {
      title: "Дизайн Kanban-доски",
      description: "Создать макет Kanban-доски с drag-and-drop",
      status: "DONE",
      priority: "URGENT",
      order: 1,
      deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: alice.id,
      creatorId: alice.id,
    },
    {
      title: "Реализовать аутентификацию",
      description: "Email + пароль через Auth.js v5",
      status: "IN_PROGRESS",
      priority: "HIGH",
      order: 0,
      deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: alice.id,
      creatorId: alice.id,
    },
    {
      title: "API для задач",
      description: "CRUD операции для задач через Server Actions",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      order: 1,
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: bob.id,
      creatorId: alice.id,
    },
    {
      title: "Система уведомлений",
      description: "Уведомления о дедлайнах и назначениях",
      status: "REVIEW",
      priority: "MEDIUM",
      order: 0,
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: charlie.id,
      creatorId: alice.id,
    },
    {
      title: "Аналитика проекта",
      description: "Графики и статистика по задачам",
      status: "TODO",
      priority: "LOW",
      order: 0,
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: null,
      creatorId: alice.id,
    },
    {
      title: "Мобильная адаптация",
      description: "Responsive дизайн для мобильных устройств",
      status: "TODO",
      priority: "MEDIUM",
      order: 1,
      deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      assigneeId: bob.id,
      creatorId: alice.id,
    },
    {
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
    // Project 2 tasks
    {
      title: "Написать блог-пост о запуске",
      status: "TODO",
      priority: "HIGH",
      order: 0,
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      projectId: project2.id,
      assigneeId: alice.id,
      creatorId: bob.id,
    },
    {
      title: "Подготовить контент для соцсетей",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      order: 0,
      projectId: project2.id,
      assigneeId: bob.id,
      creatorId: bob.id,
    },
    {
      title: "Обновить README",
      description: "Добавить скриншоты и документацию",
      status: "TODO",
      priority: "LOW",
      order: 1,
      deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // overdue!
      projectId: project2.id,
      assigneeId: bob.id,
      creatorId: bob.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log("✅ Tasks created");

  // Create notifications
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

  console.log("✅ Notifications created");
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
