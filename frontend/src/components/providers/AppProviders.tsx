'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: (count, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return count < 2;
      },
    },
  },
});

function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(theme);
  }, [theme]);
  return null;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize().finally(() => setMounted(true));
  }, [initialize]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-xl bg-brand-gradient opacity-20 animate-ping" />
            <div className="relative w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center">
              <span className="text-white text-xl font-bold">S</span>
            </div>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <AuthInitializer>{children}</AuthInitializer>
      <Toaster
        position="top-right"
        containerClassName="toast-container"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1c2436',
            color: '#f9fafb',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '12px',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0a0f1e' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0a0f1e' },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
