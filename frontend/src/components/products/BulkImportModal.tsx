'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, X, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { productApi } from '@/lib/productApi';
import toast from 'react-hot-toast';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: { row: number; reason: string }[] } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await productApi.bulkImport(file);
      setResult(res);
      if (res.imported > 0) {
        toast.success(`${res.imported} product(s) imported`);
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Import Products" size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">Upload a CSV file to import multiple products at once.</p>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={productApi.downloadTemplate}
          >
            Template
          </Button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-brand-400" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <UploadCloud className="w-10 h-10 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Drag & drop a CSV file here, or click to browse</p>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              {result.imported} product(s) imported successfully
            </div>
            {result.skipped.length > 0 && (
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 space-y-1 max-h-40 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-semibold mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {result.skipped.length} row(s) skipped
                </div>
                {result.skipped.map((s, i) => (
                  <p key={i} className="text-xs text-yellow-300/80">Row {s.row}: {s.reason}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button
            variant="brand"
            onClick={handleImport}
            isLoading={loading}
            disabled={!file || loading}
          >
            Import
          </Button>
        </div>
      </div>
    </Modal>
  );
}
