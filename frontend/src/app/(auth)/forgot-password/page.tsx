'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Hexagon, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[420px]"
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-30 blur-xl animate-pulse-slow" />
          <div className="relative w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand">
            <Hexagon size={28} className="text-white fill-white/20" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-3xl font-bold gradient-text tracking-tight">Stratix</h1>
      </div>

      <div className="glass p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)]" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Check your inbox</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              If <span className="text-white">{email}</span> exists in our system, we've sent a password reset link. Check your spam folder if you don't see it.
            </p>
            <Link href="/login">
              <button className="mt-6 text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Back to sign in
              </button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Forgot your password?</h2>
              <p className="text-surface-200 text-sm mt-1">Enter your email and we'll send a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                leftIcon={<Mail size={16} />}
                required
                autoFocus
              />

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button type="submit" variant="brand" fullWidth loading={loading} size="lg">
                Send reset link
              </Button>
            </form>

            <Link href="/login" className="flex items-center justify-center gap-2 mt-5 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
}
