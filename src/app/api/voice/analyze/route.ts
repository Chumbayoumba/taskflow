import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const SYSTEM_PROMPT = `Ты — опытный менеджер проектов. Твоя задача — проанализировать текст голосовой записи и выделить из неё отдельные задачи для команды разработки.

Правила:
1. Каждая задача должна быть конкретной и выполнимой
2. Название задачи — краткое (до 100 символов), отражающее суть
3. Описание — подробнее раскрывает что именно нужно сделать
4. Определи приоритет на основе контекста: LOW (косметическое), MEDIUM (обычное), HIGH (важное), URGENT (критичное)
5. Если из текста можно выделить несколько задач — выдели все
6. Игнорируй слова-паразиты, междометия и нерелевантные фразы

Верни ответ СТРОГО в формате JSON массива, без markdown-обёртки, без пояснений:
[{"title": "Краткое название", "description": "Подробное описание задачи", "priority": "MEDIUM"}]`;

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
    const { transcript } = body;

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen3.6-plus:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Проанализируй следующую голосовую запись и выдели задачи:\n\n"${transcript}"`,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Ошибка AI анализа. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI не вернул результат. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    // Extract JSON from the response (handle potential markdown wrapping)
    let tasksJson: string = content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      tasksJson = jsonMatch[0];
    }

    let tasks;
    try {
      tasks = JSON.parse(tasksJson);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { error: "Не удалось разобрать ответ AI. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: "AI не смог выделить задачи из записи." },
        { status: 422 }
      );
    }

    // Validate and sanitize tasks
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    const sanitizedTasks = tasks
      .filter(
        (t: Record<string, unknown>) =>
          t && typeof t.title === "string" && t.title.trim()
      )
      .map((t: Record<string, unknown>, index: number) => ({
        id: `voice-task-${Date.now()}-${index}`,
        title: String(t.title).slice(0, 200),
        description: typeof t.description === "string" ? t.description.slice(0, 2000) : "",
        priority: validPriorities.includes(String(t.priority))
          ? String(t.priority)
          : "MEDIUM",
      }));

    return NextResponse.json({ tasks: sanitizedTasks });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Ошибка при анализе. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
