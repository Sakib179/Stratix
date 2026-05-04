import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (dateStr: string | null | undefined, fmt = 'MMM d, yyyy') => {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return '—';
  }
};

export const formatDateTime = (dateStr: string | null | undefined) =>
  formatDate(dateStr, 'MMM d, yyyy · h:mm a');

export const timeAgo = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return '—';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatCurrency = (amount: number, currency = '৳'): string => {
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const truncate = (str: string, maxLen = 40): string =>
  str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getFileIcon = (mimeType: string | undefined, fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
  if (ext === 'docx' || ext === 'doc') return '📝';
  if (ext === 'xlsx' || ext === 'xls') return '📊';
  if (ext === 'csv') return '📋';
  return '📎';
};

export const statusColors: Record<string, string> = {
  Draft:     'bg-surface-600 text-surface-100 border border-surface-500',
  Issued:    'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  Paid:      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  Overdue:   'bg-red-500/15 text-red-400 border border-red-500/30',
  Cancelled: 'bg-surface-600 text-surface-200 border border-surface-500 line-through',
  active:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  inactive:  'bg-red-500/15 text-red-400 border border-red-500/30',
  admin:     'bg-violet-500/15 text-violet-400 border border-violet-500/30',
  employee:  'bg-brand-500/15 text-brand-400 border border-brand-500/30',
  success:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  failed:    'bg-red-500/15 text-red-400 border border-red-500/30',
  in_progress: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
};
