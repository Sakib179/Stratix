'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Package, Search, ChevronRight, Trash2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { purchaseOrderApi } from '@/lib/purchaseOrderApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';

const STATUS_VARIANTS: Record<string, any> = { Draft: 'muted', Ordered: 'info', Received: 'success', Cancelled: 'danger' };
const STATUS_COLORS: Record<string, string> = { Draft: 'text-gray-400', Ordered: 'text-blue-400', Received: 'text-green-400', Cancelled: 'text-red-400' };

export function PurchaseOrderList() {
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, search, status],
    queryFn: () => purchaseOrderApi.list({ page, limit: 20, ...(search && { search }), ...(status && { status }) }),
  });

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this purchase order?')) return;
    try {
      await purchaseOrderApi.remove(id);
      toast.success('Purchase order deleted');
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Cannot delete'); }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Purchase Orders"
          subtitle="Manage procurement from suppliers"
          icon={Package}
          gradient="from-orange-500 to-amber-600"
          actions={
            <Button variant="brand" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push('/purchase-orders/new')}>
              New PO
            </Button>
          }
        />

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search PO number or supplier…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search size={15} />} />
          </div>
          <select
            value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none"
          >
            <option value="">All Status</option>
            {['Draft', 'Ordered', 'Received', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<Package className="w-8 h-8 text-brand-400" />} title="No purchase orders" description="Create a PO to order from suppliers"
            action={<Button variant="brand" onClick={() => router.push('/purchase-orders/new')} leftIcon={<Plus className="w-4 h-4" />}>New PO</Button>} />
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-white/5">
              {orders.map((po) => (
                <motion.div
                  key={po.id}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  onClick={() => router.push(`/purchase-orders/${po.id}`)}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{po.po_number}</p>
                      <Badge variant={STATUS_VARIANTS[po.status]}>{po.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{po.supplier_name || 'No supplier'} · {formatDate(po.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">{formatCurrency(po.total_amount)}</p>
                    {po.expected_date && <p className="text-xs text-gray-500">Expected {formatDate(po.expected_date)}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {po.status !== 'Received' && (
                      <button onClick={(e) => handleDelete(po.id, e)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 size={13} /></button>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {pagination && pagination.totalPages > 1 && (
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        )}
      </div>
    </PageTransition>
  );
}
