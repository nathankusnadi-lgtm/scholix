'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getTasks, getResults, getSubjects } from '@/lib/supabase';
import type { Task, Result, Subject } from '@/types';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="surface animate-fade-in" style={{ padding: '20px 22px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 600, color: color ?? 'var(--text)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (!user) return;
    getTasks(user.id).then(({ data }) => data && setTasks(data));
    getResults(user.id).then(({ data }) => data && setResults(data));
    getSubjects(user.id).then(({ data }) => data && setSubjects(data));
  }, [user]);

  const pending = tasks.filter(t => !t.completed).length;
  const overdue = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length;
  const avgGrade = results.length
    ? Math.round(results.reduce((s, r) => s + (r.score / r.max_score) * 100, 0) / results.length)
    : null;
  const upcoming = tasks
    .filter(t => !t.completed && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile?.display_name?.split(' ')[0] ?? 'there';

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {greeting}, {name} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Subjects" value={subjects.length} sub="active this term" />
        <StatCard label="Pending tasks" value={pending} sub={overdue > 0 ? `${overdue} overdue` : 'all on track'} color={overdue > 0 ? 'var(--danger)' : undefined} />
        <StatCard label="Avg grade" value={avgGrade !== null ? `${avgGrade}%` : '—'} sub={results.length > 0 ? `${results.length} results` : 'no results yet'} color={avgGrade !== null ? (avgGrade >= 70 ? 'var(--success)' : avgGrade >= 50 ? 'var(--accent-2)' : 'var(--danger)') : undefined} />
        <StatCard label="Today" value={new Date().getDate()} sub={new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming tasks */}
        <div className="surface" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>Upcoming Tasks</h2>
            <Link href="/tasks" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>No upcoming tasks 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: task.priority === 'high' ? 'var(--danger)' : task.priority === 'medium' ? 'var(--accent-2)' : 'var(--success)',
                  }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                    {task.due_date && (
                      <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>
                        Due {new Date(task.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  {task.subject && (
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 99,
                      background: task.subject.color + '22',
                      color: task.subject.color,
                      border: `1px solid ${task.subject.color}44`,
                    }}>{task.subject.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subjects overview */}
        <div className="surface" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>Subjects</h2>
            <Link href="/subjects" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Manage →</Link>
          </div>
          {subjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text-faint)', fontSize: 14, marginBottom: 12 }}>No subjects yet</p>
              <Link href="/subjects" className="btn btn-primary" style={{ fontSize: 13 }}>Create your first subject</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subjects.map(subj => (
                <Link key={subj.id} href={`/subjects/${subj.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  textDecoration: 'none', color: 'var(--text)',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 18 }}>{subj.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{subj.name}</span>
                  <div style={{ flex: 1 }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: subj.color }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
