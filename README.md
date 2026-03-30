# Scholix — AI-Powered School Planner

A modern, aesthetic study workspace with AI features, subject management, task tracking, grade analysis, and time tools.

## ✨ Features

- **Authentication** — Supabase Auth with per-user data isolation
- **Subjects** — Color-coded subjects with notes, resources, practice questions, and tasks
- **Tasks** — Global task manager with priority, due dates, and subject filtering
- **Results** — Grade tracker with weighted averages and progress charts
- **Tools** — Live clock and Pomodoro timer
- **AI** — Summarize notes, generate practice questions, explain concepts (Claude API)
- **Themes** — 6 preset themes: Ivory, Obsidian, Sakura, Nature, Ocean, Ember
- **Fonts** — 4 font options: DM Sans, Lora, DM Mono, Nunito

---

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone <your-repo>
cd scholix
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In **SQL Editor**, run the full contents of `supabase/schema.sql`
3. In **Storage**, create a bucket called `resources` (set to public)
4. Copy your project URL and anon key from **Settings → API**

### 3. Set up Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Keep this server-side only (never expose it in the browser)

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login + Signup pages
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/            # Protected app shell
│   │   ├── layout.tsx    # Auth guard + AppShell
│   │   ├── dashboard/
│   │   ├── subjects/
│   │   │   └── [id]/     # Subject detail page
│   │   ├── tasks/
│   │   ├── results/
│   │   ├── tools/
│   │   └── settings/
│   ├── api/
│   │   └── ai/route.ts   # Anthropic API route (server-side)
│   ├── layout.tsx        # Root layout + CSS import
│   └── page.tsx          # Redirects to /login
│
├── components/
│   ├── layout/
│   │   └── AppShell.tsx  # Sidebar + topbar
│   └── ui/
│       └── index.tsx     # Card, Badge, Modal, Button, etc.
│
├── hooks/
│   ├── useAuth.ts
│   ├── useSubjects.ts
│   └── useTasks.ts
│
├── lib/
│   ├── supabase.ts       # Supabase client + typed queries
│   └── ai.ts             # Anthropic helper functions
│
├── store/
│   ├── authStore.ts      # Zustand auth state
│   └── themeStore.ts     # Zustand theme + font state
│
├── styles/
│   └── globals.css       # CSS variables, themes, utilities
│
└── types/
    └── index.ts          # TypeScript interfaces
```

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User settings, theme, font, display name |
| `subjects` | Subject cards with color + icon |
| `notes` | Rich text notes per subject |
| `resources` | File uploads (stored in Supabase Storage) |
| `tasks` | Tasks with priority, due date, subject link |
| `results` | Exam scores with weight for grade calculation |
| `practice_questions` | Q&A cards per subject |

All tables use Row Level Security (RLS) — users can only access their own data.

---

## 🎨 Themes

| Theme | Vibe |
|-------|------|
| Ivory (Light) | Clean, warm off-white |
| Obsidian (Dark) | Deep dark with purple accent |
| Sakura | Soft pink with rose accents |
| Nature | Forest greens and earthy tones |
| Ocean | Cool blues with teal accents |
| Ember | Warm amber and burnt orange |

---

## 🤖 AI Features

All AI calls go through `/api/ai` (a Next.js server route) to keep your API key secure.

- **Summarize notes** — Condenses your notes into key points
- **Generate practice questions** — Creates Q&A pairs from your notes
- **Explain concept** — Deep-dives into any topic with your notes as context

---

## 🔧 Extending the App

### Add a new theme
1. Add a CSS block in `globals.css` under `[data-theme="yourtheme"]`
2. Add it to the `themeOptions` array in `store/themeStore.ts`

### Add a new AI feature
1. Add a helper function in `lib/ai.ts`
2. The function calls `/api/ai` with your prompt
3. Use it in any component

### Add rich text to notes
Install [Tiptap](https://tiptap.dev/):
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```
Replace the `<textarea>` in `subjects/[id]/page.tsx` with a Tiptap `<EditorContent>` component.

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` 14 | App Router, API routes, SSR |
| `@supabase/supabase-js` | Database, auth, storage |
| `@anthropic-ai/sdk` | Claude AI (server-side) |
| `zustand` | Lightweight global state |
| `tailwindcss` | Utility CSS (minimal usage) |

---

## 🚢 Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

Make sure to also add your Supabase project URL to the allowed origins in **Supabase → Authentication → URL Configuration**.
