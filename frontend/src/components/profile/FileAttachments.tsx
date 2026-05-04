'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Download, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '@/lib/api';
import { Attachment } from '@/types';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { formatFileSize, formatDateTime, getFileIcon, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.docx';
const MAX_MB = 5;

export default function FileAttachments() {
  const [dragging, setDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: attachments = [], isLoading } = useQuery<Attachment[]>({
    queryKey: ['attachments'],
    queryFn: () => userApi.getAttachments().then((r) => r.data.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => userApi.uploadAttachment(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments'] });
      toast.success('File uploaded successfully');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message || 'Upload failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteAttachment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments'] });
      toast.success('File deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Delete failed'),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File exceeds ${MAX_MB}MB limit`);
      return;
    }
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Card>
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">File Attachments</h3>
        <p className="text-sm text-surface-200 mt-1">PDF, JPG, JPEG, PNG, DOCX · Max {MAX_MB}MB each</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 mb-5',
          dragging
            ? 'border-brand-400 bg-brand-500/10'
            : 'border-[rgba(99,102,241,0.25)] hover:border-brand-400/50 hover:bg-brand-500/5'
        )}
      >
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center transition-all', dragging ? 'bg-brand-500/20' : 'bg-surface-600/50')}>
          <Upload size={20} className={dragging ? 'text-brand-400' : 'text-surface-200'} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white">{dragging ? 'Drop to upload' : 'Drop files here or click to browse'}</p>
          <p className="text-xs text-surface-300 mt-1">{ACCEPTED.split(',').join(', ')}</p>
        </div>
        {uploadMutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-brand-400">
            <div className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
            Uploading…
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      {/* File list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : attachments.length === 0 ? (
        <EmptyState icon="📎" title="No attachments yet" description="Upload documents, certifications, or contracts to your profile" />
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {attachments.map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-600/30 border border-[rgba(99,102,241,0.08)] hover:border-[rgba(99,102,241,0.2)] transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-600/50 flex items-center justify-center text-lg flex-shrink-0">
                  {getFileIcon(file.mime_type, file.file_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.file_name}</p>
                  <p className="text-xs text-surface-200">{formatFileSize(file.file_size)} · {formatDateTime(file.uploaded_at)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/${file.file_path}`}
                    download={file.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-200 hover:text-white hover:bg-surface-600/50 transition-colors"
                    aria-label="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={14} />
                  </a>
                  <button
                    onClick={() => setDeleteTarget(file.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-200 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        title="Delete Attachment"
        message="Are you sure you want to delete this file? This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </Card>
  );
}
