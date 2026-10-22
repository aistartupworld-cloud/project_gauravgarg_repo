import type { ReactNode } from 'react';
import type { AuditState, FindingState, Severity } from '../types';
import { AUDIT_STATES } from '../types';

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`badge sev-${severity.toLowerCase()}`}>{severity}</span>;
}

export function StateBadge({ state }: { state: FindingState | AuditState }) {
  return <span className={`badge state-${state.toLowerCase().replace(/_/g, '-')}`}>{state.replace(/_/g, ' ')}</span>;
}

export function EscalatedBadge({ days }: { days: number }) {
  return (
    <span className="badge escalated" data-testid="escalated-badge" title={`${days} day(s) past due`}>
      ESCALATED · {days}d
    </span>
  );
}

export function Card({ title, children, actions, testId }: { title?: string; children: ReactNode; actions?: ReactNode; testId?: string }) {
  return (
    <section className="card" data-testid={testId}>
      {(title || actions) && (
        <header className="card-head">
          {title && <h2>{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, tone, testId }: { label: string; value: number | string; tone?: 'warn' | 'ok'; testId?: string }) {
  return (
    <div className={`stat ${tone ?? ''}`} data-testid={testId}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function Bar({ pct, label }: { pct: number; label?: string }) {
  return (
    <div className="bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function Stepper({ state }: { state: AuditState }) {
  const current = AUDIT_STATES.indexOf(state);
  return (
    <ol className="stepper" aria-label="Audit lifecycle">
      {AUDIT_STATES.map((s, i) => (
        <li key={s} className={i < current ? 'done' : i === current ? 'current' : ''} aria-current={i === current ? 'step' : undefined}>
          {s.replace(/_/g, ' ')}
        </li>
      ))}
    </ol>
  );
}

export function Timeline({ events }: { events: Array<{ seq: number; fromState: string | null; toState: string; actor: string; at: string; note?: string | null; comment?: string | null }> }) {
  return (
    <ol className="timeline" data-testid="timeline">
      {events.map((e) => (
        <li key={e.seq}>
          <div>
            <strong>{e.fromState ? `${e.fromState.replace(/_/g, ' ')} → ` : ''}{e.toState.replace(/_/g, ' ')}</strong>
            <span className="muted"> by {e.actor} · {e.at.slice(0, 16).replace('T', ' ')} UTC</span>
          </div>
          {(e.comment || e.note) && <p className="quote">{e.comment ?? e.note}</p>}
        </li>
      ))}
    </ol>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  return message ? (
    <p className="error" role="alert" data-testid="form-error">
      {message}
    </p>
  ) : null;
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="error">{error}</small>}
    </label>
  );
}

export function Loading({ what }: { what: string }) {
  return <p className="muted">Loading {what}…</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
