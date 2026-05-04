'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { authApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import { AxiosError } from 'axios';

interface TwoFactorModalProps {
  tempToken: string;
  onSuccess: (user: unknown, token: string) => void;
  onCancel: () => void;
}

export default function TwoFactorModal({ tempToken, onSuccess, onCancel }: TwoFactorModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [useBackup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authApi.verifyTwoFactor(tempToken, code, useBackup);
      const result = data.data;
      onSuccess(result.user, result.accessToken);
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setError(axErr.response?.data?.message || 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-sm glass p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        style={{ border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mb-4">
            {useBackup ? <KeyRound size={24} className="text-brand-400" /> : <ShieldCheck size={24} className="text-brand-400" />}
          </div>
          <h2 className="text-xl font-semibold text-white">
            {useBackup ? 'Backup Code' : 'Two-Factor Auth'}
          </h2>
          <p className="text-sm text-surface-200 mt-1">
            {useBackup
              ? 'Enter one of your 8-character backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <input
              ref={inputRef}
              type={useBackup ? 'text' : 'number'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={useBackup ? 'XXXX-XXXX' : '000000'}
              maxLength={useBackup ? 9 : 6}
              className="input-base text-center text-2xl font-mono tracking-[0.3em] h-16"
              required
              autoComplete="one-time-code"
            />
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 text-center"
              >
                ⚠ {error}
              </motion.p>
            )}
          </div>

          <Button type="submit" variant="brand" fullWidth loading={loading} size="lg">
            Verify
          </Button>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setUseBackup((v) => !v); setCode(''); setError(''); }}
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors text-center"
            >
              {useBackup ? '← Use authenticator code' : 'Use a backup code instead'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-surface-200 hover:text-white transition-colors text-center"
            >
              Back to login
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
