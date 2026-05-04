'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Shield, ShieldOff, ShieldCheck, Copy, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '@/lib/api';
import { User } from '@/types';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

type Step = 'idle' | 'setup' | 'verify' | 'backup' | 'disable';

export default function TwoFactorSetup({ user, onSuccess }: { user: User | null; onSuccess: () => void }) {
  const [step, setStep] = useState<Step>('idle');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [codeError, setCodeError] = useState('');
  const [disableModal, setDisableModal] = useState(false);

  const isEnabled = user?.two_factor_enabled;

  const setupMutation = useMutation({
    mutationFn: userApi.setup2FA,
    onSuccess: ({ data }) => {
      setQrCode(data.data.qrCode);
      setSecret(data.data.secret);
      setStep('setup');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message || 'Failed to initiate 2FA setup');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (c: string) => userApi.verify2FASetup(c),
    onSuccess: ({ data }) => {
      setBackupCodes(data.data.backupCodes);
      setStep('backup');
      onSuccess();
      toast.success('2FA enabled successfully!');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      setCodeError(err.response?.data?.message || 'Invalid code');
    },
  });

  const disableMutation = useMutation({
    mutationFn: (pw: string) => userApi.disable2FA(pw),
    onSuccess: () => {
      setDisableModal(false);
      setStep('idle');
      setDisablePassword('');
      onSuccess();
      toast.success('2FA disabled');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    },
  });

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied');
  };

  return (
    <>
      <Card>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isEnabled ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-surface-600/50 border border-surface-500/30'}`}>
            {isEnabled ? <ShieldCheck size={22} className="text-emerald-400" /> : <Shield size={22} className="text-surface-200" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-surface-600 text-surface-200'}`}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-sm text-surface-200 mb-4">
              {isEnabled
                ? 'Your account is protected with an authenticator app. Keep your backup codes in a safe place.'
                : 'Add an extra layer of security by requiring a code from your authenticator app at login.'}
            </p>

            {!isEnabled ? (
              <Button
                onClick={() => setupMutation.mutate()}
                loading={setupMutation.isPending}
                variant="outline"
                leftIcon={<Shield size={15} />}
              >
                Enable 2FA
              </Button>
            ) : (
              <Button
                onClick={() => setDisableModal(true)}
                variant="danger"
                leftIcon={<ShieldOff size={15} />}
              >
                Disable 2FA
              </Button>
            )}
          </div>
        </div>

        {/* Setup steps */}
        <AnimatePresence>
          {step === 'setup' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 pt-5 border-t border-[rgba(99,102,241,0.1)] space-y-5"
            >
              <div>
                <p className="text-sm font-medium text-white mb-1">Step 1 — Scan this QR code</p>
                <p className="text-xs text-surface-200 mb-3">Open your authenticator app (e.g. Google Authenticator) and scan:</p>
                {qrCode && (
                  <div className="inline-block p-3 bg-white rounded-xl">
                    <img src={qrCode} alt="2FA QR code" className="w-40 h-40" />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-white mb-1">Or enter this key manually</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-surface-600/50 rounded-lg text-xs font-mono text-brand-300 break-all">
                    {secret}
                  </code>
                  <button onClick={copySecret} className="p-2 rounded-lg hover:bg-surface-600/50 text-surface-200 hover:text-white transition-colors">
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white mb-2">Step 2 — Enter the 6-digit code</p>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setCodeError(''); }}
                    placeholder="000000"
                    error={codeError}
                    className="text-center font-mono text-lg tracking-widest max-w-[160px]"
                    maxLength={6}
                  />
                  <Button
                    onClick={() => verifyMutation.mutate(code)}
                    loading={verifyMutation.isPending}
                    disabled={code.length < 6}
                  >
                    Verify & Enable
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'backup' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 pt-5 border-t border-[rgba(99,102,241,0.1)]"
            >
              <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  <strong>Save these backup codes now.</strong> Each can only be used once. Store them somewhere safe — they're the only way to access your account if you lose your device.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {backupCodes.map((c) => (
                  <code key={c} className="text-center px-3 py-2 bg-surface-600/50 rounded-lg text-xs font-mono text-brand-300 border border-[rgba(99,102,241,0.15)]">
                    {c}
                  </code>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={copyBackupCodes} variant="outline" leftIcon={<Copy size={14} />} size="sm">
                  Copy All
                </Button>
                <Button onClick={() => setStep('idle')} size="sm">
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Disable 2FA modal */}
      <Modal open={disableModal} onClose={() => setDisableModal(false)} title="Disable Two-Factor Authentication" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">Disabling 2FA will make your account less secure.</p>
          </div>
          <Input
            label="Confirm with your password"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Enter current password"
          />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setDisableModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              fullWidth
              loading={disableMutation.isPending}
              disabled={!disablePassword}
              onClick={() => disableMutation.mutate(disablePassword)}
            >
              Disable 2FA
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
