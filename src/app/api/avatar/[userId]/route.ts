import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // Sanitize userId to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return new NextResponse("Invalid userId", { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "uploads", "avatars");

  try {
    const files = await readdir(uploadsDir);
    const avatarFile = files.find((f) => f.startsWith(userId + "."));

    if (!avatarFile) {
      return new NextResponse(null, { status: 404 });
    }

    const ext = avatarFile.split(".").pop()?.toLowerCase() || "";
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
    const data = await readFile(path.join(uploadsDir, avatarFile));

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
