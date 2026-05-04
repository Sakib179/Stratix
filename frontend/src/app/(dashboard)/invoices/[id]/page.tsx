import { InvoiceDetail } from '@/components/invoices/InvoiceDetail';

export const metadata = { title: 'Invoice Detail — Stratix' };

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  return <InvoiceDetail invoiceId={params.id} />;
}
