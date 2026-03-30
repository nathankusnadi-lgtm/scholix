'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getTasks, createTask, updateTask, deleteTask, getSubjects } from '@/lib/supabase';
import type { Task, Subject, Priority } from '@/types';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const PRIORITY_COLOR: Record<Priority, string> = { low: 'var(--success)', medium: 'var(--accent-2)', high: 'var(--danger)' };
const PRIORITY_LABEL: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export default function TasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', due_date: '', priority: 'medium' as Priority, subject_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getTasks(user.id).then(({ data }) => data && setTasks(data as Task[]));
    getSubjects(user.id).then(({ data }) => data && setSubjects(data));
  }, [user]);

  const filtered = tasks.filter(t => {
    if (filterSubject !== 'all' && t.subject_id !== filterSubject) return false;
    if (filterStatus === 'pending' && t.completed) return false;
    if (filterStatus === 'done' && !t.completed) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!user || !form.title.trim()) return;
    setSaving(true);
    const { data } = await createTask({
      user_id: user.id,
      title: form.title,
      due_date: form.due_date || undefined,
      priority: form.priority,
      subject_id: form.subject_id || undefined,
    });
    if (data) {
      const subj = subjects.find(s => s.id === data.subject_id);
      setTasks(prev => [{ ...data, subject: subj } as Task, ...prev]);
    }
    setForm({ title: '', due_date: '', priority: 'medium', subject_id: '' });
    setShowModal(false);
    setSaving(false);
  };

  const toggleComplete = async (task: Task) => {
    const { data } = await updateTask(task.id, { completed: !task.completed });
    if (data) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const pending = tasks.filter(t => !t.completed).length;
  const done = tasks.filter(t => t.completed).length;

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Tasks</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>{pending} pending · {done} completed</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto', fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="done">Completed</option>
        </select>
        <select className="input" style={{ width: 'auto', fontSize: 13 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', fontSize: 13 }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="all">All subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-faint)' }}>
            No tasks match your filters.
          </div>
        )}
        {filtered.map(task => (
          <div key={task.id} className="animate-fade-in" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 16px', borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            opacity: task.completed ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}>
            {/* Checkbox */}
            <button onClick={() => toggleComplete(task)} style={{
              width: 20, height: 20, borderRadius: 6,
              border: `2px solid ${task.completed ? 'var(--accent)' : 'var(--border)'}`,
              background: task.completed ? 'var(--accent)' : 'transparent',
              cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, transition: 'all 0.15s',
            }}>
              {task.completed && '✓'}
            </button>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{
                fontSize: 14, fontWeight: 500,
                textDecoration: task.completed ? 'line-through' : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{task.title}</p>
              {task.due_date && (
                <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                  Due {new Date(task.due_date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>

            {task.subject && (
              <span style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 99,
                background: (task.subject as any).color + '22',
                color: (task.subject as any).color,
                border: `1px solid ${(task.subject as any).color}44`,
                whiteSpace: 'nowrap',
              }}>{(task.subject as any).name}</span>
            )}

            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 99,
              color: PRIORITY_COLOR[task.priority],
              background: PRIORITY_COLOR[task.priority] + '18',
              border: `1px solid ${PRIORITY_COLOR[task.priority]}30`,
              fontWeight: 500,
            }}>{PRIORITY_LABEL[task.priority]}</span>

            <button onClick={() => handleDelete(task.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-faint)', fontSize: 16, padding: 4,
              borderRadius: 6, transition: 'color 0.15s',
            }}>×</button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)',
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="surface animate-fade-in" style={{ width: 420, padding: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 20 }}>New Task</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Title *</label>
                <input className="input" placeholder="e.g. Read chapter 4" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Due date</label>
                <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Subject (optional)</label>
                <select className="input" value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={saving || !form.title.trim()}>
                  {saving ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
