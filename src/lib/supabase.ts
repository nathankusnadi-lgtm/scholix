import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Scholix] Supabase env vars missing. Copy .env.local.example to .env.local and fill in your credentials.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// ── Auth helpers ──────────────────────────────────────────

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

// ── Profile ───────────────────────────────────────────────

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const upsertProfile = async (profile: Partial<{ id: string; display_name: string; theme: string; font: string }>) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single();
  return { data, error };
};

// ── Subjects ──────────────────────────────────────────────

export const getSubjects = async (userId: string) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  return { data, error };
};

export const createSubject = async (subject: { user_id: string; name: string; color: string; icon: string }) => {
  const { data, error } = await supabase
    .from('subjects')
    .insert(subject)
    .select()
    .single();
  return { data, error };
};

export const deleteSubject = async (id: string) => {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  return { error };
};

// ── Notes ─────────────────────────────────────────────────

export const getNotes = async (subjectId: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('subject_id', subjectId)
    .order('updated_at', { ascending: false });
  return { data, error };
};

export const upsertNote = async (note: { id?: string; subject_id: string; user_id: string; title: string; content: object }) => {
  const { data, error } = await supabase
    .from('notes')
    .upsert({ ...note, updated_at: new Date().toISOString() })
    .select()
    .single();
  return { data, error };
};

export const deleteNote = async (id: string) => {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  return { error };
};

// ── Tasks ─────────────────────────────────────────────────

export const getTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, subject:subjects(id, name, color)')
    .eq('user_id', userId)
    .order('due_date', { ascending: true });
  return { data, error };
};

export const createTask = async (task: {
  user_id: string;
  subject_id?: string;
  title: string;
  due_date?: string;
  priority: string;
}) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  return { data, error };
};

export const updateTask = async (id: string, updates: Partial<{ title: string; completed: boolean; due_date: string; priority: string }>) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

export const deleteTask = async (id: string) => {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  return { error };
};

// ── Results ───────────────────────────────────────────────

export const getResults = async (userId: string) => {
  const { data, error } = await supabase
    .from('results')
    .select('*, subject:subjects(id, name, color)')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  return { data, error };
};

export const createResult = async (result: {
  user_id: string;
  subject_id: string;
  title: string;
  score: number;
  max_score: number;
  weight: number;
  date: string;
}) => {
  const { data, error } = await supabase
    .from('results')
    .insert(result)
    .select()
    .single();
  return { data, error };
};

export const deleteResult = async (id: string) => {
  const { error } = await supabase.from('results').delete().eq('id', id);
  return { error };
};

// ── Resources ─────────────────────────────────────────────

export const uploadResource = async (file: File, userId: string, subjectId: string) => {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${subjectId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('resources')
    .upload(path, file);
  if (error) return { data: null, error };

  const { data: urlData } = supabase.storage.from('resources').getPublicUrl(path);

  const { data: resource, error: dbError } = await supabase
    .from('resources')
    .insert({
      subject_id: subjectId,
      user_id: userId,
      name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      size: file.size,
    })
    .select()
    .single();

  return { data: resource, error: dbError };
};

export const getResources = async (subjectId: string) => {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// ── Practice Questions ────────────────────────────────────

export const getPracticeQuestions = async (subjectId: string) => {
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createPracticeQuestion = async (q: {
  subject_id: string;
  user_id: string;
  question: string;
  answer: string;
  difficulty: string;
}) => {
  const { data, error } = await supabase
    .from('practice_questions')
    .insert(q)
    .select()
    .single();
  return { data, error };
};
