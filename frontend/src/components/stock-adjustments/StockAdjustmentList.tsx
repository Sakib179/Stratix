'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, ArrowUpCircle, ArrowDownCircle, Search, Package2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { StockAdjustmentForm } from './StockAdjustmentForm';
import { stockAdjustmentApi, ADJUSTMENT_TYPES } from '@/lib/stockAdjustmentApi';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';

const REMOVAL_TYPES = new Set(['removal', 'damage', 'theft', 'return_out']);

function typeLabel(value: string) {
  return ADJUSTMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function StockAdjustmentList() {
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-adjustments', page, search, typeFilter],
    queryFn: () => stockAdjustmentApi.list({ page, limit: 25, ...(search && { search }), ...(typeFilter && { type: typeFilter }) }),
  });

  const adjustments = data?.data ?? [];
  const pagination  = data?.pagination;

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Stock Adjustments"
          subtitle="Manual stock corrections and audit trail"
          icon={Package2}
          gradient="from-teal-500 to-cyan-600"
          actions={
            <Button variant="brand" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
              New Adjustment
            </Button>
          }
        />

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search product or reason…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search size={15} />} />
          </div>
          <select
            value={typeFilter} onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none"
          >
            <option value="">All Types</option>
            {ADJUSTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : adjustments.length === 0 ? (
          <EmptyState
            icon={<Package2 className="w-8 h-8 text-brand-400" />}
            title="No adjustments found"
            description="Record a stock adjustment to correct inventory levels"
            action={<Button variant="brand" onClick={() => setShowForm(true)} leftIcon={<Plus className="w-4 h-4" />}>New Adjustment</Button>}
          />
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-white/5">
              {(adjustments as any[]).map((adj) => {
                const isRemoval = REMOVAL_TYPES.has(adj.adjustment_type);
                return (
                  <motion.div
                    key={adj.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isRemoval ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                      {isRemoval
                        ? <ArrowDownCircle className="w-4 h-4 text-red-400" />
                        : <ArrowUpCircle className="w-4 h-4 text-green-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{adj.product_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {typeLabel(adj.adjustment_type)} · {adj.reason || 'No reason given'} · {formatDate(adj.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <p className={`text-sm font-bold ${isRemoval ? 'text-red-400' : 'text-green-400'}`}>
                        {isRemoval ? '−' : '+'}{adj.quantity}
                      </p>
                      <p className="text-xs text-gray-500">{adj.quantity_before} → {adj.quantity_after}</p>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {pagination && pagination.totalPages > 1 && (
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        )}
      </div>

      <StockAdjustmentForm isOpen={showForm} onClose={() => setShowForm(false)} />
    </PageTransition>
  );
}
