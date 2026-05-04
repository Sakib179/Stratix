'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsApi } from '@/lib/analyticsApi';
import { formatCurrency } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';

interface Props { period: number; }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 shadow-xl text-sm" style={{ border: '1px solid var(--border)' }}>
      <p className="mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.dataKey === 'revenue' ? formatCurrency(p.value) : `${p.value} invoices`}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ period }: Props) {
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const isLight = useThemeStore((s) => s.theme === 'light');
  const axisColor = isLight ? '#6b7280' : '#4b5563';
  const gridColor = isLight ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)';

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-revenue', period, groupBy],
    queryFn: () => analyticsApi.revenueChart({ period, group_by: groupBy }),
  });

  const chartData = (data ?? []).map((d) => ({
    ...d,
    label: (() => {
      try {
        const date = parseISO(d.period);
        return groupBy === 'month' ? format(date, 'MMM yyyy')
          : groupBy === 'week' ? format(date, 'MMM d')
          : format(date, 'MMM d');
      } catch { return d.period; }
    })(),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revenue Over Time</CardTitle>
          <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="w-32 text-sm">
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : !chartData.length ? (
          <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>No revenue data for this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={isLight ? 0.2 : 0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2}
                fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }}
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
