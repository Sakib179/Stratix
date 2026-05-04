'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/lib/adminApi';
import type { User } from '@/types';
import toast from 'react-hot-toast';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

interface FormValues {
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'employee';
  designation: string;
  department: string;
  is_active: string;
}

export function UserForm({ isOpen, onClose, user }: UserFormProps) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone ?? '',
        role: user.role,
        designation: user.designation ?? '',
        department: user.department ?? '',
        is_active: String(user.is_active),
      });
    } else {
      reset({ full_name: '', email: '', phone: '', role: 'employee', designation: '', department: '', is_active: 'true' });
    }
  }, [user, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, is_active: values.is_active === 'true' };
      return user
        ? adminApi.updateUser(user.id, payload)
        : adminApi.createUser(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(user ? 'User updated' : 'User created — welcome email sent');
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error saving user'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Create User'} size="md">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name" required
            error={errors.full_name?.message}
            {...register('full_name', { required: 'Full name is required' })}
          />
          <Input
            label="Email" type="email" required
            disabled={!!user}
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input label="Phone" {...register('phone')} />
          <Select label="Role" {...register('role')}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </Select>
          <Input label="Designation" placeholder="e.g. Sales Manager" {...register('designation')} />
          <Input label="Department" placeholder="e.g. Operations" {...register('department')} />
          {user && (
            <Select label="Status" {...register('is_active')}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          )}
        </div>

        {!user && (
          <p className="text-xs text-gray-500 bg-white/5 rounded-lg p-3">
            A random temporary password will be generated and emailed to the user on account creation.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="brand" isLoading={mutation.isPending}>
            {user ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
