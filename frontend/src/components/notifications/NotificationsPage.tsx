'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';
import PageTransition, { StaggerContainer, StaggerItem } from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { notificationApi } from '@/lib/notificationApi';
import { timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';

const iconMap: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  success: <CheckCircle className="w-4 h-4 text-green-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  low_stock: <Package className="w-4 h-4 text-orange-400" />,
};

const bgMap: Record<string, string> = {
  info: 'bg-blue-500/10 border-blue-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
  success: 'bg-green-500/10 border-green-500/20',
  error: 'bg-red-500/10 border-red-500/20',
  low_stock: 'bg-orange-500/10 border-orange-500/20',
};

export function NotificationsPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications.filter((n: Notification) => !n.is_read).length;

  const handleClick = (n: Notification) => {
    if (!n.is_read) markOneMutation.mutate(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="Notifications"
          subtitle={`${unread} unread`}
          icon={Bell}
          gradient="from-blue-500 to-indigo-600"
          actions={
            unread > 0 ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
                onClick={() => markAllMutation.mutate()}
                isLoading={markAllMutation.isPending}
              >
                Mark all read
              </Button>
            ) : undefined
          }
        />

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<BellOff className="w-10 h-10" />}
                title="All caught up"
                description="You have no notifications right now."
              />
            ) : (
              <StaggerContainer>
                <AnimatePresence>
                  {notifications.map((n: Notification) => (
                    <StaggerItem key={n.id}>
                      <motion.div
                        layout
                        onClick={() => handleClick(n)}
                        className={`flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-0 transition-colors cursor-pointer ${
                          n.link ? 'hover:bg-white/3' : ''
                        } ${!n.is_read ? 'bg-white/2' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${bgMap[n.type] ?? 'bg-white/5 border-white/10'}`}>
                          {iconMap[n.type] ?? <Bell className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${n.is_read ? 'text-gray-300' : 'text-white'}`}>
                              {n.title}
                            </p>
                            <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo(n.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-400 mt-0.5">{n.message}</p>
                        </div>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                        )}
                      </motion.div>
                    </StaggerItem>
                  ))}
                </AnimatePresence>
              </StaggerContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
