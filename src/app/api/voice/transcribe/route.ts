import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram API key not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-3&language=ru&punctuate=true&smart_format=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": audioFile.type || "audio/webm",
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Deepgram API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Ошибка распознавания речи. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const transcript =
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: "Не удалось распознать речь. Попробуйте записать снова." },
        { status: 422 }
      );
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Ошибка при обработке аудио. Попробуйте ещё раз." },
      { status: 500 }
    );
  }
}
