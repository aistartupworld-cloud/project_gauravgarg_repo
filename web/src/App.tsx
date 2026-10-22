import { useEffect, useState } from 'react';
import { api, getToken, rememberToken } from './api';
import { navigate, useRoute } from './hooks';
import { Layout, NAV, homeFor } from './components/Layout';
import { Loading } from './components/ui';
import type { Me } from './types';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyFindingsPage } from './pages/MyFindingsPage';
import { AuditsPage } from './pages/AuditsPage';
import { AuditDetailPage } from './pages/AuditDetailPage';
import { FindingsPage } from './pages/FindingsPage';
import { FindingDetailPage } from './pages/FindingDetailPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  const route = useRoute();
  const [me, setMe] = useState<Me | null>(null);
  const [checking, setChecking] = useState(() => getToken() !== null);

  // Resume a session from sessionStorage; the server resolves the role from the DB.
  useEffect(() => {
    if (!checking) return;
    api<Me>('/auth/me')
      .then(setMe)
      .catch(() => rememberToken(null))
      .finally(() => setChecking(false));
  }, [checking]);

  if (checking) return <Loading what="session" />;
  if (!me) {
    return (
      <LoginPage
        onSignedIn={(token, user) => {
          rememberToken(token);
          setMe({ id: user.id, username: user.username, role: user.role });
          navigate(homeFor(user.role));
        }}
      />
    );
  }

  const signOut = () => {
    rememberToken(null);
    setMe(null);
    navigate('/');
  };

  return (
    <Layout me={me} route={route} onSignOut={signOut}>
      <Page me={me} route={route} />
    </Layout>
  );
}

function Page({ me, route }: { me: Me; route: string }) {
  const [, section, id] = route.split('/');
  const allowed = NAV.some((n) => n.path === `/${section}` && n.roles.includes(me.role));
  // Detail pages: findings are visible to owners for their own items; audits follow the list rules.
  if (section === 'findings' && id) return <FindingDetailPage me={me} findingId={id} />;
  if (section === 'audits' && id && allowed) return <AuditDetailPage me={me} auditId={id} />;
  if (!allowed) {
    navigate(homeFor(me.role));
    return null;
  }
  switch (section) {
    case 'dashboard':
      return <DashboardPage />;
    case 'my-findings':
      return <MyFindingsPage />;
    case 'audits':
      return <AuditsPage me={me} />;
    case 'findings':
      return <FindingsPage />;
    case 'reviews':
      return <ReviewQueuePage />;
    case 'admin':
      return <AdminPage />;
    default:
      return null;
  }
}
