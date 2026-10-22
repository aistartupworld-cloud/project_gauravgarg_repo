import { useState } from 'react';
import { api } from '../api';
import { useAction, useLoad } from '../hooks';
import { Card, Empty, ErrorNote, EscalatedBadge, Field, Loading, SeverityBadge } from '../components/ui';
import { ROLES, SEVERITIES, type Control, type Finding, type Framework, type Role, type Severity, type SlaRuleSet, type User } from '../types';

type Tab = 'users' | 'controls' | 'sla' | 'escalations';
const TABS: Array<[Tab, string]> = [
  ['users', 'Users & roles'],
  ['controls', 'Controls library'],
  ['sla', 'SLA rules'],
  ['escalations', 'Escalations'],
];

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');
  return (
    <div className="page">
      <h1>Admin console</h1>
      <div className="tabs" role="tablist">
        {TABS.map(([t, label]) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)} data-testid={`tab-${t}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'users' && <UsersPanel />}
      {tab === 'controls' && <ControlsPanel />}
      {tab === 'sla' && <SlaPanel />}
      {tab === 'escalations' && <EscalationsPanel />}
    </div>
  );
}

function UsersPanel() {
  const { data, error, reload } = useLoad(() => api<User[]>('/admin/users'));
  const [form, setForm] = useState({ username: '', displayName: '', role: 'OWNER' as Role });
  const create = useAction();
  const change = useAction();

  return (
    <>
      <Card title="Users" testId="users-panel">
        {error && <p className="error">{error}</p>}
        <ErrorNote message={change.error} />
        {!data ? (
          <Loading what="users" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id}>
                    <td className="mono">{u.username}</td>
                    <td>{u.displayName}</td>
                    <td>
                      <select
                        aria-label={`Role of ${u.username}`}
                        value={u.role}
                        disabled={change.busy}
                        onChange={async (e) => {
                          if (await change.run(() => api(`/admin/users/${u.id}/role`, { method: 'PATCH', body: { role: e.target.value } }))) reload();
                        }}
                        data-testid={`role-${u.username}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card title="Add a user">
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await create.run(() => api('/admin/users', { method: 'POST', body: form }))) {
              setForm({ username: '', displayName: '', role: 'OWNER' });
              reload();
            }
          }}
        >
          <Field label="Username" error={create.fields.username}>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} data-testid="user-username" />
          </Field>
          <Field label="Display name" error={create.fields.displayName}>
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} data-testid="user-display" />
          </Field>
          <Field label="Role" error={create.fields.role}>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <div className="actions wide">
            <button type="submit" className="primary" disabled={create.busy} data-testid="user-create">
              Add user
            </button>
          </div>
        </form>
        <ErrorNote message={create.error} />
      </Card>
    </>
  );
}

const EMPTY_CONTROL = { frameworkCode: '', controlId: '', title: '', description: '', category: '', defaultSeverity: 'MEDIUM' as Severity };

function ControlsPanel() {
  const frameworks = useLoad(() => api<Framework[]>('/frameworks'));
  const [framework, setFramework] = useState('');
  const versions = useLoad(() => api<Control[]>(`/admin/controls${framework ? `?framework=${framework}` : ''}`), [framework]);
  const [form, setForm] = useState(EMPTY_CONTROL);
  const create = useAction();
  const act = useAction();
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <Card
        title="Control versions"
        testId="controls-panel"
        actions={
          <select aria-label="Framework" value={framework} onChange={(e) => setFramework(e.target.value)}>
            <option value="">All frameworks</option>
            {frameworks.data?.map((f) => (
              <option key={f.code} value={f.code}>
                {f.name}
              </option>
            ))}
          </select>
        }
      >
        <ErrorNote message={act.error} />
        {!versions.data ? (
          <Loading what="controls" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Control</th>
                  <th>Version</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {versions.data.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.frameworkCode} <strong>{c.controlId}</strong>
                      <div className="sub">{c.title}</div>
                    </td>
                    <td>v{c.version}</td>
                    <td>
                      <SeverityBadge severity={c.defaultSeverity} />
                    </td>
                    <td>{c.status === 'DRAFT' ? <span className="badge draft">DRAFT</span> : <span className="muted">published {c.publishedAt?.slice(0, 10)}</span>}</td>
                    <td className="row-actions">
                      {c.status === 'DRAFT' ? (
                        <button disabled={act.busy} onClick={async () => (await act.run(() => api(`/admin/controls/${c.id}/publish`, { method: 'POST' }))) && versions.reload()} data-testid={`publish-${c.controlId}`}>
                          Publish
                        </button>
                      ) : (
                        <button disabled={act.busy} onClick={async () => (await act.run(() => api(`/admin/controls/${c.id}/revise`, { method: 'POST', body: {} }))) && versions.reload()}>
                          New version
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card title="Draft a new control">
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await create.run(() => api('/admin/controls', { method: 'POST', body: form }))) {
              setForm(EMPTY_CONTROL);
              versions.reload();
            }
          }}
        >
          <Field label="Framework" error={create.fields.frameworkCode}>
            <select value={form.frameworkCode} onChange={set('frameworkCode')} data-testid="control-framework">
              <option value="">Choose…</option>
              {frameworks.data?.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Control id" error={create.fields.controlId}>
            <input value={form.controlId} onChange={set('controlId')} data-testid="control-id" />
          </Field>
          <Field label="Title" error={create.fields.title}>
            <input value={form.title} onChange={set('title')} data-testid="control-title" />
          </Field>
          <Field label="Category" error={create.fields.category}>
            <input value={form.category} onChange={set('category')} data-testid="control-category" />
          </Field>
          <Field label="Default severity" error={create.fields.defaultSeverity}>
            <select value={form.defaultSeverity} onChange={set('defaultSeverity')}>
              {SEVERITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Description" error={create.fields.description}>
            <textarea value={form.description} onChange={set('description')} rows={2} data-testid="control-description" />
          </Field>
          <div className="actions wide">
            <button type="submit" className="primary" disabled={create.busy} data-testid="control-create">
              Save draft
            </button>
          </div>
        </form>
        <ErrorNote message={create.error} />
      </Card>
    </>
  );
}

function SlaPanel() {
  const { data, reload } = useLoad(() => api<{ active: SlaRuleSet; history: SlaRuleSet[] }>('/sla-rules'));
  const [days, setDays] = useState<Record<Severity, string>>({ CRITICAL: '', HIGH: '', MEDIUM: '', LOW: '' });
  const [note, setNote] = useState('');
  const { busy, error, fields, run } = useAction();
  if (!data) return <Loading what="SLA rules" />;

  return (
    <>
      <Card title={`Active rule set: v${data.active.version}`} testId="sla-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Version</th>
                {SEVERITIES.map((s) => (
                  <th key={s} className="num">
                    {s}
                  </th>
                ))}
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((r) => (
                <tr key={r.version}>
                  <td>
                    v{r.version}
                    {r.note && <div className="sub">{r.note}</div>}
                  </td>
                  {SEVERITIES.map((s) => (
                    <td key={s} className="num">
                      {r.days[s]}d
                    </td>
                  ))}
                  <td>
                    {r.createdAt.slice(0, 10)} {r.createdBy && <span className="muted">by {r.createdBy}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">New versions apply to findings recorded afterwards; existing due dates never move.</p>
      </Card>
      <Card title="Publish a new version">
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            const body = { days: Object.fromEntries(SEVERITIES.map((s) => [s, Number(days[s] || data.active.days[s])])), note: note || undefined };
            if (await run(() => api('/admin/sla-rules', { method: 'POST', body }))) {
              setDays({ CRITICAL: '', HIGH: '', MEDIUM: '', LOW: '' });
              setNote('');
              reload();
            }
          }}
        >
          {SEVERITIES.map((s) => (
            <Field key={s} label={`${s} (days)`} error={fields[s]}>
              <input inputMode="numeric" placeholder={String(data.active.days[s])} value={days[s]} onChange={(e) => setDays({ ...days, [s]: e.target.value })} />
            </Field>
          ))}
          <Field label="Change note" error={fields.note}>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="actions wide">
            <button type="submit" className="primary" disabled={busy}>
              Publish v{data.active.version + 1}
            </button>
          </div>
        </form>
        <ErrorNote message={error} />
      </Card>
    </>
  );
}

function EscalationsPanel() {
  const { data } = useLoad(() => api<Finding[]>('/admin/escalations'));
  return (
    <Card title="Escalated findings (most severe, most overdue first)" testId="escalations-panel">
      {!data ? (
        <Loading what="escalations" />
      ) : data.length === 0 ? (
        <Empty>No escalations.</Empty>
      ) : (
        <ul className="escalations">
          {data.map((f) => (
            <li key={f.findingId}>
              <SeverityBadge severity={f.severity} /> <a href={`#/findings/${f.findingId}`}>{f.findingId}</a> {f.title}
              <div className="sub">
                {f.ownerName} · due {f.dueDate} <EscalatedBadge days={f.daysOverdue} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
