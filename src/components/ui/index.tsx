import React from 'react';

// ── Card ───────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, style, className, onClick }: CardProps) {
  return (
    <div
      className={`surface ${className ?? ''}`}
      style={{ padding: '20px 22px', cursor: onClick ? 'pointer' : undefined, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'soft';
}

export function Badge({ children, color = 'var(--accent)', variant = 'soft' }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontWeight: 500,
      padding: '2px 8px', borderRadius: 99,
      background: variant === 'solid' ? color : color + '20',
      color: variant === 'solid' ? '#fff' : color,
      border: `1px solid ${color}35`,
    }}>
      {children}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 440 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="surface animate-fade-in" style={{ width, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function Button({ variant = 'ghost', size = 'md', children, style, ...rest }: ButtonProps) {
  const variantStyle: React.CSSProperties =
    variant === 'primary' ? { background: 'var(--accent)', color: '#fff', border: '1px solid transparent' } :
    variant === 'danger'  ? { background: 'var(--danger)', color: '#fff', border: '1px solid transparent' } :
    { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' };

  const sizeStyle: React.CSSProperties =
    size === 'sm' ? { padding: '5px 11px', fontSize: 12 } : { padding: '8px 16px', fontSize: 14 };

  return (
    <button
      className="btn"
      style={{ ...variantStyle, ...sizeStyle, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── EmptyState ─────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div style={{ padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{description}</p>}
      {action}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}
