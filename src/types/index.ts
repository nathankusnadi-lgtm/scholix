export type ThemeName = 'sakura' | 'nature' | 'dark' | 'light' | 'ocean' | 'ember';

export type FontName = 'default' | 'serif' | 'mono' | 'rounded';

export type Priority = 'low' | 'medium' | 'high';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  theme: ThemeName;
  font: FontName;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Note {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  content: object; // Tiptap JSON
  updated_at: string;
  created_at: string;
}

export interface Resource {
  id: string;
  subject_id: string;
  user_id: string;
  name: string;
  file_url: string;
  file_type: string;
  size: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id?: string;
  title: string;
  due_date?: string;
  priority: Priority;
  completed: boolean;
  created_at: string;
  subject?: Subject; // joined
}

export interface Result {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  score: number;
  max_score: number;
  weight: number;
  date: string;
  created_at: string;
  subject?: Subject; // joined
}

export interface PracticeQuestion {
  id: string;
  subject_id: string;
  user_id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}
