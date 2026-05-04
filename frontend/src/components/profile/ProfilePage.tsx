'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Paperclip, Activity, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import PageTransition from '@/components/layout/PageTransition';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { SkeletonProfile } from '@/components/ui/Skeleton';
import { cn, formatDate } from '@/lib/utils';
import ProfileForm from './ProfileForm';
import PasswordChangeForm from './PasswordChangeForm';
import FileAttachments from './FileAttachments';
import ActivityLog from './ActivityLog';
import TwoFactorSetup from './TwoFactorSetup';

const tabs = [
  { id: 'overview',     label: 'Overview',   icon: <User size={15} /> },
  { id: 'security',     label: 'Security',   icon: <Lock size={15} /> },
  { id: 'attachments',  label: 'Attachments', icon: <Paperclip size={15} /> },
  { id: 'activity',     label: 'Activity',   icon: <Activity size={15} /> },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user: authUser } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile().then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <PageTransition className="page-container">
        <SkeletonProfile />
      </PageTransition>
    );
  }

  const user = data || authUser;

  return (
    <PageTransition className="page-container space-y-6">
      {/* Header card */}
      <div className="glass p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative group">
            <Avatar name={user?.full_name || 'U'} size="xl" />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Change</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{user?.full_name}</h1>
              <Badge statusKey={user?.role}>{user?.role}</Badge>
              {user?.two_factor_enabled && (
                <Badge variant="success" dot>2FA On</Badge>
              )}
            </div>
            <p className="text-surface-200 text-sm">{user?.email}</p>
            {(user?.designation || user?.department) && (
              <p className="text-surface-200 text-sm mt-1">
                {[user.designation, user.department].filter(Boolean).join(' · ')}
              </p>
            )}
            <p className="text-surface-300 text-xs mt-2">
              Member since {formatDate(user?.created_at)}
              {user?.last_login && ` · Last active ${formatDate(user.last_login, 'MMM d, yyyy')}`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="glow-dot green" />
            <span className="text-xs text-emerald-400 font-medium">Active</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-surface-700/40 rounded-xl p-1 w-full overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0',
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-surface-200 hover:text-white'
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-brand-500/20 border border-brand-500/30"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'overview' && <ProfileForm user={user} onSuccess={refetch} />}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <PasswordChangeForm />
            <TwoFactorSetup user={user} onSuccess={refetch} />
          </div>
        )}
        {activeTab === 'attachments' && <FileAttachments />}
        {activeTab === 'activity' && <ActivityLog />}
      </motion.div>
    </PageTransition>
  );
}
