'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import PageTransition, { StaggerTbody, StaggerTr } from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { SortableTableHeader } from '@/components/ui/SortableTableHeader';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClientForm } from './ClientForm';
import { clientApi } from '@/lib/clientApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/ui/PageHeader';

export function ClientList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, debouncedSearch, sort, order],
    queryFn: () => clientApi.list({ page, limit: 20, search: debouncedSearch, sort, order }),
    placeholderData: (prev) => prev,
  });

  const handleSort = (field: string) => {
    if (field === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(field); setOrder('asc'); }
    setPage(1);
  };

  const clients = data?.data ?? [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Clients"
          subtitle={`${data?.pagination?.total ?? 0} total clients`}
          icon={Users}
          gradient="from-violet-500 to-purple-600"
          actions={
            <Button variant="brand" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowForm(true)}>
              Add Client
            </Button>
          }
        />

        <Card>
          <CardContent className="p-4">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name, phone or email…" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><SkeletonTable rows={8} cols={5} /></div>
            ) : clients.length === 0 ? (
              <EmptyState
                icon={<Users className="w-10 h-10" />}
                title="No clients found"
                description={search ? 'Try a different search term.' : 'Add your first client to get started.'}
                action={!search ? (
                  <Button variant="brand" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowForm(true)}>
                    Add Client
                  </Button>
                ) : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 w-10"></th>
                      <SortableTableHeader label="Name" field="full_name" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <SortableTableHeader label="Phone" field="phone" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-4 py-3">Email</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-4 py-3">Invoices</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-4 py-3">Total Spent</th>
                      <SortableTableHeader label="Joined" field="created_at" currentSort={sort} currentOrder={order} onSort={handleSort} />
                    </tr>
                  </thead>
                  <StaggerTbody>
                    {clients.map((c) => (
                        <StaggerTr
                          key={c.id}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                          onClick={() => router.push(`/clients/${c.id}`)}
                        >
                          <td className="px-4 py-3">
                            <Avatar name={c.full_name} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-white">{c.full_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{c.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{c.email ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{(c as any).invoice_count ?? 0}</td>
                          <td className="px-4 py-3 text-sm font-medium text-white">{formatCurrency((c as any).total_spent ?? 0)}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{formatDate(c.created_at)}</td>
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

      <ClientForm isOpen={showForm} onClose={() => setShowForm(false)} />
    </PageTransition>
  );
}
