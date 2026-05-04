'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Users, FileText, BarChart3,
  Bell, Shield, ChevronLeft, ChevronRight, LogOut, Settings,
  ChevronDown, Hexagon, ClipboardList, Receipt, Truck,
  ShoppingCart, SlidersHorizontal, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';
import Avatar from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  module?: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',        href: '/dashboard',         icon: <LayoutDashboard size={18} /> },
  { label: 'Products',         href: '/products',          icon: <Package size={18} />,          module: 'products' },
  { label: 'Clients',          href: '/clients',           icon: <Users size={18} />,            module: 'invoices' },
  { label: 'Invoices',         href: '/invoices',          icon: <FileText size={18} />,         module: 'invoices' },
  { label: 'Quotations',       href: '/quotations',        icon: <ClipboardList size={18} />,    module: 'invoices' },
  { label: 'Analytics',        href: '/analytics',         icon: <BarChart3 size={18} />,        module: 'analytics' },
  { label: 'Expenses',         href: '/expenses',          icon: <Receipt size={18} /> },
  { label: 'Suppliers',        href: '/suppliers',         icon: <Truck size={18} /> },
  { label: 'Purchase Orders',  href: '/purchase-orders',   icon: <ShoppingCart size={18} /> },
  { label: 'Stock Adjustments',href: '/stock-adjustments', icon: <SlidersHorizontal size={18} /> },
  { label: 'Notifications',    href: '/notifications',     icon: <Bell size={18} /> },
];

const adminItems: NavItem[] = [
  {
    label: 'Admin Panel', href: '/admin', icon: <Shield size={18} />, adminOnly: true,
    children: [
      { label: 'Overview',  href: '/admin' },
      { label: 'Users',     href: '/admin/users' },
      { label: 'Audit Log', href: '/admin/audit-log' },
    ],
  },
  { label: 'Settings', href: '/settings', icon: <Settings size={18} />, adminOnly: true },
];

const SIDEBAR_KEY = 'stratix-sidebar-collapsed';

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { mobileOpen, closeMobile } = useSidebarStore();
  const isMobile = useIsMobile();

  /* Close mobile drawer on route change */
  useEffect(() => { closeMobile(); }, [pathname]);

  /* Restore desktop collapse state */
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved !== null) setCollapsed(saved === 'true');
  }, []);

  /* Sync --sidebar-w CSS variable */
  useEffect(() => {
    if (isMobile) {
      document.documentElement.style.setProperty('--sidebar-w', '0px');
    } else {
      document.documentElement.style.setProperty('--sidebar-w', collapsed ? '72px' : '264px');
    }
  }, [isMobile, collapsed]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
    document.documentElement.style.setProperty('--sidebar-w', next ? '72px' : '264px');
  };

  const isActive = (href?: string) => href && (pathname === href || pathname.startsWith(href + '/'));

  const hasAccess = (item: NavItem) => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    if (item.module && user?.role !== 'admin') {
      const perm = user?.permissions?.find((p) => p.module === item.module);
      return perm?.can_access ?? false;
    }
    return true;
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  /* On mobile: always full-width expanded; on desktop: respect collapsed */
  const effectiveCollapsed = isMobile ? false : collapsed;
  const desktopW = collapsed ? 72 : 264;

  return (
    <>
      {/* ── Mobile backdrop ─────────────────────────────────── */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={
          isMobile
            ? { x: mobileOpen ? 0 : -300 }
            : { width: desktopW }
        }
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{
          width: isMobile ? 280 : undefined,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        {/* ── Logo row ────────────────────────────────────────── */}
        <div className="flex items-center h-16 px-4 border-b border-[rgba(99,102,241,0.1)] flex-shrink-0 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center flex-shrink-0 shadow-brand-sm">
              <Hexagon size={18} className="text-white fill-white/20" strokeWidth={2} />
            </div>
            <AnimatePresence>
              {!effectiveCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <span className="text-lg font-bold gradient-text tracking-tight">Stratix</span>
                  <p className="text-[10px] text-surface-200 leading-none mt-0.5">Business Management</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={closeMobile}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-surface-200 hover:text-white hover:bg-surface-600/30 transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1 no-scrollbar">
          {navItems.filter(hasAccess).map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={effectiveCollapsed}
              active={!!isActive(item.href)}
              hovered={hoveredItem === item.label}
              onHover={(h) => setHoveredItem(h ? item.label : null)}
            />
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="my-3 px-2">
                <div className="h-px bg-[rgba(99,102,241,0.12)]" />
              </div>
              {adminItems.filter(hasAccess).map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={effectiveCollapsed}
                  active={!!isActive(item.href)}
                  hovered={hoveredItem === item.label}
                  onHover={(h) => setHoveredItem(h ? item.label : null)}
                />
              ))}
            </>
          )}
        </nav>

        {/* ── User card ───────────────────────────────────────── */}
        <div className="flex-shrink-0 p-2 border-t border-[rgba(99,102,241,0.1)] space-y-1">
          <Link href="/profile" className="nav-item" onClick={isMobile ? closeMobile : undefined}>
            <Avatar name={user?.full_name || 'U'} size="sm" />
            <AnimatePresence>
              {!effectiveCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                  <p className="text-xs text-surface-200 capitalize">{user?.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          <button
            onClick={handleLogout}
            className="nav-item w-full text-left text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={16} className="flex-shrink-0" />
            <AnimatePresence>
              {!effectiveCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm">
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Collapse toggle — desktop only */}
          {!isMobile && (
            <button
              onClick={toggleCollapsed}
              className="nav-item w-full justify-center text-surface-200 hover:text-white hover:bg-surface-600/30"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs">
                    Collapse
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}

/* ── NavLink ────────────────────────────────────────────────────── */

function NavLink({
  item, collapsed, active, hovered, onHover,
}: {
  item: NavItem; collapsed: boolean; active: boolean; hovered: boolean; onHover: (h: boolean) => void;
}) {
  const pathname = usePathname();
  const { closeMobile } = useSidebarStore();
  const [open, setOpen] = useState(() => item.children?.some((c) => pathname.startsWith(c.href)) ?? false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="relative" onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      {item.href ? (
        hasChildren ? (
          <button onClick={() => setOpen((o) => !o)} className={cn('nav-item w-full', active && 'active')}>
            <span className="flex-shrink-0">{item.icon}</span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap flex-1 text-left"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {!collapsed && (
              <ChevronDown size={14} className={cn('text-surface-300 transition-transform flex-shrink-0', open && 'rotate-180')} />
            )}
          </button>
        ) : (
          <Link href={item.href} onClick={closeMobile} className={cn('nav-item', active && 'active')}>
            <span className="flex-shrink-0">{item.icon}</span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {active && (
              <motion.div layoutId="activeIndicator" className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-400" />
            )}
          </Link>
        )
      ) : null}

      {/* Sub-menu */}
      <AnimatePresence>
        {hasChildren && open && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden pl-7 mt-0.5 space-y-0.5"
          >
            {item.children!.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href} href={child.href} onClick={closeMobile}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
                    childActive ? 'text-brand-300 bg-brand-500/10' : 'text-surface-200 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span className="w-1 h-1 rounded-full bg-current opacity-60 flex-shrink-0" />
                  {child.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip when collapsed (desktop only) */}
      <AnimatePresence>
        {collapsed && hovered && (
          <motion.div
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 rounded-lg bg-surface-600 text-white text-sm font-medium whitespace-nowrap shadow-xl border border-[rgba(99,102,241,0.2)] z-50 overflow-hidden"
          >
            {hasChildren ? (
              <div className="py-1">
                <p className="px-3 py-1.5 font-medium border-b border-white/10">{item.label}</p>
                {item.children!.map((child) => (
                  <Link key={child.href} href={child.href} className="block px-3 py-1.5 hover:bg-white/10 transition-colors">
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-3 py-1.5">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-600" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
