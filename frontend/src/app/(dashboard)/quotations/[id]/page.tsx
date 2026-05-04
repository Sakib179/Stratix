import { QuotationDetail } from '@/components/quotations/QuotationDetail';

export const metadata = { title: 'Quotation – Stratix' };

export default function QuotationDetailPage({ params }: { params: { id: string } }) {
  return <QuotationDetail id={params.id} />;
}
