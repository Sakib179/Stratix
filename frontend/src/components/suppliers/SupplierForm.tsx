'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { supplierApi, type Supplier } from '@/lib/supplierApi';
import toast from 'react-hot-toast';

interface Props { isOpen: boolean; onClose: () => void; supplier?: Supplier | null; }

export function SupplierForm({ isOpen, onClose, supplier }: Props) {
  const qc = useQueryClient();
  const [name, setName]               = useState('');
  const [contact, setContact]         = useState('');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [address, setAddress]         = useState('');
  const [notes, setNotes]             = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name); setContact(supplier.contact_person || ''); setPhone(supplier.phone || '');
      setEmail(supplier.email || ''); setAddress(supplier.address || ''); setNotes(supplier.notes || '');
    } else {
      setName(''); setContact(''); setPhone(''); setEmail(''); setAddress(''); setNotes('');
    }
  }, [supplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error('Name is required'); return; }
    setLoading(true);
    try {
      const payload = { name, contact_person: contact || undefined, phone: phone || undefined, email: email || undefined, address: address || undefined, notes: notes || undefined };
      if (supplier) {
        await supplierApi.update(supplier.id, payload);
        toast.success('Supplier updated');
      } else {
        await supplierApi.create(payload);
        toast.success('Supplier added');
      }
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    } catch { toast.error('Failed to save supplier'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier ? 'Edit Supplier' : 'Add Supplier'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Company Name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Contact Person" value={contact} onChange={(e) => setContact(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Textarea label="Address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="brand" isLoading={loading}>{supplier ? 'Update' : 'Add'} Supplier</Button>
        </div>
      </form>
    </Modal>
  );
}
