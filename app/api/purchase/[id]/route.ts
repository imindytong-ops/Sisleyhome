import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/purchase/[id]">
) {
  const { error } = await requireRole(["PURCHASING", "FINANCE", "WAREHOUSE", "ADMIN"]);
  if (error) return error;

  const { id } = await ctx.params;
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, items: true, documents: true },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }
  return NextResponse.json(order);
}
