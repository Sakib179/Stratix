'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useThemeStore } from '@/store/themeStore';
import {
  Hexagon, ArrowRight, BarChart3, FileText, Package, Users,
  Shield, Bell, ChevronRight, Star, Zap, Globe, TrendingUp,
  CreditCard, Truck, CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  { icon: FileText,   title: 'Smart Invoicing',     desc: 'Create, send and track invoices with auto-numbering, PDF export and payment recording.',        color: 'from-brand-500 to-brand-600' },
  { icon: Package,    title: 'Inventory Control',    desc: 'Real-time stock tracking, low-stock alerts, bulk CSV import, and full adjustment audit logs.', color: 'from-violet-500 to-violet-600' },
  { icon: Users,      title: 'Client Management',    desc: 'Centralised client profiles, communication history, and smart search.',                        color: 'from-cyan-500 to-cyan-600' },
  { icon: BarChart3,  title: 'Analytics & Reports',  desc: 'Revenue charts, top products, invoice aging, expense breakdowns — all in one dashboard.',      color: 'from-emerald-500 to-emerald-600' },
  { icon: CreditCard, title: 'Expense Tracking',     desc: 'Log business expenses by category, export CSV reports, and monitor your P&L.',                color: 'from-amber-500 to-amber-600' },
  { icon: Truck,      title: 'Procurement',          desc: 'Manage suppliers, raise purchase orders, and auto-update stock on receipt.',                   color: 'from-rose-500 to-rose-600' },
  { icon: FileText,   title: 'Quotations',           desc: 'Build professional quotes and convert them to invoices in one click.',                         color: 'from-indigo-500 to-indigo-600' },
  { icon: Shield,     title: 'Enterprise Security',  desc: 'Role-based access control, 2FA, JWT auth, full audit logging and session management.',         color: 'from-slate-500 to-slate-600' },
];

const STATS = [
  { value: '99.9%',   label: 'Uptime SLA',     valueColor: '#34d399' },
  { value: '< 200ms', label: 'API Response',   valueColor: '#22d3ee' },
  { value: '256-bit', label: 'Encryption',     valueColor: '#a78bfa' },
  { value: '∞',       label: 'Data Retention', valueColor: '#818cf8' },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen',   role: 'CEO, NexTrade Ltd',        text: 'Stratix transformed how we handle invoices and inventory. The real-time analytics alone saved us hours every week.', rating: 5 },
  { name: 'Rafiq Ahmed',  role: 'Finance Director, BuildCore', text: "The quotation-to-invoice workflow is seamless. We've cut our billing cycle from 3 days to 20 minutes.", rating: 5 },
  { name: 'Priya Sharma', role: 'Ops Manager, SwiftSupply', text: 'Purchase orders + stock auto-update is a game changer. No more manual entry errors.', rating: 5 },
];

const TD = {
  heading: '#f0f4ff',
  sub:     'rgba(255,255,255,0.78)',
  dim:     'rgba(255,255,255,0.58)',
  faint:   'rgba(255,255,255,0.38)',
};
const TL = {
  heading: '#1e1b4b',
  sub:     'rgba(30,27,75,0.72)',
  dim:     'rgba(30,27,75,0.52)',
  faint:   'rgba(30,27,75,0.36)',
};

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const T = isLight ? TL : TD;

  return (
    <div className={`landing-page min-h-screen overflow-x-hidden ${isLight ? 'bg-gradient-to-br from-slate-50 via-indigo-50/60 to-purple-50/60' : 'bg-[#040812]'}`} style={{ color: T.heading }}>

      {/* ── Animated background blobs ─────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] animate-blob ${isLight ? 'bg-brand-400/20' : 'bg-brand-600/20'}`} />
        <div className={`absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full blur-[120px] animate-blob animation-delay-2000 ${isLight ? 'bg-violet-400/18' : 'bg-violet-600/15'}`} />
        <div className={`absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px] animate-blob animation-delay-4000 ${isLight ? 'bg-cyan-400/15' : 'bg-cyan-600/10'}`} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl ${isLight ? 'border-slate-200/70 bg-white/85' : 'border-white/5 bg-[#040812]/70'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Hexagon size={16} style={{ color: '#fff' }} className="fill-white/20" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: T.heading }}>Stratix</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: T.sub }}>
            {(['#features', '#analytics', '#testimonials'] as const).map((href, i) => (
              <a
                key={href}
                href={href}
                className="transition-colors hover:opacity-100 opacity-80"
                style={{ color: T.heading }}
              >
                {['Features', 'Analytics', 'Reviews'][i]}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm px-4 py-2 transition-colors" style={{ color: T.sub }}>
              Sign In
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-20 sm:pt-16 z-10">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center max-w-5xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium mb-8"
          >
            <ChevronRight size={14} className="opacity-60" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
            style={{ color: T.heading }}
          >
            Run your business
            <br />
            <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              with total clarity
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: T.sub }}
          >
            Stratix unifies invoicing, inventory, procurement, expenses, and analytics in one beautifully
            designed platform — built for modern businesses that demand more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="group flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 font-semibold text-base hover:opacity-90 transition-all shadow-2xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5"
              style={{ color: '#fff' }}
            >
              Start for free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className={`flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-4 rounded-2xl border font-medium text-base transition-all hover:-translate-y-0.5 ${isLight ? 'border-indigo-200 bg-white hover:bg-indigo-50' : 'border-white/10'}`}
              style={{ color: T.sub }}
            >
              See all features
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className={`mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border ${isLight ? 'bg-slate-200/50 border-slate-200' : 'bg-white/8 border-white/12'}`}
          >
            {STATS.map((s) => (
              <div key={s.label} className={`py-6 px-4 text-center ${isLight ? 'bg-white/80' : 'bg-white/[0.06]'}`}>
                <p className="text-2xl font-bold mb-1" style={{ color: s.valueColor }}>{s.value}</p>
                <p className="text-xs uppercase tracking-wider" style={{ color: T.sub }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dashboard preview card */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative mt-20 w-full max-w-5xl mx-auto z-10"
        >
          <div className={`absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent ${isLight ? 'to-slate-50/90' : 'to-[#040812]'}`} style={{ top: '60%' }} />
          <div className={`rounded-2xl overflow-hidden border ${isLight ? 'border-slate-200 shadow-[0_40px_80px_rgba(99,102,241,0.12)] bg-white' : 'border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.8)] bg-[#0a0f1e]'}`}>
            {/* Fake browser chrome */}
            <div className={`border-b px-4 py-3 flex items-center gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#080d1a] border-white/5'}`}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 max-w-xs mx-auto bg-white/5 rounded-lg px-4 py-1 text-xs text-center" style={{ color: T.dim }}>
                app.stratix.io/dashboard
              </div>
            </div>
            {/* Mock dashboard UI */}
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: 'Revenue',  val: '৳2,48,500', valColor: '#818cf8', lvalColor: '#4338ca', bg: 'bg-brand-500/15',   border: 'border-brand-500/30',   icon: 'bg-brand-500/30' },
                  { label: 'Invoices', val: '142',        valColor: '#c4b5fd', lvalColor: '#6d28d9', bg: 'bg-violet-500/15',  border: 'border-violet-500/30',  icon: 'bg-violet-500/30' },
                  { label: 'Clients',  val: '67',         valColor: '#67e8f9', lvalColor: '#0e7490', bg: 'bg-cyan-500/15',    border: 'border-cyan-500/30',    icon: 'bg-cyan-500/30' },
                  { label: 'Products', val: '389',        valColor: '#6ee7b7', lvalColor: '#065f46', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: 'bg-emerald-500/30' },
                ].map((c) => (
                  <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-4`}>
                    <div className={`w-8 h-8 rounded-lg ${c.icon} mb-3`} />
                    <p className="text-lg font-bold" style={{ color: isLight ? c.lvalColor : c.valColor }}>{c.val}</p>
                    <p className="text-xs mt-0.5" style={{ color: T.sub }}>{c.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className={`col-span-2 rounded-xl p-3 sm:p-4 h-24 sm:h-32 flex items-end gap-0.5 sm:gap-1 ${isLight ? 'bg-slate-100/80 border border-slate-200' : 'bg-white/[0.04] border border-white/8'}`}>
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-brand-500/80 to-violet-500/40 rounded-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className={`rounded-xl p-4 space-y-2 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-white/[0.06] border border-white/12'}`}>
                  {[
                    { label: 'Paid',    pct: 68, dot: '#4ade80', txtColor: '#86efac', ltxtColor: '#166534' },
                    { label: 'Pending', pct: 24, dot: '#fbbf24', txtColor: '#fde68a', ltxtColor: '#92400e' },
                    { label: 'Overdue', pct: 8,  dot: '#f87171', txtColor: '#fca5a5', ltxtColor: '#991b1b' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                      <span className="text-xs font-medium" style={{ color: isLight ? s.ltxtColor : s.txtColor }}>{s.label}</span>
                      <span className="text-xs font-bold ml-auto" style={{ color: T.heading }}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-16 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-4"
            >
              Everything you need
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-bold mb-4"
              style={{ color: isLight ? '#312e81' : '#dbeafe' }}
            >
              One platform, endless possibilities
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg max-w-2xl mx-auto"
              style={{ color: T.sub }}
            >
              Every tool your team needs — from invoicing to procurement — built to work beautifully together.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className={`group relative p-6 rounded-2xl border transition-all cursor-default overflow-hidden ${isLight ? 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-200' : 'border-white/8 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/15'}`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${f.color}`} />
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon size={20} style={{ color: '#fff' }} />
                </div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: isLight ? '#312e81' : '#e2e8f0' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: T.sub }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Analytics highlight ────────────────────────────────── */}
      <section id="analytics" className="relative z-10 py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-4">Data-driven decisions</p>
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
                style={{ color: isLight ? '#164e63' : '#cffafe' }}
              >
                Analytics that actually tell you something
              </h2>
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, text: 'Revenue vs expense P&L at a glance' },
                  { icon: BarChart3,  text: 'Top products, clients, and invoice aging buckets' },
                  { icon: Globe,      text: 'Custom date ranges — daily, weekly, monthly' },
                  { icon: Bell,       text: 'Automated alerts for low stock and overdue invoices' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">
                      <item.icon size={15} className="text-brand-400" />
                    </div>
                    <span className="text-sm" style={{ color: T.sub }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 font-medium text-sm hover:opacity-90 transition-opacity"
                style={{ color: '#fff' }}
              >
                Explore analytics <ArrowRight size={15} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className={`rounded-2xl border p-6 shadow-2xl ${isLight ? 'border-slate-200 bg-white shadow-[0_8px_40px_rgba(99,102,241,0.1)]' : 'border-white/10 bg-[#0a0f1e]'}`}>
                <p className="text-sm mb-4" style={{ color: T.dim }}>Revenue Overview · Last 30 days</p>
                <div className="flex items-end gap-1 h-36 mb-4">
                  {[30,55,40,70,50,85,65,90,60,75,80,100,70,85,95].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-500 to-violet-400 opacity-80" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Revenue',  val: '৳2.4L', up: true  },
                    { label: 'Expenses', val: '৳68K',  up: false },
                    { label: 'Net',      val: '৳1.7L', up: true  },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl p-3 ${isLight ? 'bg-slate-50 border border-slate-100' : 'bg-white/5'}`}>
                      <p className="text-xs mb-1" style={{ color: T.dim }}>{s.label}</p>
                      <p className="text-sm font-bold" style={{ color: T.heading }}>{s.val}</p>
                      <p className={`text-xs mt-0.5 ${s.up ? 'text-green-400' : 'text-red-400'}`}>{s.up ? '▲' : '▼'} 12%</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: isLight ? '#78350f' : '#fef3c7' }}>Trusted by businesses</h2>
            <p style={{ color: T.sub }}>What our users are saying</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`p-6 rounded-2xl border ${isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-white/8 bg-white/[0.04]'}`}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: T.sub }}>"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold" style={{ color: T.heading }}>{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.dim }}>{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-6 sm:p-12 rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-violet-600/10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-violet-600/5" />
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-6">
                {[CheckCircle2, CheckCircle2, CheckCircle2].map((Icon, i) => (
                  <Icon key={i} size={18} className="text-brand-400" />
                ))}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: isLight ? '#4c1d95' : '#ede9fe' }}>Ready to get started?</h2>
              <p className="mb-8 text-lg" style={{ color: T.sub }}>
                Join businesses already running smarter on Stratix.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 font-semibold text-base sm:text-lg hover:opacity-90 transition-all shadow-2xl shadow-brand-500/30 hover:-translate-y-1"
                style={{ color: '#fff' }}
              >
                Launch Stratix <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className={`relative z-10 border-t py-10 px-6 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
              <Hexagon size={14} style={{ color: '#fff' }} className="fill-white/20" />
            </div>
            <span className="font-bold" style={{ color: T.heading }}>Stratix</span>
            <span className="text-sm" style={{ color: T.dim }}>Business Management System</span>
          </div>
          <p className="text-sm" style={{ color: T.dim }}>© {new Date().getFullYear()} Stratix BMS. All rights reserved.</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -40px) scale(1.05); }
          66%       { transform: translate(-20px, 20px) scale(0.97); }
        }
        .animate-blob { animation: blob 10s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
