import { UserDetail } from '@/components/admin/UserDetail';

export const metadata = { title: 'User Detail — Stratix' };

interface Props { params: { id: string } }

export default function UserDetailPage({ params }: Props) {
  return <UserDetail userId={params.id} />;
}
