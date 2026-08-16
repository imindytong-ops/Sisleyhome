import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export async function GET() {
  const { error } = await requireRole(["PURCHASING", "FINANCE", "WAREHOUSE", "ADMIN"]);
  if (error) return error;

  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const { error } = await requireRole(["PURCHASING", "ADMIN"]);
  if (error) return error;

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "供应商名称不能为空" }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      contact: body.contact || null,
      taxNo: body.taxNo || null,
    },
  });
  return NextResponse.json(supplier, { status: 201 });
}
