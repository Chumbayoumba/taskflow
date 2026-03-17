import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
      { status: 400 }
    );
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Max 5MB" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${session.user.id}.${ext}`;
  const uploadDir = path.join(process.cwd(), "uploads", "avatars");

  // Ensure directory exists
  await mkdir(uploadDir, { recursive: true });

  // Remove old avatar files for this user (different extensions)
  try {
    const existing = await readdir(uploadDir);
    for (const f of existing) {
      if (f.startsWith(session.user.id + ".")) {
        await unlink(path.join(uploadDir, f));
      }
    }
  } catch {
    // Directory might not exist yet, ignore
  }

  const filePath = path.join(uploadDir, fileName);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  // Serve via API route instead of static file
  const avatarUrl = `/api/avatar/${session.user.id}?t=${Date.now()}`;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl },
  });

  return NextResponse.json({ avatarUrl });
}
