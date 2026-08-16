import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/suppliers/[id]">
) {
  const { error } = await requireRole(["PURCHASING", "ADMIN"]);
  if (error) return error;

  const { id } = await ctx.params;

  const inUse = await prisma.purchaseOrder.count({ where: { supplierId: id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: "该供应商已关联采购订单，无法删除" },
      { status: 400 }
    );
  }

  await prisma.supplier.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
