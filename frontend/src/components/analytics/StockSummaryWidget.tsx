'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { analyticsApi } from '@/lib/analyticsApi';
import { formatCurrency } from '@/lib/utils';

export function StockSummaryWidget() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: analyticsApi.stockSummary,
  });

  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-400" />
            Inventory Summary
          </span>
          <span className="text-sm font-normal text-brand-300">
            Value: {formatCurrency(data.inventory_value)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'In Stock', value: data.in_stock, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Low Stock', value: data.low_stock, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Out of Stock', value: data.out_of_stock, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {data.critical_items.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Critical Items</p>
            <div className="space-y-2">
              {data.critical_items.map((item) => (
                <div
                  key={item.model_no}
                  onClick={() => router.push(`/products?search=${item.model_no}`)}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-sm text-white font-medium">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.model_no}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-500">Threshold: {item.stock_threshold}</span>
                    <Badge variant={item.stock_quantity === 0 ? 'danger' : 'warning'}>
                      {item.stock_quantity === 0 ? 'Out' : `${item.stock_quantity} left`}
                    </Badge>
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
