'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Receipt, Search, Trash2, Edit2, Download } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpenseForm } from './ExpenseForm';
import { expenseApi, type Expense } from '@/lib/expenseApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';

export function ExpenseList() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState<Expense | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, search, categoryId, dateFrom, dateTo],
    queryFn: () => expenseApi.list({ page, limit: 20, search: search || undefined, category_id: categoryId || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined }),
  });

  const { data: categories = [] } = useQuery({ queryKey: ['expense-categories'], queryFn: expenseApi.categories });

  const expenses  = data?.data ?? [];
  const pagination = data?.pagination;
  const totalAmount = (data as any)?.total_amount ?? 0;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expenseApi.remove(id);
      toast.success('Expense deleted');
      qc.invalidateQueries({ queryKey: ['expenses'] });
    } catch { toast.error('Failed to delete'); }
  };

  const handleExport = async () => {
    try {
      await expenseApi.exportCsv({ ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }), ...(categoryId && { category_id: categoryId }) });
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Expenses"
          subtitle="Track business spending by category"
          icon={Receipt}
          gradient="from-amber-500 to-orange-600"
          actions={
            <>
              <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handleExport}>Export CSV</Button>
              <Button variant="brand" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setEditItem(null); setShowForm(true); }}>Add Expense</Button>
            </>
          }
        />

        {/* Summary card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-gray-500 mb-1">Total Expenses (filtered)</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500 mb-1">Records</p>
            <p className="text-2xl font-bold text-white">{pagination?.total ?? 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-500 mb-1">Categories</p>
            <p className="text-2xl font-bold text-white">{categories.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px]">
            <Input placeholder="Search expenses…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search size={15} />} />
          </div>
          <select
            value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : expenses.length === 0 ? (
          <EmptyState icon={<Receipt className="w-8 h-8 text-brand-400" />} title="No expenses found" description="Start recording your business expenses"
            action={<Button variant="brand" onClick={() => setShowForm(true)} leftIcon={<Plus className="w-4 h-4" />}>Add Expense</Button>} />
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-white/5">
              {expenses.map((exp) => (
                <motion.div
                  key={exp.id}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  className="flex items-center gap-4 px-5 py-4 group"
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: exp.color_hex || '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{exp.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500">{formatDate(exp.expense_date)}</p>
                      {exp.category_name && <Badge variant="muted" className="text-xs">{exp.category_name}</Badge>}
                      <span className="text-xs text-gray-600">{exp.payment_method}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-red-400 flex-shrink-0">{formatCurrency(exp.amount)}</p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {user?.role === 'admin' && (
                      <>
                        <button onClick={() => { setEditItem(exp); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 size={13} /></button>
                      </>
                    )}
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

      <ExpenseForm isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} expense={editItem} categories={categories} />
    </PageTransition>
  );
}
