import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const store = useAuthStore();
  const router = useRouter();

  const signOut = useCallback(async () => {
    await store.logout();
    toast.success('Signed out successfully');
    router.push('/login');
  }, [store, router]);

  const hasPermission = useCallback(
    (module: string) => {
      if (!store.user) return false;
      if (store.user.role === 'admin') return true;
      const perm = store.user.permissions?.find((p) => p.module === module);
      return perm?.can_access ?? false;
    },
    [store.user]
  );

  const isAdmin = store.user?.role === 'admin';

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isAdmin,
    hasPermission,
    signOut,
    updateUser: store.updateUser,
  };
};
