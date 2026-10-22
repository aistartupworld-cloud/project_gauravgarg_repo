import { useState } from 'react';
import { api } from '../api';
import { useAction, useLoad } from '../hooks';
import { Card, Empty, ErrorNote, Field, Loading, StateBadge, Stepper, Timeline } from '../components/ui';
import { AUDIT_STATES, SEVERITIES, type Audit, type Control, type Finding, type Me, type User } from '../types';
import { FindingsTable } from './FindingsTable';

export function AuditDetailPage({ me, auditId }: { me: Me; auditId: string }) {
  const audit = useLoad(() => api<Audit>(`/audits/${auditId}`), [auditId]);
  const findings = useLoad(() => api<Finding[]>(`/findings?auditId=${encodeURIComponent(auditId)}`), [auditId]);
  const reload = () => (audit.reload(), findings.reload());
  const a = audit.data;

  if (audit.error) return <p className="error">{audit.error}</p>;
  if (!a) return <Loading what="audit" />;
  const next = AUDIT_STATES[AUDIT_STATES.indexOf(a.state) + 1];
  const canTransition = me.role === 'AUDITOR' || me.role === 'ADMIN';
  const canRecord = me.role === 'AUDITOR' && (a.state === 'IN_PROGRESS' || a.state === 'FINDINGS_RECORDED');

  return (
    <div className="page">
      <p className="crumbs">
        <a href="#/audits">Audits</a> / {a.auditId}
      </p>
      <h1>
        {a.title} <StateBadge state={a.state} />
      </h1>
      <p className="muted">
        {a.frameworkCode} · target end {a.targetEndDate} · scope {a.scope.length ? a.scope.join(', ') : 'all published controls'}
      </p>
      <Stepper state={a.state} />
      {canTransition && next && <TransitionForm auditId={a.auditId} to={next} onDone={reload} />}

      <div className="grid-2">
        <Card title="Findings">
          {!findings.data ? <Loading what="findings" /> : findings.data.length === 0 ? <Empty>No findings recorded.</Empty> : <FindingsTable findings={findings.data} />}
        </Card>
        <Card title="Lifecycle history">
          <Timeline events={a.events ?? []} />
        </Card>
      </div>
      {canRecord && <RecordFindingForm audit={a} onDone={reload} />}
    </div>
  );
}

function TransitionForm({ auditId, to, onDone }: { auditId: string; to: string; onDone: () => void }) {
  const [note, setNote] = useState('');
  const { busy, error, run } = useAction();
  return (
    <form
      className="inline-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await run(() => api(`/audits/${auditId}/transition`, { method: 'POST', body: { to, ...(note && { note }) } }))) {
          setNote('');
          onDone();
        }
      }}
    >
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Transition note" />
      <button type="submit" className="primary" disabled={busy} data-testid="audit-advance">
        Move to {to.replace(/_/g, ' ')}
      </button>
      <ErrorNote message={error} />
    </form>
  );
}

function RecordFindingForm({ audit, onDone }: { audit: Audit; onDone: () => void }) {
  const controls = useLoad(() => api<Control[]>(`/controls?framework=${audit.frameworkCode}`), [audit.frameworkCode]);
  const owners = useLoad(() => api<User[]>('/users?role=OWNER'));
  const empty = { controlId: '', severity: '', title: '', description: '', evidenceRef: '', ownerId: '' };
  const [form, setForm] = useState(empty);
  const { busy, error, fields, run } = useAction();
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inScope = (controls.data ?? []).filter((c) => audit.scope.length === 0 || audit.scope.includes(c.controlId));

  return (
    <Card title="Record a finding" testId="record-finding">
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          const body = { ...form, ownerId: Number(form.ownerId) || undefined, severity: form.severity || undefined };
          if (await run(() => api(`/audits/${audit.auditId}/findings`, { method: 'POST', body }))) {
            setForm(empty);
            onDone();
          }
        }}
      >
        <Field label="Control" error={fields.controlId}>
          <select value={form.controlId} onChange={set('controlId')} data-testid="finding-control">
            <option value="">Choose…</option>
            {inScope.map((c) => (
              <option key={c.controlId} value={c.controlId}>
                {c.controlId} · {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Severity (defaults to the control's)" error={fields.severity}>
          <select value={form.severity} onChange={set('severity')} data-testid="finding-severity">
            <option value="">Control default</option>
            {SEVERITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Owner" error={fields.ownerId}>
          <select value={form.ownerId} onChange={set('ownerId')} data-testid="finding-owner">
            <option value="">Choose…</option>
            {owners.data?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title" error={fields.title}>
          <input value={form.title} onChange={set('title')} data-testid="finding-title" />
        </Field>
        <Field label="Work-paper reference" error={fields.evidenceRef}>
          <input value={form.evidenceRef} onChange={set('evidenceRef')} data-testid="finding-ref" />
        </Field>
        <Field label="Description" error={fields.description}>
          <textarea value={form.description} onChange={set('description')} rows={3} data-testid="finding-description" />
        </Field>
        <div className="actions wide">
          <button type="submit" className="primary" disabled={busy} data-testid="finding-create">
            Record finding
          </button>
        </div>
      </form>
      <ErrorNote message={error} />
    </Card>
  );
}
