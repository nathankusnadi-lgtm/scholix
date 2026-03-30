'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getResults, createResult, deleteResult, getSubjects } from '@/lib/supabase';
import type { Result, Subject } from '@/types';

function gradeColor(pct: number) {
  if (pct >= 85) return 'var(--success)';
  if (pct >= 70) return 'var(--accent)';
  if (pct >= 50) return 'var(--accent-2)';
  return 'var(--danger)';
}

function gradeLabel(pct: number) {
  if (pct >= 85) return 'HD';
  if (pct >= 75) return 'D';
  if (pct >= 65) return 'CR';
  if (pct >= 50) return 'P';
  return 'F';
}

export default function ResultsPage() {
  const { user } = useAuthStore();
  const [results, setResults] = useState<Result[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [form, setForm] = useState({ title: '', subject_id: '', score: '', max_score: '100', weight: '', date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getResults(user.id).then(({ data }) => data && setResults(data as Result[]));
    getSubjects(user.id).then(({ data }) => data && setSubjects(data));
  }, [user]);

  const filtered = filterSubject === 'all' ? results : results.filter(r => r.subject_id === filterSubject);

  const overallAvg = filtered.length
    ? Math.round(filtered.reduce((s, r) => s + (r.score / r.max_score) * 100, 0) / filtered.length)
    : null;

  // Weighted average (only items with weight > 0)
  const withWeight = filtered.filter(r => r.weight > 0);
  const weightedAvg = withWeight.length
    ? Math.round(withWeight.reduce((s, r) => s + (r.score / r.max_score) * r.weight, 0) /
        withWeight.reduce((s, r) => s + r.weight, 0))
    : null;

  const handleCreate = async () => {
    if (!user || !form.title || !form.subject_id || !form.score || !form.max_score) return;
    setSaving(true);
    const { data } = await createResult({
      user_id: user.id,
      subject_id: form.subject_id,
      title: form.title,
      score: Number(form.score),
      max_score: Number(form.max_score),
      weight: Number(form.weight) || 0,
      date: form.date || new Date().toISOString().split('T')[0],
    });
    if (data) {
      const subj = subjects.find(s => s.id === data.subject_id);
      setResults(prev => [...prev, { ...data, subject: subj } as Result].sort((a, b) => a.date.localeCompare(b.date)));
    }
    setForm({ title: '', subject_id: '', score: '', max_score: '100', weight: '', date: '' });
    setShowModal(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteResult(id);
    setResults(prev => prev.filter(r => r.id !== id));
  };

  // Simple bar chart data
  const chartData = filtered.slice(-10).map(r => ({
    label: r.title.length > 12 ? r.title.slice(0, 12) + '…' : r.title,
    pct: Math.round((r.score / r.max_score) * 100),
    color: (r.subject as any)?.color ?? 'var(--accent)',
  }));

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Results</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{filtered.length} results recorded</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Result</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Simple Average', value: overallAvg !== null ? `${overallAvg}%` : '—', sub: 'unweighted mean' },
          { label: 'Weighted Average', value: weightedAvg !== null ? `${weightedAvg}%` : '—', sub: 'by assessment weight' },
          { label: 'Grade', value: overallAvg !== null ? gradeLabel(overallAvg) : '—', sub: 'current standing', color: overallAvg !== null ? gradeColor(overallAvg) : undefined },
        ].map(card => (
          <div key={card.label} className="surface" style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{card.label}</p>
            <p style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 600, color: card.color ?? 'var(--text)', lineHeight: 1 }}>{card.value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <select className="input" style={{ width: 'auto', fontSize: 13 }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="all">All subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="surface" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Progress (last 10 results)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600 }}>{d.pct}%</span>
                <div style={{
                  width: '100%', height: `${d.pct}%`,
                  background: d.color, borderRadius: '4px 4px 0 0',
                  minHeight: 4, transition: 'height 0.4s ease',
                }} />
                <span style={{ fontSize: 9, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.3 }}>{d.label}</span>
              </div>
            ))}
          </div>
          {/* 50% + 70% markers */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[{ pct: 50, label: 'Pass (50%)' }, { pct: 70, label: 'Credit (70%)' }, { pct: 85, label: 'HD (85%)' }].map(m => (
              <span key={m.pct} style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: gradeColor(m.pct), marginRight: 4 }} />
                {m.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results table */}
      <div className="surface" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Assessment', 'Subject', 'Score', 'Percentage', 'Weight', 'Grade', 'Date', ''].map(col => (
                <th key={col} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-faint)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-faint)' }}>No results yet. Add your first assessment above.</td></tr>
            ) : (
              filtered.map(r => {
                const pct = Math.round((r.score / r.max_score) * 100);
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{r.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.subject && (
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 99,
                          background: (r.subject as any).color + '22', color: (r.subject as any).color,
                          border: `1px solid ${(r.subject as any).color}44`,
                        }}>{(r.subject as any).name}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{r.score} / {r.max_score}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: gradeColor(pct), borderRadius: 2 }} />
                        </div>
                        <span style={{ color: gradeColor(pct), fontWeight: 600 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{r.weight > 0 ? `${r.weight}%` : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: gradeColor(pct) }}>{gradeLabel(pct)}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 16 }}>×</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Result Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)',
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="surface animate-fade-in" style={{ width: 440, padding: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Add Result</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Assessment name *</label>
                <input className="input" placeholder="e.g. Midterm Exam" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Subject *</label>
                <select className="input" value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Score *</label>
                  <input className="input" type="number" placeholder="85" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Out of *</label>
                  <input className="input" type="number" placeholder="100" value={form.max_score} onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Weight (%)</label>
                  <input className="input" type="number" placeholder="30" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Date</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={saving}>
                  {saving ? 'Saving…' : 'Add Result'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
