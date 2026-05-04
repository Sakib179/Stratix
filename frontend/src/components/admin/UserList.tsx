'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Users, Shield, RotateCcw, Trash2, Edit2, ChevronDown } from 'lucide-react';
import PageTransition, { StaggerTbody, StaggerTr } from '@/components/layout/PageTransition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { UserForm } from './UserForm';
import { adminApi } from '@/lib/adminApi';
import { formatDate, timeAgo } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import type { User } from '@/types';
import toast from 'react-hot-toast';

export function UserList() {
  const router = useRouter();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, debouncedSearch, role, isActive],
    queryFn: () => adminApi.listUsers({ page, limit: 20, search: debouncedSearch, role: role || undefined, is_active: isActive || undefined }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deleted'); setDeleteTarget(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Delete failed'),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => adminApi.resetPassword(id),
    onSuccess: () => { toast.success('Password reset — email sent to user'); setResetTarget(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Reset failed'),
  });

  const users = data?.data ?? [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 text-sm mt-0.5">{data?.pagination?.total ?? 0} users registered</p>
          </div>
          <Button variant="brand" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setEditUser(null); setShowForm(true); }}>
            Add User
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email…" className="flex-1" />
              <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="w-full sm:w-36">
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </Select>
              <Select value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(1); }} className="w-full sm:w-36">
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><SkeletonTable rows={8} /></div>
            ) : users.length === 0 ? (
              <EmptyState
                icon={<Users className="w-10 h-10" />}
                title="No users found"
                description={search ? 'Try adjusting your search.' : 'Create your first user.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 w-10"></th>
                      {['Name', 'Email', 'Role', 'Status', 'Last Login', ''].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <StaggerTbody>
                    {users.map((u) => (
                      <StaggerTr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                        <td className="px-4 py-3">
                          <Avatar name={u.full_name} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-white">{u.full_name}</p>
                          {u.designation && <p className="text-xs text-gray-500">{u.designation}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role === 'admin' ? 'brand' : 'muted'}>
                            {u.role === 'admin' && <Shield className="w-2.5 h-2.5 mr-1 inline" />}
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.is_active ? 'success' : 'danger'}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {u.last_login ? timeAgo(u.last_login) : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditUser(u); setShowForm(true); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                              title="Edit user"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setResetTarget(u)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                              title="Reset password"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/users/${u.id}`)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                              title="View details & permissions"
                            >
                              <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete user"
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

      <UserForm isOpen={showForm} onClose={() => { setShowForm(false); setEditUser(null); }} user={editUser} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete User"
        description={`Delete "${deleteTarget?.full_name}"? This cannot be undone and they will lose access immediately.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={() => resetTarget && resetMutation.mutate(resetTarget.id)}
        title="Reset Password"
        description={`A new temporary password will be emailed to ${resetTarget?.email}. They will need to change it on next login.`}
        confirmLabel="Reset Password"
        isLoading={resetMutation.isPending}
      />
    </PageTransition>
  );
}
