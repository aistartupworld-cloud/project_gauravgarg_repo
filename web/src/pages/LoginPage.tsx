import { useState } from 'react';
import { api } from '../api';
import { useAction } from '../hooks';
import { ErrorNote, Field } from '../components/ui';
import type { User } from '../types';

const DEMO_USERS: Array<[string, string]> = [
  ['alice.admin', 'Admin'],
  ['ravi.auditor', 'Auditor'],
  ['olivia.owner', 'Owner'],
  ['omar.owner', 'Owner'],
  ['rhea.reviewer', 'Reviewer'],
  ['rob.reviewer', 'Reviewer'],
];

export function LoginPage({ onSignedIn }: { onSignedIn: (token: string, user: User) => void }) {
  const [username, setUsername] = useState('');
  const { busy, error, run } = useAction();

  const signIn = (name: string) =>
    run(async () => {
      const res = await api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { username: name } });
      onSignedIn(res.token, res.user);
    });

  return (
    <div className="login">
      <div className="login-card">
        <h1>
          <span className="logo" aria-hidden>◆</span> SecureGate
        </h1>
        <p className="muted">Compliance audit, findings &amp; remediation. Demo sign-in with synthetic users.</p>
        <div className="demo-users" role="group" aria-label="Demo users">
          {DEMO_USERS.map(([u, role]) => (
            <button key={u} onClick={() => signIn(u)} disabled={busy} data-testid={`login-${u}`}>
              <strong>{u}</strong>
              <span className="muted">{role}</span>
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void signIn(username.trim());
          }}
        >
          <Field label="Or sign in as">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" data-testid="login-username" />
          </Field>
          <button type="submit" className="primary" disabled={busy || !username.trim()}>
            Sign in
          </button>
        </form>
        <ErrorNote message={error} />
      </div>
    </div>
  );
}
