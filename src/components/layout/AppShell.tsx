'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { signOut, getSubjects } from '@/lib/supabase';
import type { Subject } from '@/types';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { href: '/subjects',  label: 'Subjects',  icon: '📚' },
  { href: '/tasks',     label: 'Tasks',      icon: '✓' },
  { href: '/results',   label: 'Results',    icon: '◎' },
  { href: '/tools',     label: 'Tools',      icon: '⏱' },
  { href: '/settings',  label: 'Settings',   icon: '⚙' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (user) {
      getSubjects(user.id).then(({ data }) => {
        if (data) setSubjects(data);
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: 'var(--sidebar-w, 240px)',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', fontWeight: 700,
            }}>S</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Scholix
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 12px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', padding: '0 8px 8px' }}>Menu</p>
          {NAV.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none', fontSize: 14, fontWeight: active ? 500 : 400,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                background: active ? 'var(--accent-soft)' : 'transparent',
                transition: 'all 0.15s ease',
              }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {/* Subjects list */}
          {subjects.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)', padding: '0 8px 8px' }}>Subjects</p>
              {subjects.map(subj => (
                <Link key={subj.id} href={`/subjects/${subj.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 8, marginBottom: 2,
                  textDecoration: 'none', fontSize: 13,
                  color: pathname === `/subjects/${subj.id}` ? 'var(--text)' : 'var(--text-muted)',
                  background: pathname === `/subjects/${subj.id}` ? 'var(--surface-2)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: subj.color, flexShrink: 0,
                  }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {subj.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* User + sign out */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {profile?.display_name ?? user?.email}
            </p>
          </div>
          <button onClick={handleSignOut} title="Sign out" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-faint)', fontSize: 16, padding: 4,
            borderRadius: 6, transition: 'color 0.15s',
          }}>⇥</button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: 56, flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 16,
          justifyContent: 'flex-end',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 13, color: 'var(--text-muted)',
            letterSpacing: '0.02em',
          }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </header>

        {/* Page */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
