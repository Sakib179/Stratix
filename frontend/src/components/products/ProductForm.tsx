'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, ImagePlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { productApi } from '@/lib/productApi';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

interface FormValues {
  product_name: string;
  model_no: string;
  serial_no: string;
  category_id: string;
  description: string;
  unit_price: string;
  stock_quantity: string;
  stock_threshold: string;
  tags: string;
}

export function ProductForm({ isOpen, onClose, product }: ProductFormProps) {
  const qc = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: productApi.listCategories,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (product) {
      reset({
        product_name: product.product_name,
        model_no: product.model_no,
        serial_no: product.serial_no ?? '',
        category_id: product.category_id ?? '',
        description: product.description ?? '',
        unit_price: String(product.unit_price),
        stock_quantity: String(product.stock_quantity),
        stock_threshold: String(product.stock_threshold),
        tags: (product.tags ?? []).join(', '),
      });
      if (product.image) {
        setImagePreview(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${product.image}`);
      }
    } else {
      reset({ product_name: '', model_no: '', serial_no: '', category_id: '', description: '', unit_price: '', stock_quantity: '0', stock_threshold: '10', tags: '' });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: (fd: FormData) =>
      product ? productApi.update(product.id, fd) : productApi.create(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(product ? 'Product updated' : 'Product created');
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error saving product'),
  });

  const onSubmit = (values: FormValues) => {
    const fd = new FormData();
    fd.append('product_name', values.product_name);
    fd.append('model_no', values.model_no);
    if (values.serial_no) fd.append('serial_no', values.serial_no);
    if (values.category_id) fd.append('category_id', values.category_id);
    if (values.description) fd.append('description', values.description);
    fd.append('unit_price', values.unit_price);
    fd.append('stock_quantity', values.stock_quantity);
    fd.append('stock_threshold', values.stock_threshold);
    const tagsArr = values.tags.split(',').map((t) => t.trim()).filter(Boolean);
    fd.append('tags', JSON.stringify(tagsArr));
    if (imageFile) fd.append('image', imageFile);
    mutation.mutate(fd);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add Product'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Image upload */}
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer group">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group-hover:border-brand-500/50 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-7 h-7 text-gray-500 group-hover:text-brand-400 transition-colors" />
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          {imagePreview && (
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Remove image
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Product Name"
            required
            error={errors.product_name?.message}
            {...register('product_name', { required: 'Product name is required' })}
          />
          <Input
            label="Model No."
            required
            error={errors.model_no?.message}
            {...register('model_no', { required: 'Model number is required' })}
          />
          <Input label="Serial No." {...register('serial_no')} />
          <Select label="Category" {...register('category_id')}>
            <option value="">— No Category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input
            label="Unit Price (৳)"
            type="number"
            min={0}
            step="0.01"
            required
            error={errors.unit_price?.message}
            {...register('unit_price', { required: 'Price is required', min: { value: 0, message: 'Must be ≥ 0' } })}
          />
          <Input
            label="Stock Quantity"
            type="number"
            min={0}
            {...register('stock_quantity')}
          />
          <Input
            label="Low Stock Threshold"
            type="number"
            min={0}
            {...register('stock_threshold')}
          />
          <Input
            label="Tags (comma separated)"
            placeholder="electronics, featured"
            {...register('tags')}
          />
        </div>

        <Textarea
          label="Description"
          rows={2}
          {...register('description')}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="brand" isLoading={mutation.isPending}>
            {product ? 'Save Changes' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
