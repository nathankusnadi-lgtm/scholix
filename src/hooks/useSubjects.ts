'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getSubjects, createSubject, deleteSubject } from '@/lib/supabase';
import type { Subject } from '@/types';

export function useSubjects() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await getSubjects(user.id);
    if (data) setSubjects(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (name: string, color: string, icon: string) => {
    if (!user) return null;
    const { data } = await createSubject({ user_id: user.id, name, color, icon });
    if (data) setSubjects(prev => [...prev, data]);
    return data;
  };

  const remove = async (id: string) => {
    await deleteSubject(id);
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  return { subjects, loading, refresh, add, remove };
}
