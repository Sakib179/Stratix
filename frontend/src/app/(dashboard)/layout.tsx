'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-surface-900">
      <div className="mesh-bg" />
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-w, 264px)' }}
      >
        <Navbar />
        <main
          className="flex-1 relative z-10 pt-16"
          style={{ minHeight: 'calc(100vh - 64px)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
