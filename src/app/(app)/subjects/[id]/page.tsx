'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getSubjects, getNotes, upsertNote, deleteNote, getResources, uploadResource, getPracticeQuestions, getTasks, createTask } from '@/lib/supabase';
import { summarizeNotes, generatePracticeQuestions, explainConcept } from '@/lib/ai';
import type { Subject, Note, Resource, PracticeQuestion, Task } from '@/types';

type Tab = 'notes' | 'resources' | 'practice' | 'tasks' | 'ai';

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400,
      border: 'none', cursor: 'pointer',
      background: active ? 'var(--accent-soft)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      transition: 'all 0.15s',
    }}>{label}</button>
  );
}

export default function SubjectPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { user } = useAuthStore();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [tab, setTab] = useState<Tab>('notes');

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [uploading, setUploading] = useState(false);

  // Practice
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');

  // AI
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'summarize' | 'questions' | 'explain'>('summarize');

  useEffect(() => {
    if (!user || !id) return;
    getSubjects(user.id).then(({ data }) => {
      const s = data?.find(s => s.id === id);
      if (s) setSubject(s);
    });
    getNotes(id).then(({ data }) => {
      if (data) {
        setNotes(data);
        if (data.length > 0) {
          setActiveNote(data[0]);
          setNoteTitle(data[0].title);
          setNoteContent(typeof data[0].content === 'string' ? data[0].content : JSON.stringify(data[0].content));
        }
      }
    });
    getResources(id).then(({ data }) => data && setResources(data));
    getPracticeQuestions(id).then(({ data }) => data && setQuestions(data));
    getTasks(user.id).then(({ data }) => data && setTasks((data as Task[]).filter(t => t.subject_id === id)));
  }, [user, id]);

  const handleSaveNote = async () => {
    if (!user || !noteTitle.trim()) return;
    setSavingNote(true);
    const { data } = await upsertNote({
      id: activeNote?.id,
      subject_id: id,
      user_id: user.id,
      title: noteTitle,
      content: { text: noteContent },
    });
    if (data) {
      setActiveNote(data);
      setNotes(prev => {
        const idx = prev.findIndex(n => n.id === data.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = data; return next; }
        return [data, ...prev];
      });
    }
    setSavingNote(false);
  };

  const handleNewNote = () => {
    setActiveNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setNoteTitle(note.title);
    setNoteContent(typeof note.content === 'object' ? (note.content as any).text ?? '' : note.content);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (activeNote?.id === noteId) { setActiveNote(null); setNoteTitle(''); setNoteContent(''); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    setUploading(true);
    for (const file of Array.from(e.target.files)) {
      const { data } = await uploadResource(file, user.id, id);
      if (data) setResources(prev => [data, ...prev]);
    }
    setUploading(false);
  };

  const handleAddTask = async () => {
    if (!user || !newTask.trim()) return;
    const { data } = await createTask({ user_id: user.id, subject_id: id, title: newTask, priority: 'medium' });
    if (data) setTasks(prev => [data as Task, ...prev]);
    setNewTask('');
  };

  const handleAI = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const notesText = notes.map(n => `${n.title}\n${(n.content as any)?.text ?? ''}`).join('\n\n');
      if (aiMode === 'summarize') {
        const result = await summarizeNotes(notesText || `Notes for ${subject?.name}`);
        setAiResult(result);
      } else if (aiMode === 'questions') {
        const qs = await generatePracticeQuestions(subject?.name ?? 'topic', notesText || `${subject?.name} fundamentals`, 5);
        setAiResult(qs.map((q, i) => `Q${i + 1}: ${q.question}\nA: ${q.answer}`).join('\n\n'));
      } else {
        const result = await explainConcept(aiQuery || subject?.name ?? 'topic', notesText);
        setAiResult(result);
      }
    } catch {
      setAiResult('Failed to get AI response. Please try again.');
    }
    setAiLoading(false);
  };

  if (!subject) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Loading subject…</div>;

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 4, height: 36, borderRadius: 2, background: subject.color, flexShrink: 0 }} />
        <span style={{ fontSize: 28 }}>{subject.icon}</span>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{subject.name}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 2, marginBottom: 20 }}>
        {(['notes', 'resources', 'practice', 'tasks', 'ai'] as Tab[]).map(t => (
          <TabButton key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      {/* Notes Tab */}
      {tab === 'notes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, height: 560 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={handleNewNote}>+ New Note</button>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {notes.map(note => (
                <div key={note.id} onClick={() => handleSelectNote(note)} style={{
                  padding: '9px 11px', borderRadius: 8, cursor: 'pointer',
                  background: activeNote?.id === note.id ? 'var(--accent-soft)' : 'var(--surface-2)',
                  border: `1px solid ${activeNote?.id === note.id ? 'var(--accent)40' : 'var(--border)'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
                      {new Date(note.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDeleteNote(note.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 14, padding: 2 }}>×</button>
                </div>
              ))}
              {notes.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-faint)', padding: '8px 4px' }}>No notes yet</p>}
            </div>
          </div>
          <div className="surface" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="input" placeholder="Note title…" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, boxShadow: 'none', padding: '4px 0' }} />
              <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={handleSaveNote} disabled={savingNote}>
                {savingNote ? 'Saving…' : 'Save'}
              </button>
            </div>
            <textarea
              placeholder="Start writing your notes here…"
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              style={{
                flex: 1, padding: 16, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.7,
                resize: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {tab === 'resources' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'inline-block' }}>
              <span className="btn btn-primary" style={{ fontSize: 13, cursor: 'pointer' }}>
                {uploading ? 'Uploading…' : '+ Upload Files'}
              </span>
              <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
          </div>
          {resources.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-faint)' }}>
              No resources yet. Upload PDFs or images.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {resources.map(r => (
                <a key={r.id} href={r.file_url} target="_blank" rel="noopener noreferrer" style={{
                  padding: '16px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--surface)', textDecoration: 'none', color: 'var(--text)',
                  display: 'block', transition: 'box-shadow 0.15s',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>
                    {r.file_type.includes('pdf') ? '📄' : r.file_type.includes('image') ? '🖼️' : '📁'}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>{(r.size / 1024).toFixed(0)} KB</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Practice Tab */}
      {tab === 'practice' && (
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
            Use the AI tab to generate practice questions, or add them manually.
          </p>
          {questions.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-faint)' }}>
              No practice questions yet. Generate some with AI!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {questions.map(q => (
                <div key={q.id} className="surface" style={{ padding: '16px 18px' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Q: {q.question}</p>
                  {revealedIds.has(q.id) ? (
                    <div style={{ padding: '10px 12px', background: 'var(--accent-soft)', borderRadius: 8, fontSize: 14, color: 'var(--text)' }}>
                      A: {q.answer}
                    </div>
                  ) : (
                    <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setRevealedIds(s => new Set([...s, q.id]))}>
                      Reveal Answer
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input className="input" placeholder="Add a task for this subject…" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} />
            <button className="btn btn-primary" onClick={handleAddTask} disabled={!newTask.trim()}>Add</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.length === 0 && <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>No tasks for this subject.</p>}
            {tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, flex: 1, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-faint)' : 'var(--text)' }}>{task.title}</span>
                {task.due_date && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{new Date(task.due_date).toLocaleDateString()}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Tab */}
      {tab === 'ai' && (
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[
              { value: 'summarize', label: '📝 Summarize Notes' },
              { value: 'questions', label: '❓ Generate Questions' },
              { value: 'explain', label: '💡 Explain Concept' },
            ].map(m => (
              <button key={m.value} onClick={() => setAiMode(m.value as any)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer',
                background: aiMode === m.value ? 'var(--accent)' : 'var(--surface-2)',
                color: aiMode === m.value ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${aiMode === m.value ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}>{m.label}</button>
            ))}
          </div>

          {aiMode === 'explain' && (
            <input className="input" placeholder="What concept do you want explained?" value={aiQuery} onChange={e => setAiQuery(e.target.value)} style={{ marginBottom: 12 }} />
          )}

          <button className="btn btn-primary" onClick={handleAI} disabled={aiLoading} style={{ marginBottom: 16 }}>
            {aiLoading ? 'Thinking…' : '✨ Generate'}
          </button>

          {aiResult && (
            <div className="surface" style={{ padding: '16px 18px', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7 }}>
              {aiResult}
            </div>
          )}

          {!aiResult && !aiLoading && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 14 }}>
              Use AI to summarize your notes, generate practice questions, or explain concepts.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
