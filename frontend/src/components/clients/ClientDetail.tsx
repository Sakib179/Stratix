'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { ClientForm } from './ClientForm';
import { clientApi } from '@/lib/clientApi';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ClientDetailProps {
  clientId: string;
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientApi.get(clientId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const { invoices = [], stats } = data;

  const statCards = [
    { label: 'Total Invoices', value: stats.invoice_count, icon: FileText, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Total Spent', value: formatCurrency(stats.total_spent), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Outstanding', value: formatCurrency(stats.outstanding), icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{data.full_name}</h1>
            <p className="text-gray-400 text-sm">Client profile</p>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => setShowEdit(true)}>
            Edit
          </Button>
        </div>

        {/* Profile card + stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-1">
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <Avatar name={data.full_name} size="xl" />
              <div>
                <p className="font-semibold text-white">{data.full_name}</p>
                <p className="text-xs text-gray-500">Added {formatDate(data.created_at)}</p>
              </div>
              <div className="w-full space-y-2 text-sm text-gray-400">
                {data.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    {data.phone}
                  </div>
                )}
                {data.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{data.email}</span>
                  </div>
                )}
                {data.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{data.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Invoice history */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <p className="text-gray-500 text-sm p-6 text-center">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Invoice #', 'Date', 'Due Date', 'Amount', 'Status'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr
                        key={inv.id}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-brand-400">{inv.invoice_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatDate(inv.created_at)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatDate(inv.due_date)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-white">{formatCurrency(inv.grand_total)}</td>
                        <td className="px-4 py-3"><Badge statusKey={inv.status}>{inv.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ClientForm isOpen={showEdit} onClose={() => setShowEdit(false)} client={data} />
    </PageTransition>
  );
}
