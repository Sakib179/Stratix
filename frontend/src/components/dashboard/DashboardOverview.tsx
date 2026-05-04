'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Users, Package, TrendingUp, TrendingDown, ArrowUpRight,
  ShieldCheck, Clock, Activity, Bell, Shield, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import PageTransition from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/Badge';
import { analyticsApi } from '@/lib/analyticsApi';
import { invoiceApi } from '@/lib/invoiceApi';
import { formatCurrency, formatDate } from '@/lib/utils';

/* ─── helpers ─────────────────────────────────────────────────────── */

function useLiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setCount(Math.round(eased * target));
      if (p >= 1) { setCount(target); clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return count;
}

function genSparkline(trend: number | null, n = 14): { v: number }[] {
  const base = 50;
  return Array.from({ length: n }, (_, i) => ({
    v: Math.max(4, base + (Math.random() - 0.5) * 24 + (trend != null ? (trend / n) * i * 0.9 : 0)),
  }));
}

/* ─── KPI card ────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  rawValue: number;
  formatFn: (n: number) => string;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  sparkData: { v: number }[];
  href: string;
  isLight: boolean;
}

function StatCard({ label, rawValue, formatFn, sub, icon: Icon, gradient, sparkData, href, isLight }: StatCardProps) {
  const count = useCountUp(rawValue);
  const isPositive = !sub?.startsWith('-');
  const sparkId = `spark-${label.replace(/\s+/g, '')}`;

  /* In light mode every card gets its own vivid accent colour tint */
  const cardBg   = isLight
    ? `linear-gradient(145deg, ${gradient}18 0%, ${gradient}0c 60%, white 100%)`
    : 'var(--bg-card)';
  const cardBorder = isLight ? `1.5px solid ${gradient}50` : '1px solid var(--border)';
  const sparkOpacity = isLight ? 0.55 : 0.35;

  return (
    <Link href={href} className="block h-full">
      <motion.div
        whileHover={{ y: -6, transition: { duration: 0.2 } }}
        className="relative h-full overflow-hidden rounded-2xl p-5 cursor-pointer group"
        style={{ background: cardBg, border: cardBorder }}
      >
        {/* hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `radial-gradient(circle at 30% 20%, ${gradient}${isLight ? '30' : '20'}, transparent 65%)` }}
        />

        {/* sparkline bg */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none transition-opacity duration-300"
          style={{ opacity: sparkOpacity }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradient} stopOpacity={isLight ? 0.7 : 0.5} />
                  <stop offset="100%" stopColor={gradient} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={gradient} strokeWidth={isLight ? 2 : 1.5}
                fill={`url(#${sparkId})`} dot={false} isAnimationActive animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* top-right corner glow */}
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"
          style={{ background: gradient }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <motion.div
              whileHover={{ scale: 1.12, rotate: 6 }}
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: isLight ? `${gradient}28` : `${gradient}1a`,
                border: `1.5px solid ${gradient}${isLight ? '55' : '40'}`,
                boxShadow: isLight ? `0 4px 14px ${gradient}35` : 'none',
              }}
            >
              <Icon size={20} style={{ color: gradient }} />
            </motion.div>
            <ArrowUpRight
              size={15}
              className="text-surface-200 group-hover:text-brand-400 group-hover:scale-110 transition-all duration-200"
              style={{ color: isLight ? undefined : 'rgba(180,190,210,0.7)' }}
            />
          </div>

          <div className="mt-7">
            <p className="text-2xl font-bold tabular-nums" style={{ color: isLight ? 'var(--text-primary)' : '#ffffff' }}>
              {formatFn(count)}
            </p>
            <p className="text-sm mt-0.5 font-semibold" style={{ color: isLight ? gradient : '#c4b5fd' }}>
              {label}
            </p>
            {sub && (
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {sub}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ─── main component ─────────────────────────────────────────────── */

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const isLight = useThemeStore((s) => s.theme === 'light');
  const time = useLiveClock();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const emoji   = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview', 30],
    queryFn: () => analyticsApi.overview({ period: 30 }),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices', 1, '', '', 'created_at', 'desc'],
    queryFn: () => invoiceApi.list({ page: 1, limit: 6, sort: 'created_at', order: 'desc' }),
  });
  const recentInvoices = invoicesData?.data ?? [];

  const sparks = useMemo(() => ({
    invoices: genSparkline(overview?.invoice_change_pct ?? null),
    clients:  genSparkline(overview?.client_change_pct ?? null),
    products: genSparkline(null),
    revenue:  genSparkline(overview?.revenue_change_pct ?? null),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [overview?.invoice_change_pct, overview?.client_change_pct, overview?.revenue_change_pct]);

  const stats: Omit<StatCardProps, 'isLight'>[] = [
    {
      label: 'Total Invoices',   rawValue: overview?.total_invoices ?? 0,  formatFn: String,
      sub: overview?.invoice_change_pct != null ? `${overview.invoice_change_pct > 0 ? '+' : ''}${overview.invoice_change_pct.toFixed(1)}% vs last month` : undefined,
      icon: FileText, gradient: '#6366f1', sparkData: sparks.invoices, href: '/invoices',
    },
    {
      label: 'Active Clients',   rawValue: overview?.total_clients ?? 0,   formatFn: String,
      sub: overview?.client_change_pct != null ? `${overview.client_change_pct > 0 ? '+' : ''}${overview.client_change_pct.toFixed(1)}% vs last month` : undefined,
      icon: Users, gradient: '#8b5cf6', sparkData: sparks.clients, href: '/clients',
    },
    {
      label: 'Products',         rawValue: overview?.total_products ?? 0,  formatFn: String,
      icon: Package, gradient: '#06b6d4', sparkData: sparks.products, href: '/products',
    },
    {
      label: 'Revenue (30d)',    rawValue: overview?.revenue_period ?? 0,  formatFn: formatCurrency,
      sub: overview?.revenue_change_pct != null ? `${overview.revenue_change_pct > 0 ? '+' : ''}${overview.revenue_change_pct.toFixed(1)}% vs prev period` : undefined,
      icon: TrendingUp, gradient: '#10b981', sparkData: sparks.revenue, href: '/analytics',
    },
  ];

  const quickActions = [
    { label: 'New Invoice',   href: '/invoices/new',   from: '#6366f1', to: '#8b5cf6', icon: FileText },
    { label: 'Add Product',   href: '/products',        from: '#06b6d4', to: '#0891b2', icon: Package },
    { label: 'Add Client',    href: '/clients',         from: '#8b5cf6', to: '#7c3aed', icon: Users },
    { label: 'Analytics',     href: '/analytics',       from: '#10b981', to: '#059669', icon: TrendingUp },
    { label: 'Notifications', href: '/notifications',   from: '#f59e0b', to: '#d97706', icon: Bell },
    ...(user?.role === 'admin'
      ? [{ label: 'Admin Panel', href: '/admin',       from: '#ef4444', to: '#dc2626', icon: Shield }]
      : [{ label: 'Quotations',  href: '/quotations',  from: '#a78bfa', to: '#7c3aed', icon: Zap }]),
  ];

  /* ── per-mode design tokens ── */
  const heroGradient = isLight
    ? 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.18) 45%, rgba(6,182,212,0.14) 100%)'
    : 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.09) 50%, rgba(6,182,212,0.07) 100%)';
  const heroBorder   = isLight ? '1.5px solid rgba(99,102,241,0.38)' : '1px solid rgba(99,102,241,0.22)';
  const cardBg       = isLight ? 'rgba(255,255,255,0.82)' : 'var(--bg-card)';
  const cardBorder   = isLight ? '1.5px solid rgba(99,102,241,0.18)' : '1px solid var(--border)';
  const cardShadow   = isLight ? '0 4px 28px rgba(99,102,241,0.1)' : 'none';

  /* orbs: vivid colours in light mode, subtle in dark */
  const ORBS = isLight
    ? [
        { w: 560, h: 460, x: '5%',  y: '3%',  color: 'rgba(99,102,241,0.22)',  dur: 9  },
        { w: 400, h: 340, x: '80%', y: '2%',  color: 'rgba(139,92,246,0.20)',  dur: 13 },
        { w: 340, h: 300, x: '50%', y: '52%', color: 'rgba(6,182,212,0.17)',   dur: 16 },
        { w: 260, h: 240, x: '18%', y: '78%', color: 'rgba(16,185,129,0.15)',  dur: 11 },
        { w: 220, h: 200, x: '88%', y: '70%', color: 'rgba(245,158,11,0.13)',  dur: 14 },
      ]
    : [
        { w: 520, h: 440, x: '8%',  y: '5%',  color: 'rgba(99,102,241,0.09)',  dur: 9  },
        { w: 360, h: 300, x: '78%', y: '2%',  color: 'rgba(139,92,246,0.07)',  dur: 13 },
        { w: 300, h: 280, x: '48%', y: '55%', color: 'rgba(6,182,212,0.06)',   dur: 16 },
        { w: 200, h: 180, x: '20%', y: '75%', color: 'rgba(16,185,129,0.05)',  dur: 11 },
      ];

  return (
    <PageTransition className="page-container space-y-5 relative overflow-x-hidden">

      {/* ── Colorful light-mode page background ───────────────────── */}
      <AnimatePresence>
        {isLight && (
          <motion.div
            key="light-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: -1,
              background: 'linear-gradient(145deg, #eceaff 0%, #dff0ff 22%, #dbfff3 45%, #fffbe0 68%, #ffe8f6 88%, #eceaff 100%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Ambient orbs ──────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        {ORBS.map((orb, i) => (
          <motion.div
            key={`${isLight}-${i}`}
            className="absolute rounded-full"
            style={{
              width: orb.w, height: orb.h,
              left: orb.x, top: orb.y,
              background: orb.color,
              filter: `blur(${isLight ? 60 : 70}px)`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ y: [0, -28, 12, -18, 0], x: [0, 16, -10, 6, 0], scale: [1, 1.05, 0.97, 1.03, 1] }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 1.8 }}
          />
        ))}
      </div>

      {/* ── Hero header ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 rounded-2xl overflow-hidden"
        style={{ background: heroGradient, border: heroBorder, backdropFilter: 'blur(16px)' }}
      >
        {/* animated shimmer sweep */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), rgba(139,92,246,0.8), rgba(6,182,212,0.6), transparent)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />
        {/* bottom shimmer for light mode */}
        {isLight && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.7), rgba(99,102,241,0.7), transparent)' }}
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
          />
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <motion.span
                  animate={{ rotate: [0, 12, -6, 8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 6 }}
                  className="text-xl select-none"
                >
                  {emoji}
                </motion.span>
                <p className={`text-sm font-semibold ${isLight ? 'text-brand-600' : 'text-brand-300'}`}>
                  {greeting}
                </p>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                Welcome back,{' '}
                <span className="gradient-text-animated">{user?.full_name?.split(' ')[0] ?? 'there'}</span>
              </h1>
              <p className="text-sm mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* live clock */}
              <AnimatePresence mode="wait">
                {time && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-4 py-2.5 rounded-xl font-mono text-sm font-bold tracking-widest"
                    style={{
                      background: isLight ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.13)',
                      border: `1.5px solid rgba(99,102,241,${isLight ? '0.35' : '0.28'})`,
                      color: isLight ? '#4f46e5' : '#818cf8',
                      minWidth: '116px',
                      textAlign: 'center',
                      boxShadow: isLight ? '0 2px 12px rgba(99,102,241,0.15)' : 'none',
                    }}
                  >
                    {time}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* online badge */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{
                  background: isLight ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.1)',
                  border: `1.5px solid rgba(16,185,129,${isLight ? '0.38' : '0.25'})`,
                  boxShadow: isLight ? '0 2px 12px rgba(16,185,129,0.15)' : 'none',
                }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                <span className={`text-sm font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>Live</span>
              </div>
            </div>
          </div>

          {/* pending invoices alert */}
          <AnimatePresence>
            {(overview?.pending_invoices ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="flex items-center gap-2.5 text-sm overflow-hidden"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="text-base select-none"
                >⚠️</motion.span>
                <span style={{ color: isLight ? '#b45309' : '#fcd34d', fontWeight: 600 }}>
                  <strong>{overview!.pending_invoices}</strong> pending invoice{overview!.pending_invoices > 1 ? 's' : ''} need attention.
                </span>
                <Link href="/invoices?status=Issued"
                  className={`underline underline-offset-2 font-semibold transition-colors ${isLight ? 'text-amber-700 hover:text-amber-800' : 'text-amber-300 hover:text-amber-200'}`}>
                  View now →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── KPI cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 relative z-10">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <motion.div key={i} className="h-44 rounded-2xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
              />
            ))
          : stats.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.09, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <StatCard {...s} isLight={isLight} />
              </motion.div>
            ))}
      </div>

      {/* ── Recent invoices + Quick actions ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative z-10">

        {/* recent invoices */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
          className="lg:col-span-3 rounded-2xl p-5"
          style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Recent Invoices</h3>
            <Link href="/invoices"
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${isLight ? 'text-brand-600 hover:text-brand-700' : 'text-brand-300 hover:text-white'}`}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <FileText size={36} className={isLight ? 'text-brand-400' : 'text-brand-500/40'} />
              </motion.div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No invoices yet</p>
              <Link href="/invoices/new">
                <motion.span whileHover={{ scale: 1.04 }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isLight
                      ? 'text-brand-700 border border-brand-400 hover:bg-brand-50'
                      : 'text-brand-400 border border-brand-500/30 hover:bg-brand-500/10'
                  }`}
                >
                  Create first invoice →
                </motion.span>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentInvoices.map((inv, i) => (
                <motion.div key={inv.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.44 + i * 0.06, duration: 0.35 }}>
                  <Link href={`/invoices/${inv.id}`}>
                    <motion.div
                      whileHover={{ x: 3, backgroundColor: isLight ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)' }}
                      className="flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer"
                      style={{ border: '1px solid transparent' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isLight ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)',
                            border: `1px solid rgba(99,102,241,${isLight ? '0.3' : '0.2'})`,
                          }}>
                          <FileText size={13} className={isLight ? 'text-brand-600' : 'text-brand-400'} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isLight ? 'text-brand-600' : 'text-brand-300'}`}>
                            {inv.invoice_number}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {(inv as any).client_name ?? '—'} · {formatDate(inv.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(inv.grand_total)}
                        </p>
                        <Badge statusKey={inv.status}>{inv.status}</Badge>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* quick actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.44, duration: 0.5 }}
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
        >
          <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {quickActions.map((a, i) => (
              <Link key={a.label} href={a.href}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.3, ease: 'backOut' }}
                  whileHover={{ scale: 1.07, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2.5 p-3 rounded-xl cursor-pointer"
                  style={{
                    background: isLight
                      ? `linear-gradient(135deg, ${a.from}22, ${a.to}16)`
                      : `linear-gradient(135deg, ${a.from}14, ${a.to}0a)`,
                    border: `1.5px solid ${a.from}${isLight ? '45' : '28'}`,
                    boxShadow: isLight ? `0 3px 12px ${a.from}25` : 'none',
                  }}
                >
                  <motion.div
                    whileHover={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.4 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
                      boxShadow: isLight ? `0 4px 14px ${a.from}50` : `0 4px 10px ${a.from}30`,
                    }}
                  >
                    <a.icon size={16} className="text-white" />
                  </motion.div>
                  <span className="text-[11px] font-bold text-center leading-tight"
                    style={{ color: isLight ? a.from : 'var(--text-primary)' }}>
                    {a.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Account status ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="rounded-2xl p-5 relative z-10"
        style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow }}
      >
        <h3 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Account Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: ShieldCheck, label: '2FA Protection', value: user?.two_factor_enabled ? 'Enabled' : 'Disabled', accent: user?.two_factor_enabled ? '#10b981' : '#f59e0b' },
            { icon: Clock,       label: 'Last Login',     value: user?.last_login ? formatDate(user.last_login, 'MMM d, yyyy') : '—', accent: '#6366f1' },
            { icon: Activity,    label: 'Account Role',   value: user?.role ?? '—', accent: '#8b5cf6' },
            { icon: FileText,    label: 'Pending',        value: String(overview?.pending_invoices ?? 0), accent: (overview?.pending_invoices ?? 0) > 0 ? '#f59e0b' : '#10b981' },
          ].map((item, i) => (
            <motion.div key={item.label}
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.06, duration: 0.35 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{
                background: `${item.accent}${isLight ? '18' : '0f'}`,
                border: `1.5px solid ${item.accent}${isLight ? '45' : '28'}`,
                boxShadow: isLight ? `0 3px 14px ${item.accent}20` : 'none',
              }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${item.accent}${isLight ? '28' : '20'}`,
                  boxShadow: isLight ? `0 2px 8px ${item.accent}30` : 'none',
                }}>
                <item.icon size={16} style={{ color: item.accent }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                <p className="text-sm font-bold capitalize truncate" style={{ color: item.accent }}>{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {!user?.two_factor_enabled && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }} transition={{ delay: 0.8 }}
            >
              <Link href="/profile?tab=security">
                <motion.div
                  whileHover={{ scale: 1.01, x: 2 }}
                  className="mt-4 p-3.5 rounded-xl flex items-center gap-3 cursor-pointer"
                  style={{
                    background: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.09)',
                    border: `1.5px solid rgba(245,158,11,${isLight ? '0.4' : '0.25'})`,
                    boxShadow: isLight ? '0 3px 14px rgba(245,158,11,0.18)' : 'none',
                  }}
                >
                  <motion.span
                    animate={{ rotate: [0, 12, -10, 8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                    className="text-lg flex-shrink-0 select-none"
                  >⚠️</motion.span>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      Enable 2-Factor Authentication
                    </p>
                    <p className="text-xs mt-0.5"
                      style={{ color: isLight ? 'rgba(180,83,9,0.75)' : 'rgba(252,211,77,0.65)' }}>
                      Protect your account with an authenticator app —{' '}
                      <span className="underline underline-offset-2">Set up now</span>
                    </p>
                  </div>
                  <ArrowUpRight size={15} className={`ml-auto flex-shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </PageTransition>
  );
}
