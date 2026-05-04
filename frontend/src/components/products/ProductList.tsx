'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Upload, Edit2, Trash2, Package, ImageOff } from 'lucide-react';
import PageTransition, { StaggerContainer, StaggerItem, StaggerTbody, StaggerTr } from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { SortableTableHeader } from '@/components/ui/SortableTableHeader';
import { ConfirmModal } from '@/components/ui/Modal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductForm } from './ProductForm';
import { ProductFilters } from './ProductFilters';
import { BulkImportModal } from './BulkImportModal';
import { productApi } from '@/lib/productApi';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product } from '@/types';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';

export function ProductList() {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({ category_id: '', stock: '', min_price: '', max_price: '' });

  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, debouncedSearch, sort, order, filters],
    queryFn: () =>
      productApi.list({
        page, limit: 20, search: debouncedSearch, sort, order,
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.stock && { stock: filters.stock as any }),
        ...(filters.min_price && { min_price: parseFloat(filters.min_price) }),
        ...(filters.max_price && { max_price: parseFloat(filters.max_price) }),
      }),
    placeholderData: (prev) => prev,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: productApi.listCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Delete failed'),
  });

  const handleSort = useCallback((field: string) => {
    if (field === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(field); setOrder('asc'); }
    setPage(1);
  }, [sort]);

  const handleFilterChange = (partial: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  };

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };

  const stockBadge = (qty: number, threshold: number) => {
    if (qty === 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (qty <= threshold) return <Badge variant="warning">Low: {qty}</Badge>;
    return <Badge variant="success">{qty} in stock</Badge>;
  };

  const products = data?.data ?? [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Products"
          subtitle={`${data?.pagination?.total ?? 0} total products`}
          icon={Package}
          gradient="from-cyan-500 to-blue-600"
          actions={
            <>
              <Button variant="outline" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />} onClick={() => setShowImport(true)}>
                Import CSV
              </Button>
              <Button variant="brand" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setEditProduct(null); setShowForm(true); }}>
                Add Product
              </Button>
            </>
          }
        />

        {/* Search + Filters */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <SearchInput value={search} onChange={handleSearchChange} placeholder="Search by name, model, serial…" />
            <ProductFilters
              filters={filters}
              categories={categories}
              onChange={handleFilterChange}
              onReset={() => { setFilters({ category_id: '', stock: '', min_price: '', max_price: '' }); setPage(1); }}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><SkeletonTable rows={8} cols={6} /></div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Package className="w-10 h-10" />}
                title="No products found"
                description={search || Object.values(filters).some(Boolean) ? 'Try adjusting your search or filters.' : 'Add your first product to get started.'}
                action={!search && !Object.values(filters).some(Boolean) ? (
                  <Button variant="brand" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowForm(true)}>
                    Add Product
                  </Button>
                ) : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 w-12"></th>
                      <SortableTableHeader label="Product" field="product_name" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <SortableTableHeader label="Model" field="model_no" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <th className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-4 py-3">Category</th>
                      <SortableTableHeader label="Price" field="unit_price" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <SortableTableHeader label="Stock" field="stock_quantity" currentSort={sort} currentOrder={order} onSort={handleSort} />
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <StaggerTbody>
                    {products.map((p) => (
                        <StaggerTr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                                {p.image ? (
                                  <img
                                    src={`${API_BASE}/${p.image}`}
                                    alt={p.product_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <ImageOff className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-white">{p.product_name}</p>
                              {p.serial_no && <p className="text-xs text-gray-500">S/N: {p.serial_no}</p>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{p.model_no}</td>
                            <td className="px-4 py-3">
                              {p.category_name ? (
                                <span
                                  className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ backgroundColor: `${p.category_color}22`, color: p.category_color ?? '#6366f1' }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.category_color ?? '#6366f1' }} />
                                  {p.category_name}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-white">{formatCurrency(p.unit_price)}</td>
                            <td className="px-4 py-3">{stockBadge(p.stock_quantity, p.stock_threshold)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setEditProduct(p); setShowForm(true); }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(p)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
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

      <ProductForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditProduct(null); }}
        product={editProduct}
      />

      <BulkImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['products'] })}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.product_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageTransition>
  );
}
