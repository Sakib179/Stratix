'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Truck, Search, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SupplierForm } from './SupplierForm';
import { supplierApi, type Supplier } from '@/lib/supplierApi';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';

export function SupplierList() {
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => supplierApi.list({ page, limit: 20, ...(search && { search }) }),
  });

  const suppliers = data?.data ?? [];
  const pagination = data?.pagination;

  const handleDeactivate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deactivate this supplier?')) return;
    try {
      await supplierApi.remove(id);
      toast.success('Supplier deactivated');
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    } catch { toast.error('Failed'); }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Suppliers"
          subtitle="Manage your vendors and supply partners"
          icon={Truck}
          gradient="from-rose-500 to-pink-600"
          actions={
            <Button variant="brand" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditItem(null); setShowForm(true); }}>
              Add Supplier
            </Button>
          }
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <Input placeholder="Search suppliers…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search size={15} />} />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : suppliers.length === 0 ? (
          <EmptyState icon={<Truck className="w-8 h-8 text-brand-400" />} title="No suppliers found" description="Add your first supplier to get started"
            action={<Button variant="brand" onClick={() => setShowForm(true)} leftIcon={<Plus className="w-4 h-4" />}>Add Supplier</Button>} />
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-white/5">
              {suppliers.map((s) => (
                <motion.div
                  key={s.id}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  onClick={() => router.push(`/suppliers/${s.id}`)}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                      <Badge variant={s.is_active ? 'success' : 'muted'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.contact_person || '—'} · {s.phone || '—'} · {(s as any).po_count || 0} orders
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditItem(s); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><Edit2 size={13} /></button>
                    {s.is_active && (
                      <button onClick={(e) => handleDeactivate(s.id, e)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 size={13} /></button>
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

      <SupplierForm isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} supplier={editItem} />
    </PageTransition>
  );
}
