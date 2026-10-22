import { api } from '../api';
import { useLoad } from '../hooks';
import { Card, Empty, Loading, SeverityBadge, Stat } from '../components/ui';
import { SEVERITIES, type Finding, type OwnerDashboard } from '../types';
import { FindingsTable } from './FindingsTable';

export function MyFindingsPage() {
  const summary = useLoad(() => api<OwnerDashboard>('/dashboard/me'));
  const list = useLoad(() => api<Finding[]>('/findings'));
  const s = summary.data;

  return (
    <div className="page">
      <h1>My findings</h1>
      {summary.error && <p className="error">{summary.error}</p>}
      {s && (
        <>
          <div className="stats" data-testid="owner-summary">
            <Stat label="Open" value={s.open} testId="stat-open" />
            <Stat label="Overdue" value={s.overdue} tone={s.overdue ? 'warn' : 'ok'} testId="stat-overdue" />
            <Stat label="Awaiting review" value={s.awaitingReview} />
            <Stat label="Remediated" value={s.remediated} tone="ok" />
          </div>
          <p className="muted">
            {SEVERITIES.map((sev) => (
              <span key={sev} className="inline-sev">
                <SeverityBadge severity={sev} /> {s.openBySeverity[sev]}
              </span>
            ))}
            {s.nextDue && (
              <span>
                {' '}
                · next due <a href={`#/findings/${s.nextDue.findingId}`}>{s.nextDue.findingId}</a> on {s.nextDue.dueDate}
              </span>
            )}
          </p>
        </>
      )}
      <Card title="Assigned to me">
        {list.error && <p className="error">{list.error}</p>}
        {!list.data ? <Loading what="findings" /> : list.data.length === 0 ? <Empty>Nothing assigned to you.</Empty> : <FindingsTable findings={list.data} showOwner={false} />}
      </Card>
    </div>
  );
}
