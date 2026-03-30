import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeName, FontName } from '@/types';

interface ThemeState {
  theme: ThemeName;
  font: FontName;
  setTheme: (theme: ThemeName) => void;
  setFont: (font: FontName) => void;
  applyToDOM: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      font: 'default',
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
        set({ theme });
      },
      setFont: (font) => {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-font', font);
        }
        set({ font });
      },
      applyToDOM: () => {
        if (typeof document === 'undefined') return;
        const { theme, font } = get();
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-font', font);
      },
    }),
    {
      name: 'scholix-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const themeOptions: Array<{ value: ThemeName; label: string; emoji: string; preview: string }> = [
  { value: 'light',  label: 'Ivory',   emoji: '☀️',  preview: '#f8f7f4' },
  { value: 'dark',   label: 'Obsidian',emoji: '🌑',  preview: '#1e1c1a' },
  { value: 'sakura', label: 'Sakura',  emoji: '🌸',  preview: '#fdf6f8' },
  { value: 'nature', label: 'Nature',  emoji: '🌿',  preview: '#f4f7f2' },
  { value: 'ocean',  label: 'Ocean',   emoji: '🌊',  preview: '#f0f6fa' },
  { value: 'ember',  label: 'Ember',   emoji: '🔥',  preview: '#faf6f2' },
];

export const fontOptions: Array<{ value: FontName; label: string; sample: string }> = [
  { value: 'default', label: 'DM Sans',   sample: 'Clean & modern' },
  { value: 'serif',   label: 'Lora',      sample: 'Elegant & literary' },
  { value: 'mono',    label: 'DM Mono',   sample: 'Technical & precise' },
  { value: 'rounded', label: 'Nunito',    sample: 'Friendly & soft' },
];
