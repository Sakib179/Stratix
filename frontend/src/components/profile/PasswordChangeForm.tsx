'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, ShieldAlert } from 'lucide-react';
import { userApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PasswordStrengthMeter from '@/components/ui/PasswordStrengthMeter';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function PasswordChangeForm() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => userApi.changePassword({ current_password: form.current_password, new_password: form.new_password }),
    onSuccess: () => {
      toast.success('Password changed. Please log in again.');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    },
    onError: (err: AxiosError<{ message: string; errors?: string[] }>) => {
      const msg = err.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.current_password) errs.current_password = 'Current password is required';
    if (!form.new_password) errs.new_password = 'New password is required';
    if (form.new_password.length < 8) errs.new_password = 'Must be at least 8 characters';
    if (form.new_password !== form.confirm_password) errs.confirm_password = 'Passwords do not match';
    if (form.new_password === form.current_password) errs.new_password = 'New password must differ from current';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) mutation.mutate();
  };

  const change = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  return (
    <Card>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
          <Lock size={18} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Change Password</h3>
          <p className="text-sm text-surface-200">Must be at least 8 characters with uppercase, number, and special char</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          value={form.current_password}
          onChange={change('current_password')}
          error={errors.current_password}
          placeholder="Enter current password"
          required
        />

        <div>
          <Input
            label="New Password"
            type="password"
            value={form.new_password}
            onChange={change('new_password')}
            error={errors.new_password}
            placeholder="Create a strong password"
            required
          />
          <PasswordStrengthMeter password={form.new_password} />
        </div>

        <Input
          label="Confirm New Password"
          type="password"
          value={form.confirm_password}
          onChange={change('confirm_password')}
          error={errors.confirm_password}
          placeholder="Repeat new password"
          required
        />

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300">
          <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
          Changing your password will sign you out of all devices.
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="brand" loading={mutation.isPending}>
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  );
}
