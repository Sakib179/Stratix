'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Activity } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { PermissionsEditor } from './PermissionsEditor';
import { UserForm } from './UserForm';
import { adminApi } from '@/lib/adminApi';
import { formatDate, timeAgo } from '@/lib/utils';

export function UserDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminApi.getUser(userId),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{data.full_name}</h1>
            <p className="text-gray-400 text-sm">{data.email}</p>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => setShowEdit(true)}>
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar name={data.full_name} size="xl" />
                <div>
                  <p className="font-semibold text-white">{data.full_name}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Badge variant={data.role === 'admin' ? 'brand' : 'muted'}>{data.role}</Badge>
                    <Badge variant={data.is_active ? 'success' : 'danger'}>{data.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-2.5 text-sm">
                {[
                  { label: 'Email', value: data.email },
                  { label: 'Phone', value: data.phone ?? '—' },
                  { label: 'Designation', value: data.designation ?? '—' },
                  { label: 'Department', value: data.department ?? '—' },
                  { label: 'Joined', value: formatDate(data.created_at) },
                  { label: 'Last Login', value: data.last_login ? timeAgo(data.last_login) : 'Never' },
                  { label: '2FA', value: data.two_factor_enabled ? 'Enabled' : 'Disabled' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-2">
                    <span className="text-gray-500 flex-shrink-0">{item.label}</span>
                    <span className="text-gray-200 text-right truncate">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader><CardTitle>Module Permissions</CardTitle></CardHeader>
            <CardContent>
              <PermissionsEditor
                userId={data.id}
                role={data.role}
                initialPermissions={data.permissions ?? []}
              />
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!data.recentActivity?.length ? (
                <p className="text-sm text-gray-500 text-center py-4">No activity recorded.</p>
              ) : (
                data.recentActivity.map((log: any, i: number) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-white leading-tight">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{timeAgo(log.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <UserForm isOpen={showEdit} onClose={() => setShowEdit(false)} user={data} />
    </PageTransition>
  );
}
