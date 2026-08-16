"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Supplier = { id: string; name: string };

export type ItemDraft = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type PurchaseOrderFormInitial = {
  orderNo?: string;
  supplierName?: string;
  orderDate?: string;
  items?: ItemDraft[];
  documentId?: string;
};

export default function PurchaseOrderForm({
  initial,
}: {
  initial?: PurchaseOrderFormInitial;
}) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orderNo, setOrderNo] = useState(initial?.orderNo ?? "");
  const [supplierId, setSupplierId] = useState("");
  const [newSupplierName, setNewSupplierName] = useState(
    initial?.supplierName ?? ""
  );
  const [orderDate, setOrderDate] = useState(
    initial?.orderDate ?? new Date().toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<ItemDraft[]>(
    initial?.items && initial.items.length > 0
      ? initial.items
      : [{ productName: "", quantity: 1, unitPrice: 0 }]
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((res) => res.json())
      .then((data: Supplier[]) => {
        setSuppliers(data);
        if (initial?.supplierName) {
          const match = data.find((s) => s.name === initial.supplierName);
          if (match) setSupplierId(match.id);
        }
      });
  }, [initial?.supplierName]);

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { productName: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let finalSupplierId = supplierId;
    setSubmitting(true);
    try {
      if (!finalSupplierId && newSupplierName.trim()) {
        const res = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newSupplierName.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "创建供应商失败");
          return;
        }
        finalSupplierId = data.id;
      }

      if (!finalSupplierId) {
        setError("请选择或填写供应商");
        return;
      }

      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNo,
          supplierId: finalSupplierId,
          orderDate,
          items,
          documentId: initial?.documentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "创建失败");
        return;
      }
      router.push(`/purchase/${data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">采购订单号 *</label>
          <input
            required
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">供应商 *</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">-- 选择已有供应商 --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {!supplierId && (
            <input
              placeholder="或直接填写新供应商名称"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">下单日期</label>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">商品明细</h2>
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-blue-600 hover:underline"
          >
            + 添加一行
          </button>
        </div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="商品名称"
                value={it.productName}
                onChange={(e) => updateItem(i, { productName: e.target.value })}
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="any"
                placeholder="数量"
                value={it.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="any"
                placeholder="单价"
                value={it.unitPrice}
                onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                className="w-28 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <span className="w-24 text-right text-sm text-gray-500">
                ¥{(it.quantity * it.unitPrice).toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-xs text-red-600 hover:underline"
              >
                删除
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-sm font-medium">
          总金额：¥{total.toFixed(2)}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? "提交中..." : "确认生成采购订单"}
      </button>
    </form>
  );
}
