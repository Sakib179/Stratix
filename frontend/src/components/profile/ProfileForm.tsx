'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface ProfileFormProps {
  user: User | null;
  onSuccess: () => void;
}

export default function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const { updateUser } = useAuthStore();
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    designation: '',
    department: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        designation: user.designation || '',
        department: user.department || '',
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => userApi.updateProfile(form),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      onSuccess();
      toast.success('Profile updated successfully');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const hasChanges =
    form.full_name !== (user?.full_name || '') ||
    form.phone !== (user?.phone || '') ||
    form.designation !== (user?.designation || '') ||
    form.department !== (user?.department || '');

  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">Personal Information</h3>
        <p className="text-sm text-surface-200 mt-1">Update your profile details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={form.full_name}
            onChange={handleChange('full_name')}
            placeholder="John Doe"
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="+880 1XXX-XXXXXX"
          />
          <Input
            label="Designation"
            value={form.designation}
            onChange={handleChange('designation')}
            placeholder="e.g. Sales Manager"
          />
          <Input
            label="Department"
            value={form.department}
            onChange={handleChange('department')}
            placeholder="e.g. Sales"
          />
        </div>

        {/* Read-only fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-200">Email Address</label>
            <div className="input-base opacity-60 cursor-not-allowed text-surface-100 flex items-center">
              {user?.email}
              <span className="ml-auto text-xs text-surface-300 bg-surface-600 px-2 py-0.5 rounded">Read only</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-200">Role</label>
            <div className="input-base opacity-60 cursor-not-allowed text-surface-100 flex items-center capitalize">
              {user?.role}
              <span className="ml-auto text-xs text-surface-300 bg-surface-600 px-2 py-0.5 rounded">System</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="brand"
            loading={mutation.isPending}
            disabled={!hasChanges}
            leftIcon={<Save size={15} />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
