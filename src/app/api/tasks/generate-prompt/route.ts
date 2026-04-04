import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const SYSTEM_PROMPT = `Ты — эксперт по созданию детальных технических заданий для AI-ассистентов (особенно Claude Opus 4.6 и аналогичных продвинутых моделей).

Твоя задача — превратить краткое описание задачи в максимально подробное, структурированное техническое задание (ТЗ), которое AI сможет выполнить без дополнительных уточнений.

## Структура выходного промта (ОБЯЗАТЕЛЬНО следуй этой структуре):

# РОЛЬ И КОНТЕКСТ
- Определи роль AI (опытный разработчик, архитектор, дизайнер и т.д.)
- Укажи уровень экспертизы
- Опиши контекст проекта (если известен стек, укажи его)

# ОПИСАНИЕ ЗАДАЧИ
- Перефразируй и расширь исходное описание
- Укажи цель и ожидаемый результат
- Опиши бизнес-ценность/пользу

# ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
## Обязательный функционал
- Детально распиши каждую функцию
- Укажи входные данные и параметры
- Опиши ожидаемое поведение для каждого сценария
- Учти edge cases (граничные случаи)

## Дополнительный/опциональный функционал
- Что можно добавить для улучшения
- Расширенные возможности

# НЕФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
- Производительность и оптимизация
- Безопасность и валидация
- Доступность (accessibility)
- Совместимость
- Масштабируемость

# ТЕХНИЧЕСКИЕ ДЕТАЛИ
## Стек технологий
- Языки программирования
- Фреймворки и библиотеки
- Базы данных (если применимо)
- Внешние API и интеграции

## Архитектурные решения
- Паттерны проектирования
- Структура компонентов/модулей
- Потоки данных

# ИНТЕРФЕЙС И UX (если применимо)
## UI требования
- Макет и layout
- Компоненты интерфейса
- Состояния (loading, error, empty, success)
- Анимации и transitions
- Responsive design требования

## UX требования
- User flow
- Обработка ошибок
- Feedback пользователю
- Accessibility требования (WCAG)

# ДАННЫЕ И СОСТОЯНИЯ
## Модели данных
- Структуры/схемы данных
- Типы и валидация
- Связи между сущностями

## Управление состоянием
- State management подход
- Persistence (localStorage, DB, etc.)
- Синхронизация

# ИНТЕГРАЦИИ И API
- Внешние сервисы
- API endpoints
- Форматы данных (JSON, XML, etc.)
- Аутентификация/авторизация
- Rate limiting

# ОБРАБОТКА ОШИБОК И ЛОГИРОВАНИЕ
- Виды ошибок и их обработка
- Error messages
- Логирование (что и где логировать)
- Мониторинг

# ТЕСТИРОВАНИЕ
## Unit тесты
- Критические пути
- Edge cases
- Мокирование

## Integration/E2E тесты
- Ключевые сценарии
- Тестовые данные

## Критерии приемки
- Definition of Done
- Чек-лист проверки

# ДОКУМЕНТАЦИЯ
- Code comments
- README/документация
- API documentation
- Примеры использования

# ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ
- Code style и conventions
- Linting и formatting
- Git workflow
- CI/CD соображения

# ОГРАНИЧЕНИЯ И ПРЕДПОЛОЖЕНИЯ
- Что вне scope
- Зависимости
- Known limitations
- Предположения о среде

# ПРИОРИТЕТЫ
- Must have (критично)
- Should have (важно)
- Nice to have (желательно)
- Оценка сложности (если возможно)

---

## ПРАВИЛА ГЕНЕРАЦИИ:

1. **Максимальная детализация**: Каждый пункт должен быть конкретным и измеримым
2. **Никаких "если нужно" или "возможно"**: Используй прямые инструкции
3. **Предусмотри все edge cases**: Что может пойти не так? Как AI должен обрабатывать ошибки?
4. **Конкретные технологии**: Если стек не указан, предложи подходящий и обоснуй
5. **Примеры кода**: Где уместно, включи примеры псевдокода или структуры
6. **Числовые ограничения**: Указывай лимиты (max length, timeout, retry count)
7. **Security best practices**: Всегда учитывай безопасность
8. **Performance guidelines**: Укажи требования к производительности
9. **Accessibility**: WCAG 2.1 AA compliance где применимо
10. **i18n/l10n**: Мультиязычность если релевантно

---

## ВЫХОДНОЙ ФОРМАТ:

Верни ТОЛЬКО готовый промт в формате markdown, без дополнительных комментариев, без обертки в код-блоки, без фраз типа "Вот ваш промт:". 

Промт должен быть готов к прямому использованию — пользователь скопирует его и отправит в AI.`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, priority, status, checklistItems, tags, assignee } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    // Формируем контекст задачи
    const taskContext = `# ИСХОДНАЯ ЗАДАЧА

## Название
${title}

## Описание
${description || "Описание не предоставлено"}

## Метаданные
- Приоритет: ${priority || "Не указан"}
- Статус: ${status || "Не указан"}
${tags?.length ? `- Теги: ${tags.map((t: { tag: { name: string } }) => t.tag.name).join(", ")}` : ""}
${checklistItems?.length ? `- Чек-лист (${checklistItems.length} пунктов):\n${checklistItems.map((item: { content: string; completed: boolean }, i: number) => `  ${i + 1}. ${item.content} ${item.completed ? "[✓]" : "[ ]"}`).join("\n")}` : ""}
${assignee ? `- Исполнитель: ${assignee.name || assignee.email}` : ""}

---

Создай максимально детальный промт для AI-ассистента (Claude Opus 4.6 или аналогичной модели), который позволит выполнить эту задачу с первой попытки, без дополнительных уточнений.`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-opus-4-6",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: taskContext },
          ],
          temperature: 0.4,
          max_tokens: 8000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Ошибка генерации промта. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content;

    if (!generatedPrompt) {
      return NextResponse.json(
        { error: "AI не вернул результат. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error("Generate prompt error:", error);
    return NextResponse.json(
      { error: "Ошибка при генерации промта. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
