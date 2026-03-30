'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/supabase';
import type { Task, Priority } from '@/types';

export function useTasks(subjectId?: string) {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getTasks(user.id);
    if (data) {
      const filtered = subjectId ? data.filter((t: Task) => t.subject_id === subjectId) : data;
      setTasks(filtered as Task[]);
    }
    setLoading(false);
  }, [user, subjectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (title: string, opts: { due_date?: string; priority?: Priority; subject_id?: string } = {}) => {
    if (!user) return null;
    const { data } = await createTask({ user_id: user.id, title, priority: opts.priority ?? 'medium', ...opts });
    if (data) setTasks(prev => [data as Task, ...prev]);
    return data;
  };

  const toggle = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const { data } = await updateTask(id, { completed: !task.completed });
    if (data) setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const remove = async (id: string) => {
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  return { tasks, pending, completed, loading, refresh, add, toggle, remove };
}
