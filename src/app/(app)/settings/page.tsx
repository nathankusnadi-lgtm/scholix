'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, themeOptions, fontOptions } from '@/store/themeStore';
import { upsertProfile } from '@/lib/supabase';
import type { ThemeName, FontName } from '@/types';

export default function SettingsPage() {
  const { user, profile, setProfile } = useAuthStore();
  const { theme, font, setTheme, setFont } = useThemeStore();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
  }, [profile]);

  const handleTheme = (t: ThemeName) => {
    setTheme(t);
    if (user) upsertProfile({ id: user.id, theme: t });
  };

  const handleFont = (f: FontName) => {
    setFont(f);
    if (user) upsertProfile({ id: user.id, font: f });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { data } = await upsertProfile({ id: user.id, display_name: displayName });
    if (data) {
      setProfile(data as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Personalize your Scholix experience</p>
      </div>

      {/* Profile */}
      <section className="surface" style={{ padding: '24px 26px', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 18 }}>Profile</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Display name</label>
            <input className="input" placeholder="Your name" value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ maxWidth: 320 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input" value={user?.email ?? ''} disabled style={{ maxWidth: 320, opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
          <div>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ fontSize: 13 }}>
              {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="surface" style={{ padding: '24px 26px', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Theme</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Choose a colour palette for your workspace</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {themeOptions.map(t => (
            <button key={t.value} onClick={() => handleTheme(t.value)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 10,
              border: `2px solid ${theme === t.value ? 'var(--accent)' : 'var(--border)'}`,
              background: theme === t.value ? 'var(--accent-soft)' : 'var(--surface-2)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 20 }}>{t.emoji}</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.label}</p>
              </div>
              {theme === t.value && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 14 }}>✓</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Font */}
      <section className="surface" style={{ padding: '24px 26px', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Font</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Pick a typeface that matches your study style</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fontOptions.map(f => (
            <button key={f.value} onClick={() => handleFont(f.value)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 10,
              border: `2px solid ${font === f.value ? 'var(--accent)' : 'var(--border)'}`,
              background: font === f.value ? 'var(--accent-soft)' : 'var(--surface-2)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{f.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.sample}</p>
              </div>
              <span style={{ fontSize: 18, color: 'var(--text-muted)', fontFamily: f.value === 'default' ? 'DM Sans' : f.value === 'serif' ? 'Lora' : f.value === 'mono' ? 'DM Mono' : 'Nunito' }}>
                Aa
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="surface" style={{ padding: '24px 26px', border: '1px solid var(--danger)20' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--danger)' }}>Danger Zone</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>These actions are irreversible. Proceed with caution.</p>
        <button className="btn" style={{
          border: '1px solid var(--danger)', color: 'var(--danger)',
          background: 'transparent', fontSize: 13,
        }}
          onClick={() => confirm('Are you sure? All your data will be permanently deleted.') && alert('Contact support to delete your account.')}>
          Delete Account
        </button>
      </section>
    </div>
  );
}
