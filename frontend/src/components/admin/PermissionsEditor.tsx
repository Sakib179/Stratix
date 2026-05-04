'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/adminApi';
import type { Permission } from '@/types';
import toast from 'react-hot-toast';

const MODULES = [
  { key: 'products',      label: 'Products',      description: 'View, create and edit products' },
  { key: 'invoices',      label: 'Invoices',       description: 'Create and manage invoices' },
  { key: 'clients',       label: 'Clients',        description: 'View and manage client records' },
  { key: 'analytics',     label: 'Analytics',      description: 'View reports and analytics' },
  { key: 'notifications', label: 'Notifications',  description: 'Receive and manage alerts' },
];

interface Props {
  userId: string;
  role: string;
  initialPermissions: Permission[];
}

export function PermissionsEditor({ userId, role, initialPermissions }: Props) {
  const qc = useQueryClient();
  const [perms, setPerms] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    MODULES.forEach((m) => { map[m.key] = false; });
    initialPermissions.forEach((p) => { map[p.module] = p.can_access; });
    return map;
  });

  const isAdmin = role === 'admin';

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updatePermissions(
        userId,
        MODULES.map((m) => ({ module: m.key, can_access: isAdmin ? true : perms[m.key] }))
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', userId] });
      toast.success('Permissions saved');
    },
    onError: () => toast.error('Failed to save permissions'),
  });

  const toggle = (key: string) => {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-sm text-brand-300">
          <Shield className="w-4 h-4 flex-shrink-0" />
          Admins have access to all modules by default.
        </div>
      )}

      <div className="space-y-2">
        {MODULES.map((m) => {
          const enabled = isAdmin ? true : perms[m.key];
          return (
            <div
              key={m.key}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                enabled ? 'border-brand-500/30 bg-brand-500/5' : 'border-white/8 bg-white/2'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-white">{m.label}</p>
                <p className="text-xs text-gray-500">{m.description}</p>
              </div>
              <button
                disabled={isAdmin}
                onClick={() => toggle(m.key)}
                className={`relative w-10 h-5.5 rounded-full transition-all flex-shrink-0 ${
                  enabled ? 'bg-brand-500' : 'bg-white/15'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                aria-checked={enabled}
                role="switch"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                    enabled ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {!isAdmin && (
        <Button
          variant="brand"
          size="sm"
          fullWidth
          leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
          onClick={() => mutation.mutate()}
          isLoading={mutation.isPending}
        >
          Save Permissions
        </Button>
      )}
    </div>
  );
}
