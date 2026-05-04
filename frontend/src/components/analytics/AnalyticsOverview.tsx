'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Package, BarChart3 } from 'lucide-react';
import PageTransition, { StaggerContainer, StaggerItem } from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { RevenueChart } from './RevenueChart';
import { TopProductsTable } from './TopProductsTable';
import { InvoiceAgingChart } from './InvoiceAgingChart';
import { StockSummaryWidget } from './StockSummaryWidget';
import { analyticsApi } from '@/lib/analyticsApi';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';

const PERIODS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'Last 365 days', value: '365' },
];

export function AnalyticsOverview() {
  const [period, setPeriod] = useState('30');

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics-overview', period],
    queryFn: () => analyticsApi.overview({ period: parseInt(period) }),
  });

  const kpis = overview
    ? [
        { label: 'Revenue', value: formatCurrency(overview.revenue_period), change: overview.revenue_change_pct, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Invoices Created', value: overview.total_invoices, change: overview.invoice_change_pct, icon: FileText, color: 'text-brand-400', bg: 'bg-brand-500/10' },
        { label: 'New Clients', value: overview.new_clients_period, change: overview.client_change_pct, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
      ]
    : [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          subtitle="Revenue, invoices, and inventory insights"
          icon={BarChart3}
          gradient="from-emerald-500 to-teal-600"
          actions={
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full sm:w-44">
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          }
        />

        {/* KPI Row */}
        <StaggerContainer>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loadingOverview
              ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
              : kpis.map((kpi) => (
                  <StaggerItem key={kpi.label}>
                    <Card>
                      <CardContent className="p-5">
                        <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                          <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-white">{kpi.value}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-400">{kpi.label}</span>
                          <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {kpi.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(kpi.change)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
          </div>
        </StaggerContainer>

        {/* Revenue Chart */}
        <RevenueChart period={parseInt(period)} />

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TopProductsTable period={parseInt(period)} />
          <InvoiceAgingChart />
        </div>

        <StockSummaryWidget />
      </div>
    </PageTransition>
  );
}
