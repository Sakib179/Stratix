'use client';

import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsApi } from '@/lib/analyticsApi';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

export function InvoiceAgingChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['invoice-aging'],
    queryFn: analyticsApi.invoiceAging,
  });

  const pieData = data.filter((d) => d.amount > 0).map((d) => ({ name: d.bucket, value: d.amount }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Invoice Aging</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : pieData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-green-400 text-2xl">✓</span>
              </div>
              <p className="text-sm text-gray-400">No outstanding invoices</p>
            </div>
          </div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-2">
              {data.map((d, i) => (
                <div key={d.bucket} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-400">{d.bucket}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">{d.count} inv.</span>
                    <span className="text-white font-medium">{formatCurrency(d.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
