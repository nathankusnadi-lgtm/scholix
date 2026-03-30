'use client';

import { useEffect, useRef, useState } from 'react';

const MODES = [
  { label: 'Focus', duration: 25 * 60 },
  { label: 'Short Break', duration: 5 * 60 },
  { label: 'Long Break', duration: 15 * 60 },
];

export default function ToolsPage() {
  // ── Clock ──
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Pomodoro ──
  const [modeIdx, setModeIdx] = useState(0);
  const [remaining, setRemaining] = useState(MODES[0].duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const mode = MODES[modeIdx];
  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');
  const progress = 1 - remaining / mode.duration;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            setRunning(false);
            if (modeIdx === 0) setSessions(s => s + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, modeIdx]);

  const handleMode = (idx: number) => {
    setModeIdx(idx);
    setRemaining(MODES[idx].duration);
    setRunning(false);
  };

  const reset = () => {
    setRemaining(mode.duration);
    setRunning(false);
  };

  // SVG circle
  const R = 70;
  const circumference = 2 * Math.PI * R;
  const strokeDash = circumference * (1 - progress);

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Time Tools</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Stay focused and manage your study time</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Live Clock */}
        <div className="surface" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Live Clock</p>
          <p style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 52,
            fontWeight: 300,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            lineHeight: 1,
          }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {time.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {['UTC', 'EST', 'JST'].map(tz => {
              const tzTime = new Date().toLocaleTimeString('en', { timeZone: tz === 'EST' ? 'America/New_York' : tz === 'JST' ? 'Asia/Tokyo' : 'UTC', hour: '2-digit', minute: '2-digit' });
              return (
                <div key={tz} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em' }}>{tz}</p>
                  <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{tzTime}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pomodoro */}
        <div className="surface" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>Pomodoro Timer</p>

          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 8, padding: 3 }}>
            {MODES.map((m, i) => (
              <button key={m.label} onClick={() => handleMode(i)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: modeIdx === i ? 'var(--surface)' : 'transparent',
                color: modeIdx === i ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: modeIdx === i ? 'var(--shadow)' : 'none',
                transition: 'all 0.15s',
              }}>{m.label}</button>
            ))}
          </div>

          {/* SVG Circle Timer */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={176} height={176} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={88} cy={88} r={R} fill="none" stroke="var(--border)" strokeWidth={6} />
              <circle
                cx={88} cy={88} r={R}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDash}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute', textAlign: 'center',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {minutes}:{seconds}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>{mode.label}</p>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }} onClick={reset}>↺ Reset</button>
            <button className="btn btn-primary" style={{ fontSize: 13, padding: '8px 24px' }} onClick={() => setRunning(r => !r)}>
              {running ? '⏸ Pause' : '▶ Start'}
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Sessions completed today: <strong style={{ color: 'var(--text)' }}>{sessions}</strong>
          </p>
        </div>
      </div>

      {/* Study tips */}
      <div className="surface" style={{ padding: '20px 24px', marginTop: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Pomodoro Technique</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { step: '1', text: 'Choose a task to work on' },
            { step: '2', text: 'Focus for 25 minutes straight' },
            { step: '3', text: 'Take a 5-minute short break' },
            { step: '4', text: 'Every 4 sessions, take a long break' },
          ].map(item => (
            <div key={item.step} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-soft)',
                color: 'var(--accent)', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
              }}>{item.step}</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
