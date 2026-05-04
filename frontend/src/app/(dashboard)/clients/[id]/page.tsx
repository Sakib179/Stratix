import { ClientDetail } from '@/components/clients/ClientDetail';

export const metadata = { title: 'Client Detail — Stratix' };

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return <ClientDetail clientId={params.id} />;
}
