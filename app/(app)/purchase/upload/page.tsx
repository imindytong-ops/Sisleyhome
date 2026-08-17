"use client";

import { useRef, useState } from "react";
import PurchaseOrderForm, {
  PurchaseOrderFormInitial,
} from "../purchase-order-form";

const DOC_TYPES = [
  { value: "INVOICE", label: "发票" },
  { value: "DELIVERY_NOTE", label: "送货单" },
];

export default function PurchaseUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [docType, setDocType] = useState("INVOICE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PurchaseOrderFormInitial | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  }

  async function handleRecognize() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("请先选择一张图片");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "识别失败");
        return;
      }
      setResult({
        orderNo: data.result.documentNo ?? "",
        supplierName: data.result.supplierName ?? "",
        orderDate: data.result.documentDate ?? undefined,
        items: (data.result.items ?? []).map(
          (it: {
            productName: string | null;
            quantity: number | null;
            unitPrice: number | null;
          }) => ({
            productName: it.productName ?? "",
            quantity: it.quantity ?? 0,
            unitPrice: it.unitPrice ?? 0,
          })
        ),
        documentId: data.documentId,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">拍照 / 截图识别录入</h1>

      {!result && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500">单据类型</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              上传照片或截图（支持手机拍照）
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm"
            />
          </div>

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="预览"
              className="max-h-80 rounded-md border border-gray-200 object-contain"
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleRecognize}
            disabled={loading || !preview}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "识别中，请稍候..." : "开始识别"}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            已根据识别结果预填以下信息，请核对/修正后再确认提交。
          </div>
          <PurchaseOrderForm initial={result} />
        </div>
      )}
    </div>
  );
}
