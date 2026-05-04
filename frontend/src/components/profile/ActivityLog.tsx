'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { userApi } from '@/lib/api';
import { AuditLog } from '@/types';
import { Card } from '@/components/ui/Card';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { timeAgo, cn } from '@/lib/utils';

const actionStyles: Record<string, string> = {
  CREATE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  UPDATE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  DELETE: 'text-red-400 bg-red-500/10 border-red-500/20',
  VIEW:   'text-surface-200 bg-surface-600/30 border-surface-500/20',
  LOGIN:  'text-brand-400 bg-brand-500/10 border-brand-500/20',
  LOGOUT: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  EXPORT: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  IMPORT: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

const actionIcons: Record<string, string> = {
  CREATE: '✦', UPDATE: '✎', DELETE: '✕', VIEW: '◎',
  LOGIN: '→', LOGOUT: '←', EXPORT: '↑', IMPORT: '↓',
};

export default function ActivityLog() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['activity-log', page],
    queryFn: () => userApi.getActivityLog(page).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const logs: AuditLog[] = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
          <Activity size={18} className="text-brand-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Activity Log</h3>
          <p className="text-sm text-surface-200">Your recent actions in the system</p>
        </div>
        {pagination && (
          <div className="ml-auto text-xs text-surface-200">
            {pagination.total} total entries
          </div>
        )}
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : logs.length === 0 ? (
        <EmptyState icon="📋" title="No activity yet" description="Your actions in the system will appear here" />
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-600/20 transition-colors group"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className={cn('badge text-xs flex-shrink-0 mt-0.5 border', actionStyles[log.action])}>
                  <span className="mr-1">{actionIcons[log.action]}</span>
                  {log.action}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-surface-200 capitalize">{log.entity_type}</span>
                    {log.ip_address && (
                      <>
                        <span className="text-surface-500">·</span>
                        <span className="text-xs text-surface-300 font-mono">{log.ip_address}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-surface-300 flex-shrink-0 mt-0.5">{timeAgo(log.created_at)}</span>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(99,102,241,0.1)]">
              <span className="text-xs text-surface-200">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  leftIcon={<ChevronLeft size={14} />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === pagination.totalPages}
                  rightIcon={<ChevronRight size={14} />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
