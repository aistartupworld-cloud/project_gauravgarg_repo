import { useState } from 'react';
import { api } from '../api';
import { navigate, useAction, useLoad } from '../hooks';
import { Card, Empty, ErrorNote, Field, Loading, StateBadge } from '../components/ui';
import type { Audit, Control, Framework, Me } from '../types';

export function AuditsPage({ me }: { me: Me }) {
  const { data, error } = useLoad(() => api<Audit[]>('/audits'));
  return (
    <div className="page">
      <h1>Audits</h1>
      {me.role === 'AUDITOR' && <PlanAuditForm />}
      <Card title="All audits">
        {error && <p className="error">{error}</p>}
        {!data ? (
          <Loading what="audits" />
        ) : data.length === 0 ? (
          <Empty>No audits planned yet.</Empty>
        ) : (
          <div className="table-wrap">
            <table data-testid="audits-table">
              <thead>
                <tr>
                  <th>Audit</th>
                  <th>Framework</th>
                  <th>State</th>
                  <th>Target end</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.auditId}>
                    <td>
                      <a href={`#/audits/${a.auditId}`}>{a.auditId}</a>
                      <div className="sub">{a.title}</div>
                    </td>
                    <td>{a.frameworkCode}</td>
                    <td>
                      <StateBadge state={a.state} />
                    </td>
                    <td>{a.targetEndDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function PlanAuditForm() {
  const frameworks = useLoad(() => api<Framework[]>('/frameworks'));
  const [frameworkCode, setFrameworkCode] = useState('');
  const [title, setTitle] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [scope, setScope] = useState<string[]>([]);
  const controls = useLoad(() => (frameworkCode ? api<Control[]>(`/controls?framework=${frameworkCode}`) : Promise.resolve([])), [frameworkCode]);
  const { busy, error, fields, run } = useAction();

  const submit = () =>
    run(async () => {
      const a = await api<Audit>('/audits', { method: 'POST', body: { frameworkCode, title, scope, targetEndDate } });
      navigate(`/audits/${a.auditId}`);
    });

  return (
    <Card title="Plan an audit" testId="plan-audit">
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Framework" error={fields.frameworkCode}>
          <select value={frameworkCode} onChange={(e) => (setFrameworkCode(e.target.value), setScope([]))} data-testid="audit-framework">
            <option value="">Choose…</option>
            {frameworks.data?.map((f) => (
              <option key={f.code} value={f.code}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title" error={fields.title}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="audit-title" />
        </Field>
        <Field label="Target end date" error={fields.targetEndDate}>
          <input type="date" value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} data-testid="audit-end" />
        </Field>
        <fieldset className="field wide">
          <legend>Scope (leave empty for every published control)</legend>
          <div className="checks">
            {controls.data?.map((c) => (
              <label key={c.controlId} className="check">
                <input
                  type="checkbox"
                  checked={scope.includes(c.controlId)}
                  onChange={(e) => setScope((s) => (e.target.checked ? [...s, c.controlId] : s.filter((x) => x !== c.controlId)))}
                />
                {c.controlId}
              </label>
            ))}
          </div>
          {fields.scope && <small className="error">{fields.scope}</small>}
        </fieldset>
        <div className="actions wide">
          <button type="submit" className="primary" disabled={busy} data-testid="audit-create">
            Create audit
          </button>
        </div>
      </form>
      <ErrorNote message={error} />
    </Card>
  );
}
