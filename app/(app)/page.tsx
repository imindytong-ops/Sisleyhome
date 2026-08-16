import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getSession();
  const [supplierCount, poCount, pendingDocCount] = await Promise.all([
    prisma.supplier.count(),
    prisma.purchaseOrder.count(),
    prisma.document.count({ where: { ocrStatus: "PENDING" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">
          欢迎回来，{session?.name}
        </h1>
        <p className="text-sm text-gray-500">
          这里是采购、仓库、财务协同工作台的起点。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/suppliers"
          className="rounded-lg border border-gray-200 bg-white p-5 hover:border-gray-300"
        >
          <p className="text-sm text-gray-500">供应商</p>
          <p className="mt-1 text-2xl font-semibold">{supplierCount}</p>
        </Link>
        <Link
          href="/purchase"
          className="rounded-lg border border-gray-200 bg-white p-5 hover:border-gray-300"
        >
          <p className="text-sm text-gray-500">采购订单</p>
          <p className="mt-1 text-2xl font-semibold">{poCount}</p>
        </Link>
        <Link
          href="/purchase/upload"
          className="rounded-lg border border-gray-200 bg-white p-5 hover:border-gray-300"
        >
          <p className="text-sm text-gray-500">待处理的拍照上传</p>
          <p className="mt-1 text-2xl font-semibold">{pendingDocCount}</p>
        </Link>
      </div>
    </div>
  );
}
