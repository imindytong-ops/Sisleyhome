import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
};

const DOC_TYPE_LABEL: Record<string, string> = {
  INVOICE: "发票",
  DELIVERY_NOTE: "送货单",
  STOCK_IN: "入库单",
  STOCK_OUT: "出库单",
};

export default async function PurchaseOrderDetailPage(
  props: PageProps<"/purchase/[id]">
) {
  const { id } = await props.params;
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, items: true, documents: true },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">采购订单 {order.orderNo}</h1>
        <p className="text-sm text-gray-500">
          供应商：{order.supplier.name} · 状态：{STATUS_LABEL[order.status] ?? order.status}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">商品名称</th>
              <th className="px-4 py-2 font-medium">数量</th>
              <th className="px-4 py-2 font-medium">单价</th>
              <th className="px-4 py-2 font-medium">金额</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{it.productName}</td>
                <td className="px-4 py-2">{Number(it.quantity)}</td>
                <td className="px-4 py-2">¥{Number(it.unitPrice).toFixed(2)}</td>
                <td className="px-4 py-2">¥{Number(it.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-gray-100 px-4 py-2 text-right text-sm font-medium">
          总金额：¥{Number(order.totalAmount).toFixed(2)}
        </div>
      </div>

      {order.documents.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-medium">关联单据</h2>
          <ul className="space-y-1 text-sm">
            {order.documents.map((doc) => (
              <li key={doc.id}>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {DOC_TYPE_LABEL[doc.type] ?? doc.type} - 查看原图
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
