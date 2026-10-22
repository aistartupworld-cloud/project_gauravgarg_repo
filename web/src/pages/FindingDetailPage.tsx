import { useState } from 'react';
import { api } from '../api';
import { useAction, useLoad } from '../hooks';
import { Card, Empty, ErrorNote, EscalatedBadge, Field, Loading, SeverityBadge, StateBadge, Timeline } from '../components/ui';
import type { Finding, Me } from '../types';

export function FindingDetailPage({ me, findingId }: { me: Me; findingId: string }) {
  const { data: f, error, reload } = useLoad(() => api<Finding>(`/findings/${findingId}`), [findingId]);
  if (error) return <p className="error">{error}</p>;
  if (!f) return <Loading what="finding" />;
  const canSubmit = me.role === 'OWNER' && (f.state === 'OPEN' || f.state === 'RE_OPEN');
  const canReview = me.role === 'REVIEWER' && f.state === 'AWAITING_REVIEW';

  return (
    <div className="page">
      <p className="crumbs">
        <a href={me.role === 'OWNER' ? '#/my-findings' : '#/findings'}>Findings</a> / {f.findingId}
      </p>
      <h1>
        {f.title} <SeverityBadge severity={f.severity} /> <StateBadge state={f.state} />
      </h1>
      <dl className="facts" data-testid="finding-facts">
        <div>
          <dt>Control</dt>
          <dd>
            {f.controlId} v{f.controlVersion} ({f.frameworkCode}) · {f.controlTitle}
          </dd>
        </div>
        <div>
          <dt>Audit</dt>
          <dd>{me.role === 'OWNER' ? f.auditId : <a href={`#/audits/${f.auditId}`}>{f.auditId}</a>}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{f.ownerName}</dd>
        </div>
        <div>
          <dt>Detected</dt>
          <dd>{f.detectedOn}</dd>
        </div>
        <div>
          <dt>Due (SLA v{f.slaRuleSetVersion})</dt>
          <dd data-testid="due-date">
            {f.dueDate} {f.escalated && <EscalatedBadge days={f.daysOverdue} />}
          </dd>
        </div>
        <div>
          <dt>Work paper</dt>
          <dd>{f.evidenceRef}</dd>
        </div>
      </dl>
      <p>{f.description}</p>

      <div className="grid-2">
        <Card title="Evidence">
          {!f.evidence?.length ? (
            <Empty>No evidence submitted yet.</Empty>
          ) : (
            <ul className="evidence" data-testid="evidence-list">
              {f.evidence.map((e) => (
                <li key={e.evidenceId}>
                  <strong>{e.fileName}</strong> <span className="muted">({e.contentType}, {e.sizeBytes.toLocaleString('en')} bytes)</span>
                  <div className="sub mono">sha256 {e.sha256.slice(0, 16)}… · {e.storageRef}</div>
                  <div className="sub">
                    {e.evidenceId} by {e.uploadedBy} · {e.uploadedAt.slice(0, 10)}
                    {e.note && <> · “{e.note}”</>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="History">
          <Timeline events={f.events ?? []} />
        </Card>
      </div>
      {canSubmit && <EvidenceForm findingId={f.findingId} onDone={reload} />}
      {canReview && <ReviewForm findingId={f.findingId} onDone={reload} />}
    </div>
  );
}

const TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'text/plain'];

function EvidenceForm({ findingId, onDone }: { findingId: string; onDone: () => void }) {
  const empty = { fileName: '', contentType: 'application/pdf', sizeBytes: '', sha256: '', note: '' };
  const [form, setForm] = useState(empty);
  const { busy, error, fields, run } = useAction();
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card title="Submit remediation evidence" testId="evidence-form">
      <p className="muted">File storage is stubbed: record the file's metadata and checksum.</p>
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          const body = { ...form, sizeBytes: Number(form.sizeBytes), note: form.note || undefined };
          if (await run(() => api(`/findings/${findingId}/evidence`, { method: 'POST', body }))) {
            setForm(empty);
            onDone();
          }
        }}
      >
        <Field label="File name" error={fields.fileName}>
          <input value={form.fileName} onChange={set('fileName')} data-testid="evidence-file" />
        </Field>
        <Field label="Content type" error={fields.contentType}>
          <select value={form.contentType} onChange={set('contentType')}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Size (bytes)" error={fields.sizeBytes}>
          <input inputMode="numeric" value={form.sizeBytes} onChange={set('sizeBytes')} data-testid="evidence-size" />
        </Field>
        <Field label="SHA-256" error={fields.sha256}>
          <input value={form.sha256} onChange={set('sha256')} className="mono" data-testid="evidence-sha" />
        </Field>
        <Field label="Note" error={fields.note}>
          <textarea value={form.note} onChange={set('note')} rows={2} data-testid="evidence-note" />
        </Field>
        <div className="actions wide">
          <button type="submit" className="primary" disabled={busy} data-testid="evidence-submit">
            Submit for review
          </button>
        </div>
      </form>
      <ErrorNote message={error} />
    </Card>
  );
}

function ReviewForm({ findingId, onDone }: { findingId: string; onDone: () => void }) {
  const [comment, setComment] = useState('');
  const { busy, error, fields, run } = useAction();
  const decide = (decision: 'REMEDIATED' | 'RE_OPEN') =>
    run(() => api(`/findings/${findingId}/review`, { method: 'POST', body: { decision, comment } })).then((ok) => ok && onDone());

  return (
    <Card title="Review decision" testId="review-form">
      <Field label="Comment (required)" error={fields.comment}>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} data-testid="review-comment" />
      </Field>
      <div className="actions">
        <button className="primary" disabled={busy} onClick={() => decide('REMEDIATED')} data-testid="review-approve">
          Mark remediated
        </button>
        <button disabled={busy} onClick={() => decide('RE_OPEN')} data-testid="review-reopen">
          Re-open
        </button>
      </div>
      <ErrorNote message={error} />
    </Card>
  );
}
