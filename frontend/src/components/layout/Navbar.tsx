'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, Settings, User, LogOut, Shield, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

const routeLabels: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/products':      'Products',
  '/clients':       'Clients',
  '/invoices':      'Invoices',
  '/analytics':     'Analytics & Reports',
  '/notifications': 'Notifications',
  '/admin':         'Admin Panel',
  '/settings':      'Settings',
  '/profile':       'My Profile',
};

const getPageTitle = (pathname: string) => {
  for (const [key, label] of Object.entries(routeLabels)) {
    if (pathname === key || pathname.startsWith(key + '/')) return label;
  }
  return 'Stratix';
};

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { openMobile } = useSidebarStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data),
    refetchInterval: 30000,
    initialData: [],
  });

  const unread = Array.isArray(notifData) ? notifData.filter((n: { is_read: boolean }) => !n.is_read).length : 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
    } catch {}
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center px-6 gap-4"
      style={{
        left: 'var(--sidebar-w, 264px)',
        background: 'var(--navbar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--navbar-border)',
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={openMobile}
        className="lg:hidden flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-surface-100 hover:bg-surface-600/40 hover:text-white transition-all duration-200 mr-1"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <motion.h1
          key={pathname}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-base sm:text-lg font-semibold text-white truncate"
        >
          {getPageTitle(pathname)}
        </motion.h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); }}
            className={cn(
              'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
              notifOpen ? 'bg-brand-500/20 text-brand-400' : 'text-surface-100 hover:bg-surface-600/40 hover:text-white'
            )}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1"
              >
                {unread > 99 ? '99+' : unread}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-2 w-[320px] max-w-[calc(100vw-1rem)] glass shadow-card-hover overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(99,102,241,0.1)]">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {!notifData || notifData.length === 0 ? (
                    <div className="py-8 text-center text-sm text-surface-200">No notifications yet</div>
                  ) : (
                    notifData.slice(0, 10).map((n: { id: string; is_read: boolean; link?: string; title: string; body?: string; created_at: string }) => (
                      <Link
                        key={n.id}
                        href={n.link || '#'}
                        onClick={() => setNotifOpen(false)}
                        className={cn(
                          'flex gap-3 px-4 py-3 hover:bg-surface-600/30 transition-colors border-b border-[rgba(99,102,241,0.05)] last:border-0',
                          !n.is_read && 'bg-brand-500/5'
                        )}
                      >
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0 mt-1.5" />}
                        <div className={cn('flex-1 min-w-0', n.is_read && 'pl-5')}>
                          <p className="text-sm font-medium text-white truncate">{n.title}</p>
                          {n.body && <p className="text-xs text-surface-200 truncate mt-0.5">{n.body}</p>}
                          <p className="text-xs text-surface-300 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="border-t border-[rgba(99,102,241,0.1)]">
                  <Link href="/notifications" onClick={() => setNotifOpen(false)} className="block text-center text-xs text-brand-400 py-3 hover:text-brand-300 transition-colors">
                    View all notifications →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => { setUserMenuOpen((v) => !v); setNotifOpen(false); }}
            className={cn(
              'flex items-center gap-2.5 h-10 px-3 rounded-xl transition-all duration-200',
              userMenuOpen ? 'bg-surface-600/50' : 'hover:bg-surface-600/30'
            )}
          >
            <Avatar name={user?.full_name || 'U'} size="sm" />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight truncate max-w-[120px]">{user?.full_name}</p>
              <p className="text-xs text-surface-200 capitalize">{user?.role}</p>
            </div>
            <ChevronDown
              size={14}
              className={cn('text-surface-200 transition-transform duration-200', userMenuOpen && 'rotate-180')}
            />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-2 w-52 glass shadow-card-hover overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[rgba(99,102,241,0.1)]">
                  <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
                  <p className="text-xs text-surface-200 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <MenuItem href="/profile" icon={<User size={15} />} label="My Profile" onClick={() => setUserMenuOpen(false)} />
                  {user?.role === 'admin' && (
                    <MenuItem href="/admin" icon={<Shield size={15} />} label="Admin Panel" onClick={() => setUserMenuOpen(false)} />
                  )}
                  <MenuItem href="/settings" icon={<Settings size={15} />} label="Settings" onClick={() => setUserMenuOpen(false)} />
                  <div className="h-px bg-[rgba(99,102,241,0.1)] my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-surface-100 hover:text-white hover:bg-surface-600/30 transition-colors"
    >
      <span className="text-surface-200">{icon}</span>
      {label}
    </Link>
  );
}
