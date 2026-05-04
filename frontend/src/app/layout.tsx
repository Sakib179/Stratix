import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppProviders from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: { default: 'Stratix', template: '%s · Stratix' },
  description: 'Stratix Business Management System — Professional PERN Stack Solution',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0a0f1e' },
    { media: '(prefers-color-scheme: light)', color: '#f4f2ff' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = JSON.parse(localStorage.getItem('stratix-theme') || '{}');
                var t = (s.state && s.state.theme) || 'dark';
                document.documentElement.classList.remove('dark','light');
                document.documentElement.classList.add(t);
              } catch(e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
