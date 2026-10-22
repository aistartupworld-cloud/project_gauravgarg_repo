import { useState, type ReactNode } from 'react';
import type { Me, Role } from '../types';

interface NavItem {
  path: string;
  label: string;
  roles: Role[];
}

export const NAV: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'AUDITOR', 'REVIEWER'] },
  { path: '/my-findings', label: 'My findings', roles: ['OWNER'] },
  { path: '/audits', label: 'Audits', roles: ['ADMIN', 'AUDITOR', 'REVIEWER'] },
  { path: '/findings', label: 'Findings', roles: ['ADMIN', 'AUDITOR', 'REVIEWER'] },
  { path: '/reviews', label: 'Review queue', roles: ['REVIEWER'] },
  { path: '/admin', label: 'Admin console', roles: ['ADMIN'] },
];

export function homeFor(role: Role): string {
  return role === 'OWNER' ? '/my-findings' : role === 'REVIEWER' ? '/reviews' : '/dashboard';
}

export function Layout({ me, route, onSignOut, children }: { me: Me; route: string; onSignOut: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => n.roles.includes(me.role));
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href={`#${homeFor(me.role)}`}>
          <span className="logo" aria-hidden>◆</span> SecureGate
        </a>
        <button className="menu-toggle" aria-expanded={open} aria-controls="nav" onClick={() => setOpen((o) => !o)} data-testid="menu-toggle">
          Menu
        </button>
      </header>
      <nav id="nav" className={`sidebar ${open ? 'open' : ''}`} aria-label="Main">
        <ul>
          {items.map((n) => (
            <li key={n.path}>
              <a href={`#${n.path}`} className={route.startsWith(n.path) ? 'active' : ''} onClick={() => setOpen(false)} data-testid={`nav-${n.path.slice(1)}`}>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="whoami">
          <span data-testid="whoami">{me.username}</span>
          <span className="badge role">{me.role}</span>
          <button className="link" onClick={onSignOut} data-testid="sign-out">
            Sign out
          </button>
        </div>
      </nav>
      <main className="content">{children}</main>
    </div>
  );
}
