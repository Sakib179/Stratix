'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Hexagon, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function ResetForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token') || '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 mb-4">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="text-brand-400 text-sm hover:underline">Request a new reset link</Link>
      </div>
    );
  }

  return (
    <div className="glass p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)]" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Password reset!</h2>
          <p className="text-gray-400 text-sm">Redirecting you to sign in…</p>
        </motion.div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Set new password</h2>
            <p className="text-surface-200 text-sm mt-1">Choose a strong password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              leftIcon={<Lock size={16} />}
              required
              autoFocus
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              leftIcon={<Lock size={16} />}
              required
            />

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" variant="brand" fullWidth loading={loading} size="lg">
              Reset password
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[420px]"
    >
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-30 blur-xl animate-pulse-slow" />
          <div className="relative w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand">
            <Hexagon size={28} className="text-white fill-white/20" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-3xl font-bold gradient-text tracking-tight">Stratix</h1>
      </div>

      <Suspense fallback={<div className="glass p-8 text-center text-gray-400">Loading…</div>}>
        <ResetForm />
      </Suspense>
    </motion.div>
  );
}
