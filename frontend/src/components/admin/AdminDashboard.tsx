'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users, Package, FileText, DollarSign, AlertTriangle, Shield,
  ChevronRight, TrendingUp
} from 'lucide-react';
import PageTransition, { StaggerContainer, StaggerItem } from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { adminApi } from '@/lib/adminApi';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';

export function AdminDashboard() {
  const router = useRouter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const invoiceBreakdown = stats?.invoice_breakdown ?? {};

  const kpis = [
    { label: 'Active Users', value: stats?.active_users ?? 0, icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10', href: '/admin/users' },
    { label: 'Total Revenue', value: formatCurrency(stats?.total_revenue ?? 0), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', href: '/analytics' },
    { label: 'Total Products', value: stats?.total_products ?? 0, icon: Package, color: 'text-violet-400', bg: 'bg-violet-500/10', href: '/products' },
    { label: 'Low Stock', value: stats?.low_stock_count ?? 0, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', href: '/products?stock=low' },
  ];

  const statusBadgeVariant: Record<string, string> = {
    Draft: 'muted', Issued: 'info', Paid: 'success', Overdue: 'danger', Cancelled: 'muted',
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Admin Panel"
          subtitle="System overview and management"
          icon={Shield}
          gradient="from-red-500 to-rose-600"
        />

        {/* KPI cards */}
        <StaggerContainer>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <StaggerItem key={kpi.label}>
                <motion.div
                  whileHover={{ y: -2 }}
                  onClick={() => router.push(kpi.href)}
                  className="cursor-pointer"
                >
                  <Card className="hover:border-brand-500/30 transition-colors">
                    <CardContent className="p-5">
                      <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-white">{kpi.value}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{kpi.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Invoice breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Invoice Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(invoiceBreakdown).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No invoice data yet.</p>
              ) : (
                Object.entries(invoiceBreakdown).map(([status, count]) => {
                  const total = Object.values(invoiceBreakdown).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant={(statusBadgeVariant[status] ?? 'muted') as any}>{status}</Badge>
                        </div>
                        <span className="text-white font-medium">{count} <span className="text-gray-500 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                          className="h-full bg-brand-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Manage Users & Permissions', href: '/admin/users', icon: Users, desc: 'Add, edit, deactivate users' },
                { label: 'Analytics & Reports', href: '/analytics', icon: TrendingUp, desc: 'Revenue charts, top products' },
                { label: 'System Settings', href: '/settings', icon: Shield, desc: 'Company info, email, thresholds' },
                { label: 'Audit Log', href: '/admin/audit-log', icon: FileText, desc: 'Full action history' },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
