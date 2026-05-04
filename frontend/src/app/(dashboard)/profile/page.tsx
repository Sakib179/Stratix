import type { Metadata } from 'next';
import ProfilePage from '@/components/profile/ProfilePage';

export const metadata: Metadata = { title: 'My Profile' };

export default function Profile() {
  return <ProfilePage />;
}
