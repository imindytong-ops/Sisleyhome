"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PurchaseOrder = {
  id: string;
  orderNo: string;
  orderDate: string;
  totalAmount: string;
  status: string;
  supplier: { name: string };
  items: { id: string }[];
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
};

export default function PurchaseListPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purchase")
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">采购订单</h1>
        <div className="flex gap-2">
          <Link
            href="/purchase/upload"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            拍照/截图识别录入
          </Link>
          <Link
            href="/purchase/new"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
          >
            手工新建
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">订单号</th>
              <th className="px-4 py-2 font-medium">供应商</th>
              <th className="px-4 py-2 font-medium">下单日期</th>
              <th className="px-4 py-2 font-medium">商品项数</th>
              <th className="px-4 py-2 font-medium">总金额</th>
              <th className="px-4 py-2 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={6}>
                  加载中...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-400" colSpan={6}>
                  暂无采购订单
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link href={`/purchase/${o.id}`} className="text-blue-600 hover:underline">
                    {o.orderNo}
                  </Link>
                </td>
                <td className="px-4 py-2">{o.supplier.name}</td>
                <td className="px-4 py-2 text-gray-500">
                  {new Date(o.orderDate).toLocaleDateString("zh-CN")}
                </td>
                <td className="px-4 py-2 text-gray-500">{o.items.length}</td>
                <td className="px-4 py-2">¥{Number(o.totalAmount).toFixed(2)}</td>
                <td className="px-4 py-2 text-gray-500">
                  {STATUS_LABEL[o.status] ?? o.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
