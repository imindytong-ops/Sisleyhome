import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { recognizeDocument } from "@/lib/ocr";

const ALLOWED_TYPES = ["INVOICE", "DELIVERY_NOTE", "STOCK_IN", "STOCK_OUT"];
const MEDIA_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

export async function POST(request: Request) {
  const { session, error } = await requireRole(["PURCHASING", "ADMIN"]);
  if (error) return error;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "服务器未配置 ANTHROPIC_API_KEY，无法使用识别功能" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const docType = formData.get("type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传图片文件" }, { status: 400 });
  }
  const type = typeof docType === "string" && ALLOWED_TYPES.includes(docType)
    ? docType
    : "INVOICE";

  const mediaType = MEDIA_TYPES[file.type];
  if (!mediaType) {
    return NextResponse.json(
      { error: "仅支持 JPG / PNG / WEBP 格式图片" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = mediaType.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  const fileUrl = `/uploads/${filename}`;

  const document = await prisma.document.create({
    data: {
      type,
      fileUrl,
      uploadedById: session!.userId,
      ocrStatus: "PENDING",
    },
  });

  try {
    const result = await recognizeDocument(buffer.toString("base64"), mediaType);
    await prisma.document.update({
      where: { id: document.id },
      data: { ocrStatus: "RECOGNIZED", ocrRawJson: JSON.stringify(result) },
    });
    return NextResponse.json({ documentId: document.id, fileUrl, result });
  } catch {
    await prisma.document.update({
      where: { id: document.id },
      data: { ocrStatus: "FAILED" },
    });
    return NextResponse.json(
      { error: "识别失败，请手动填写或重试", documentId: document.id, fileUrl },
      { status: 502 }
    );
  }
}
