import { api } from '../api';
import { useLoad } from '../hooks';
import { Bar, Card, Empty, Loading, SeverityBadge, Stat, StateBadge } from '../components/ui';
import { SEVERITIES, type Dashboard } from '../types';

export function DashboardPage() {
  const { data, error } = useLoad(() => api<Dashboard>('/dashboard'));
  if (error) return <p className="error">{error}</p>;
  if (!data) return <Loading what="dashboard" />;
  const maxSev = Math.max(1, ...SEVERITIES.map((s) => data.openBySeverity[s]));

  return (
    <div className="page">
      <h1>Compliance dashboard</h1>
      <div className="stats" data-testid="totals">
        <Stat label="Audits" value={data.totals.audits} />
        <Stat label="Open findings" value={data.totals.open} testId="stat-open" />
        <Stat label="Overdue" value={data.totals.overdue} tone={data.totals.overdue ? 'warn' : 'ok'} testId="stat-overdue" />
        <Stat label="Awaiting review" value={data.totals.awaitingReview} />
        <Stat label="Remediated" value={data.totals.remediated} tone="ok" />
      </div>

      <div className="grid-2">
        <Card title="Control coverage" testId="panel-coverage">
          <ul className="meters">
            {data.coverage.map((c) => (
              <li key={c.frameworkCode}>
                <div className="meter-head">
                  <span>{c.name}</span>
                  <strong data-testid={`coverage-${c.frameworkCode}`}>{c.coveragePct}%</strong>
                </div>
                <Bar pct={c.coveragePct} label={`${c.frameworkCode} coverage`} />
                <small className="muted">
                  {c.assessed} of {c.published} published controls assessed
                </small>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Open findings by severity" testId="panel-severity">
          <ul className="meters">
            {SEVERITIES.map((s) => (
              <li key={s} className="sev-row">
                <SeverityBadge severity={s} />
                <Bar pct={Math.floor((data.openBySeverity[s] * 100) / maxSev)} label={`${s} open findings`} />
                <strong data-testid={`open-${s}`}>{data.openBySeverity[s]}</strong>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Overdue items by owner" testId="panel-overdue">
          {data.overdueByOwner.length === 0 ? (
            <Empty>Nothing overdue.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th className="num">Overdue</th>
                    <th className="num">Worst (days)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.overdueByOwner.map((o) => (
                    <tr key={o.owner}>
                      <td>{o.ownerName}</td>
                      <td className="num">{o.count}</td>
                      <td className="num">{o.maxDaysOverdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Audit progress" testId="panel-progress">
          <ul className="meters">
            {data.auditProgress.map((a) => (
              <li key={a.auditId}>
                <div className="meter-head">
                  <a href={`#/audits/${a.auditId}`}>{a.auditId}</a>
                  <StateBadge state={a.state} />
                </div>
                <Bar pct={a.progressPct} label={`${a.auditId} progress`} />
                <small className="muted">
                  {a.title} · {a.findingsRemediated}/{a.findingsTotal} findings remediated · due {a.targetEndDate}
                </small>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Per-framework summary" testId="panel-frameworks">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Framework</th>
                <th className="num">Controls</th>
                <th className="num">Coverage</th>
                <th className="num">Audits</th>
                <th className="num">Open</th>
                <th className="num">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {data.frameworks.map((f) => (
                <tr key={f.frameworkCode}>
                  <td>{f.name}</td>
                  <td className="num">{f.publishedControls}</td>
                  <td className="num">{f.coveragePct}%</td>
                  <td className="num">{Object.values(f.auditsByState).reduce((a, b) => a + b, 0)}</td>
                  <td className="num">{f.openFindings}</td>
                  <td className="num">{f.overdueFindings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
