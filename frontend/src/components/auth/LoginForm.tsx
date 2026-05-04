'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Hexagon, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { authApi } from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import TwoFactorModal from './TwoFactorModal';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

// Strip /api/v1 suffix so we can build the OAuth redirect URL correctly
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');

const OAUTH_PROVIDERS = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'Continue with LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#0A66C2" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

export default function LoginForm() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [twoFactorData, setTwoFactorData] = useState<{ tempToken: string } | null>(null);

  const { login } = useAuthStore();
  const router    = useRouter();
  const isLight   = useThemeStore((s) => s.theme === 'light');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      const result   = data.data;
      if (result.requiresTwoFactor) {
        setTwoFactorData({ tempToken: result.tempToken });
      } else {
        login(result.user, result.accessToken);
        toast.success(`Welcome back, ${result.user.full_name.split(' ')[0]}!`);
        router.push('/dashboard');
      }
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      setError(axErr.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSuccess = (user: unknown, token: string) => {
    login(user as Parameters<typeof login>[0], token);
    toast.success('Welcome back!');
    router.push('/dashboard');
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `${BACKEND_URL}/api/v1/auth/${provider}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-30 blur-xl animate-pulse-slow" />
            <div className="relative w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand">
              <Hexagon size={28} className="text-white fill-white/20" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight">Stratix</h1>
          <p className="text-surface-200 text-sm mt-1">Business Management System</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass p-8 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          style={{ border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
            <p className="text-surface-200 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Social login */}
          <div className="space-y-2 mb-5">
            {OAUTH_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleOAuth(p.id)}
                className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                  isLight
                    ? 'border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-200 text-slate-700'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/80 hover:text-white'
                }`}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-white/8'}`} />
            <span className={`text-xs uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/30'}`}>or</span>
            <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-white/8'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@stratix.com"
              leftIcon={<Mail size={16} />}
              required
              autoFocus
              autoComplete="email"
            />

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={<Lock size={16} />}
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-400"
              >
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </motion.div>
            )}

            <Button
              type="submit"
              variant="brand"
              fullWidth
              loading={loading}
              size="lg"
              className="mt-2"
              rightIcon={!loading ? <ArrowRight size={16} /> : undefined}
            >
              Sign In
            </Button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-surface-300 mt-6"
        >
          © {new Date().getFullYear()} Stratix BMS · Secured connection
        </motion.p>
      </motion.div>

      {twoFactorData && (
        <TwoFactorModal
          tempToken={twoFactorData.tempToken}
          onSuccess={handleTwoFactorSuccess}
          onCancel={() => setTwoFactorData(null)}
        />
      )}
    </>
  );
}
