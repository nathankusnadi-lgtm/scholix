'use client';

import { useAuthStore } from '@/store/authStore';
import { signOut } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, session, profile, loading } = useAuthStore();
  const router = useRouter();

  const logout = async () => {
    await signOut();
    router.push('/login');
  };

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}
