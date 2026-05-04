'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Hexagon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

function OAuthHandler() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { login }    = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      toast.error('Social login failed. Please try again.');
      router.replace('/login');
      return;
    }

    // Fetch user profile using the access token
    const fetchUser = async () => {
      try {
        const { data } = await authApi.me(token);
        login(data.data, token);
        toast.success(`Welcome, ${data.data.full_name.split(' ')[0]}!`);
        router.replace('/dashboard');
      } catch {
        toast.error('Could not retrieve your profile. Please log in again.');
        router.replace('/login');
      }
    };

    fetchUser();
  }, [searchParams, router, login]);

  return null;
}

export default function OAuthSuccessPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-30 blur-xl animate-pulse-slow" />
        <div className="relative w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand">
          <Hexagon size={28} className="text-white fill-white/20 animate-spin-slow" strokeWidth={1.5} />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-white font-semibold">Signing you in…</h2>
        <p className="text-gray-400 text-sm mt-1">Please wait</p>
      </div>
      <Suspense>
        <OAuthHandler />
      </Suspense>
    </div>
  );
}
