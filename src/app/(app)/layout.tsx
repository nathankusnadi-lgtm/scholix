'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { supabase, getProfile } from '@/lib/supabase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setSession, setProfile, setLoading, loading } = useAuthStore();
  const { setTheme, setFont, applyToDOM } = useThemeStore();

  // Apply persisted theme on first client render
  useEffect(() => {
    applyToDOM();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        router.replace('/login');
        return;
      }
      setSession(session);
      setUser(session.user);

      const { data: profile } = await getProfile(session.user.id);
      if (profile) {
        setProfile(profile as any);
        // Apply theme/font saved in DB (overrides localStorage)
        const t = (profile.theme as any) ?? 'light';
        const f = (profile.font as any) ?? 'default';
        setTheme(t);
        setFont(f);
      }
      setLoading(false);
    });

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setSession(null);
        setProfile(null);
        router.replace('/login');
      } else if (session) {
        setSession(session);
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 auto 12px',
            animation: 'pulse-soft 1.5s ease infinite',
          }}>S</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
