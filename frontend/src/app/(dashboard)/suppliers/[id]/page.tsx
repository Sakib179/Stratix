import { SupplierDetail } from '@/components/suppliers/SupplierDetail';

export const metadata = { title: 'Supplier – Stratix' };

export default function SupplierDetailPage({ params }: { params: { id: string } }) {
  return <SupplierDetail id={params.id} />;
}
