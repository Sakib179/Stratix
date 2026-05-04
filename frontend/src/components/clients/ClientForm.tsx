'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { clientApi } from '@/lib/clientApi';
import type { Client } from '@/types';
import toast from 'react-hot-toast';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
}

interface FormValues {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export function ClientForm({ isOpen, onClose, client }: ClientFormProps) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (client) {
      reset({
        full_name: client.full_name,
        phone: client.phone,
        email: client.email ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      });
    } else {
      reset({ full_name: '', phone: '', email: '', address: '', notes: '' });
    }
  }, [client, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      client
        ? clientApi.update(client.id, values)
        : clientApi.create(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      if (client) qc.invalidateQueries({ queryKey: ['client', client.id] });
      toast.success(client ? 'Client updated' : 'Client created');
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error saving client'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Edit Client' : 'Add Client'} size="md">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name"
            required
            error={errors.full_name?.message}
            {...register('full_name', { required: 'Full name is required' })}
          />
          <Input
            label="Phone"
            required
            error={errors.phone?.message}
            {...register('phone', { required: 'Phone number is required' })}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email', {
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
            })}
          />
          <Input label="Address" {...register('address')} />
        </div>
        <Textarea label="Notes" rows={2} {...register('notes')} />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="brand" isLoading={mutation.isPending}>
            {client ? 'Save Changes' : 'Add Client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
