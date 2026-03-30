'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getSubjects, createSubject, deleteSubject } from '@/lib/supabase';
import type { Subject } from '@/types';

const SUBJECT_COLORS = [
  '#6366f1', '#e8607a', '#4a8c5c', '#0e7bb0', '#d4600a',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444',
];

const SUBJECT_ICONS = ['📚', '🔬', '📐', '🌍', '💻', '🎨', '📖', '🏛️', '🎵', '⚗️', '📊', '🧬'];

export default function SubjectsPage() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', color: SUBJECT_COLORS[0], icon: SUBJECT_ICONS[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getSubjects(user.id).then(({ data }) => data && setSubjects(data));
  }, [user]);

  const handleCreate = async () => {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    const { data } = await createSubject({ user_id: user.id, name: form.name, color: form.color, icon: form.icon });
    if (data) setSubjects(prev => [...prev, data]);
    setForm({ name: '', color: SUBJECT_COLORS[0], icon: SUBJECT_ICONS[0] });
    setShowModal(false);
    setSaving(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this subject and all its data?')) return;
    await deleteSubject(id);
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Subjects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{subjects.length} subjects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Subject</button>
      </div>

      {subjects.length === 0 ? (
        <div className="surface" style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No subjects yet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Create your first subject to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Subject</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {subjects.map(subj => (
            <Link key={subj.id} href={`/subjects/${subj.id}`} style={{
              textDecoration: 'none', display: 'block',
              borderRadius: 12, overflow: 'hidden',
              background: 'var(--surface)', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}
            >
              {/* Color bar */}
              <div style={{ height: 4, background: subj.color }} />
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{subj.icon}</span>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{subj.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                        {new Date(subj.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={e => handleDelete(subj.id, e)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-faint)', fontSize: 18, lineHeight: 1, padding: 2, borderRadius: 4,
                  }}>×</button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  {['Notes', 'Tasks', 'Practice'].map(tab => (
                    <span key={tab} style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 99,
                      background: 'var(--surface-2)', color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}>{tab}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)',
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="surface animate-fade-in" style={{ width: 420, padding: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20 }}>New Subject</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Subject name *</label>
                <input className="input" placeholder="e.g. Mathematics" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SUBJECT_ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))} style={{
                      width: 36, height: 36, borderRadius: 8, fontSize: 18,
                      border: `2px solid ${form.icon === icon ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.icon === icon ? 'var(--accent-soft)' : 'var(--surface-2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Colour</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SUBJECT_COLORS.map(color => (
                    <button key={color} onClick={() => setForm(f => ({ ...f, color }))} style={{
                      width: 28, height: 28, borderRadius: '50%', background: color,
                      border: `3px solid ${form.color === color ? 'var(--text)' : 'transparent'}`,
                      cursor: 'pointer', transition: 'transform 0.1s',
                    }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={saving || !form.name.trim()}>
                  {saving ? 'Creating…' : 'Create Subject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
