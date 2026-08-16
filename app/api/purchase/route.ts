import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";

type ItemInput = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export async function GET() {
  const { error } = await requireRole(["PURCHASING", "FINANCE", "WAREHOUSE", "ADMIN"]);
  if (error) return error;

  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true, items: true },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const { session, error } = await requireRole(["PURCHASING", "ADMIN"]);
  if (error) return error;

  const body = await request.json();
  const orderNo = typeof body.orderNo === "string" ? body.orderNo.trim() : "";
  const supplierId = typeof body.supplierId === "string" ? body.supplierId : "";
  const orderDate = body.orderDate ? new Date(body.orderDate) : new Date();
  const items: ItemInput[] = Array.isArray(body.items) ? body.items : [];
  const documentId = typeof body.documentId === "string" ? body.documentId : null;

  if (!orderNo || !supplierId || items.length === 0) {
    return NextResponse.json(
      { error: "请填写订单号、供应商，并至少添加一项商品明细" },
      { status: 400 }
    );
  }

  const validItems = items.filter(
    (it) => it.productName?.trim() && it.quantity > 0 && it.unitPrice >= 0
  );
  if (validItems.length === 0) {
    return NextResponse.json({ error: "商品明细不合法" }, { status: 400 });
  }

  const totalAmount = validItems.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );

  try {
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId,
        orderDate,
        totalAmount,
        status: "CONFIRMED",
        createdById: session!.userId,
        items: {
          create: validItems.map((it) => ({
            productName: it.productName.trim(),
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount: it.quantity * it.unitPrice,
          })),
        },
      },
      include: { items: true, supplier: true },
    });

    if (documentId) {
      await prisma.document.update({
        where: { id: documentId },
        data: { relatedPoId: order.id, ocrStatus: "CONFIRMED" },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "订单号已存在" }, { status: 400 });
  }
}
