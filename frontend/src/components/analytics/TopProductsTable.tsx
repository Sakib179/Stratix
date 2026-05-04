'use client';

import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { analyticsApi } from '@/lib/analyticsApi';
import { formatCurrency } from '@/lib/utils';

interface Props { period: number; }

export function TopProductsTable({ period }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['top-products', period],
    queryFn: () => analyticsApi.topProducts({ period, limit: 8 }),
  });

  const maxRevenue = data.length > 0 ? Math.max(...data.map((d) => d.revenue)) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-4 h-4 text-brand-400" />
          Top Products by Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : data.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No paid invoices in this period.</p>
        ) : (
          <div className="space-y-3">
            {data.map((p, i) => (
              <div key={p.model_no} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-500 w-4 flex-shrink-0">#{i + 1}</span>
                    <span className="text-white font-medium truncate">{p.product_name}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-2">
                    <span className="text-gray-400 text-xs">{p.units_sold} units</span>
                    <span className="text-brand-300 font-semibold w-24 text-right">{formatCurrency(p.revenue)}</span>
                  </div>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full"
                    style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
