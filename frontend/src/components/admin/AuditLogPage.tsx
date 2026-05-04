'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import PageTransition, { StaggerTbody, StaggerTr } from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminApi } from '@/lib/adminApi';
import { timeAgo, formatDateTime } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'success', UPDATE: 'info', DELETE: 'danger',
  LOGIN: 'brand', LOGOUT: 'muted', EXPORT: 'warning', IMPORT: 'warning',
};

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, action, entityType],
    queryFn: () => adminApi.auditLogs({ page: String(page), limit: '20', ...(action && { action }), ...(entityType && { entity_type: entityType }) }),
    placeholderData: (prev) => prev,
  });

  const logs = data?.data ?? [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-gray-400 text-sm mt-0.5">Complete history of all system actions</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="w-full sm:w-40">
                <option value="">All Actions</option>
                {['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','IMPORT'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
              <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} className="w-full sm:w-40">
                <option value="">All Types</option>
                {['user','product','client','invoice','settings'].map((t) => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><SkeletonTable rows={10} /></div>
            ) : logs.length === 0 ? (
              <EmptyState icon={<FileText className="w-10 h-10" />} title="No logs found" description="Activity logs will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Action', 'Type', 'Description', 'User', 'Time'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <StaggerTbody>
                    {logs.map((log: any) => (
                      <StaggerTr key={log.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <Badge variant={(ACTION_COLORS[log.action] ?? 'muted') as any}>{log.action}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 capitalize">{log.entity_type}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{log.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{log.user_name ?? 'System'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500" title={formatDateTime(log.created_at)}>
                          {timeAgo(log.created_at)}
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
    </PageTransition>
  );
}
