'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, FileText } from 'lucide-react';
import PageTransition, { StaggerTbody, StaggerTr } from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { SortableTableHeader } from '@/components/ui/SortableTableHeader';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { invoiceApi } from '@/lib/invoiceApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/ui/PageHeader';

const STATUSES = ['', 'Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled'];

export function InvoiceList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, debouncedSearch, status, sort, order],
    queryFn: () => invoiceApi.list({ page, limit: 20, search: debouncedSearch, status: status || undefined, sort, order }),
    placeholderData: (prev) => prev,
  });

  const handleSort = (field: string) => {
    if (field === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(field); setOrder('asc'); }
    setPage(1);
  };

  const invoices = data?.data ?? [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          subtitle={`${data?.pagination?.total ?? 0} total invoices`}
          icon={FileText}
          gradient="from-indigo-500 to-blue-600"
          actions={
            <Button variant="brand" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => router.push('/invoices/new')}>
              New Invoice
            </Button>
          }
        />

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchInput
                value={search}
                onChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Search by invoice # or client…"
                className="flex-1"
              />
              <Select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full sm:w-44"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s || 'All Statuses'}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><SkeletonTable rows={8} cols={6} /></div>
            ) : invoices.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-10 h-10" />}
                title="No invoices found"
                description={search || status ? 'Try adjusting your filters.' : 'Create your first invoice.'}
                action={!search && !status ? (
                  <Button variant="brand" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => router.push('/invoices/new')}>
                    New Invoice
                  </Button>
                ) : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <SortableTableHeader label="Invoice #" field="invoice_number" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <SortableTableHeader label="Client" field="client_name" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <SortableTableHeader label="Date" field="created_at" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <SortableTableHeader label="Due" field="due_date" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <SortableTableHeader label="Amount" field="grand_total" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <StaggerTbody>
                    {invoices.map((inv) => (
                        <StaggerTr
                          key={inv.id}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-brand-400">{inv.invoice_number}</td>
                          <td className="px-4 py-3 text-sm text-white">{(inv as any).client_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{formatDate(inv.created_at)}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{formatDate(inv.due_date)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-white">{formatCurrency(inv.grand_total)}</td>
                          <td className="px-4 py-3"><Badge statusKey={inv.status}>{inv.status}</Badge></td>
                        </StaggerTr>
                    ))}
                  </StaggerTbody>
                </table>
              </div>
            )}

            {data?.pagination && (
              <div className="px-4 py-3 border-t border-white/5">
                <Pagination
                  page={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  total={data.pagination.total}
                  limit={data.pagination.limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
