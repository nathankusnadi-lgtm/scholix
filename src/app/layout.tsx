import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Scholix — Your Study Workspace',
  description: 'AI-powered school planner with notes, tasks, results, and more',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-font="default">
      <body>{children}</body>
    </html>
  );
}
