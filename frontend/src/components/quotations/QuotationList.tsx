'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, FileText, Search, ChevronRight, Trash2, Copy } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { quotationApi } from '@/lib/quotationApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';

const STATUS_VARIANTS: Record<string, string> = {
  Draft: 'muted', Sent: 'info', Accepted: 'success', Rejected: 'danger', Converted: 'brand',
};

export function QuotationList() {
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page, search, status],
    queryFn: () => quotationApi.list({ page, limit: 20, ...(search && { search }), ...(status && { status }) }),
  });

  const quotations = data?.data ?? [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this quotation?')) return;
    try {
      await quotationApi.remove(id);
      toast.success('Quotation deleted');
      qc.invalidateQueries({ queryKey: ['quotations'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cannot delete');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Quotations"
          subtitle="Create and convert quotes to invoices"
          icon={FileText}
          gradient="from-blue-500 to-indigo-600"
          actions={
            <Button variant="brand" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push('/quotations/new')}>
              New Quotation
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search quotations or clients…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={<Search size={15} />}
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none focus:border-brand-500/50"
          >
            <option value="">All Status</option>
            {['Draft', 'Sent', 'Accepted', 'Rejected', 'Converted'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : quotations.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-brand-400" />}
            title="No quotations found"
            description="Create your first quotation to get started"
            action={<Button variant="brand" onClick={() => router.push('/quotations/new')} leftIcon={<Plus className="w-4 h-4" />}>New Quotation</Button>}
          />
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-white/5">
              {quotations.map((q) => (
                <motion.div
                  key={q.id}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  onClick={() => router.push(`/quotations/${q.id}`)}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{q.quotation_number}</p>
                      <Badge variant={(STATUS_VARIANTS[q.status] ?? 'muted') as any}>{q.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{q.client_name} · {formatDate(q.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">{formatCurrency(q.grand_total)}</p>
                    {q.valid_until && <p className="text-xs text-gray-500">Valid till {formatDate(q.valid_until)}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {q.status !== 'Converted' && (
                      <button
                        onClick={(e) => handleDelete(q.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
