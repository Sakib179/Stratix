import { PurchaseOrderDetail } from '@/components/purchase-orders/PurchaseOrderDetail';

export const metadata = { title: 'Purchase Order – Stratix' };

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  return <PurchaseOrderDetail id={params.id} />;
}
