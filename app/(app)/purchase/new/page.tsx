import PurchaseOrderForm from "../purchase-order-form";

export default function NewPurchaseOrderPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">新建采购订单</h1>
      <PurchaseOrderForm />
    </div>
  );
}
