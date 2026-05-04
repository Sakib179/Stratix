'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Truck, Package, Edit2, Phone, Mail, MapPin } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { SupplierForm } from './SupplierForm';
import { supplierApi } from '@/lib/supplierApi';
import { formatCurrency, formatDate } from '@/lib/utils';

const PO_STATUS_COLORS: Record<string, string> = { Draft: 'text-gray-400', Ordered: 'text-blue-400', Received: 'text-green-400', Cancelled: 'text-red-400' };

export function SupplierDetail({ id }: { id: string }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierApi.get(id),
  });

  if (isLoading) return <div className="space-y-5">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  if (!supplier) return null;

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{supplier.name}</h1>
              <Badge variant={supplier.is_active ? 'success' : 'muted'}>{supplier.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
            {supplier.contact_person && <p className="text-gray-400 text-sm">{supplier.contact_person}</p>}
          </div>
          <Button size="sm" variant="outline" leftIcon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => setShowEdit(true)}>Edit</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader><CardTitle>Recent Purchase Orders</CardTitle></CardHeader>
              <CardContent>
                {(supplier as any).recent_orders?.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">No purchase orders yet</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b border-white/5">
                        <th className="text-left pb-3">PO Number</th>
                        <th className="text-left pb-3">Status</th>
                        <th className="text-right pb-3">Items</th>
                        <th className="text-right pb-3">Total</th>
                        <th className="text-right pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {((supplier as any).recent_orders ?? []).map((po: any) => (
                        <tr key={po.id} className="cursor-pointer hover:bg-white/5 transition-colors" onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                          <td className="py-3 text-white font-medium">{po.po_number}</td>
                          <td className="py-3"><span className={`text-xs font-medium ${PO_STATUS_COLORS[po.status] || 'text-gray-400'}`}>{po.status}</span></td>
                          <td className="py-3 text-right text-gray-400">{po.item_count ?? '—'}</td>
                          <td className="py-3 text-right font-semibold text-white">{formatCurrency(po.total_amount)}</td>
                          <td className="py-3 text-right text-gray-500">{formatDate(po.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {supplier.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-white">{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <a href={`mailto:${supplier.email}`} className="text-brand-400 hover:underline">{supplier.email}</a>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white">{supplier.address}</span>
                  </div>
                )}
                {!supplier.phone && !supplier.email && !supplier.address && (
                  <p className="text-gray-500">No contact info on file</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: 'Total Orders', value: (supplier as any).recent_orders?.length ?? 0 },
                  { label: 'Added', value: formatDate((supplier as any).created_at) },
                ].map((f) => (
                  <div key={f.label} className="flex justify-between">
                    <span className="text-gray-500">{f.label}</span>
                    <span className="text-white">{f.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {supplier.notes && (
              <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent><p className="text-gray-400 text-sm">{supplier.notes}</p></CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <SupplierForm isOpen={showEdit} onClose={() => setShowEdit(false)} supplier={supplier} />
    </PageTransition>
  );
}
