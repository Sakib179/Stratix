'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideClose?: boolean;
  className?: string;
}

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ open, isOpen, onClose, title, description, children, size = 'md', hideClose, className }: ModalProps) {
  const visible = open ?? isOpen ?? false;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (visible) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={cn(
              'relative w-full glass shadow-[0_24px_80px_rgba(0,0,0,0.6)] rounded-2xl',
              sizeMap[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || !hideClose) && (
              <div className="flex items-start justify-between p-6 pb-4 border-b border-white/5">
                <div>
                  {title && <h2 className="text-xl font-semibold text-white">{title}</h2>}
                  {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
                </div>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-4 flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;

export function ConfirmModal({
  open,
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmLabel = 'Confirm',
  variant,
  danger,
  isLoading,
  loading,
  requireTyping,
}: {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  variant?: 'default' | 'danger';
  danger?: boolean;
  isLoading?: boolean;
  loading?: boolean;
  requireTyping?: string;
}) {
  const [typedValue, setTypedValue] = useState('');
  const isDanger = variant === 'danger' || danger;
  const isWorking = isLoading ?? loading ?? false;
  const canConfirm = !requireTyping || typedValue === requireTyping;
  const bodyText = description ?? message ?? '';

  return (
    <Modal open={open} isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {bodyText && <p className="text-gray-300 text-sm leading-relaxed">{bodyText}</p>}
        {requireTyping && (
          <div>
            <p className="text-xs text-gray-400 mb-2">
              Type <strong className="text-white">{requireTyping}</strong> to confirm:
            </p>
            <input
              className="input-base w-full text-sm"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireTyping}
            />
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-white/15 text-gray-300 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isWorking}
            className={cn(
              'flex-1 h-10 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed',
              isDanger
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                : 'btn-brand'
            )}
          >
            {isWorking ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
