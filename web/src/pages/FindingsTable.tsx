import { EscalatedBadge, SeverityBadge, StateBadge } from '../components/ui';
import type { Finding } from '../types';

export function FindingsTable({ findings, showOwner = true }: { findings: Finding[]; showOwner?: boolean }) {
  return (
    <div className="table-wrap">
      <table data-testid="findings-table">
        <thead>
          <tr>
            <th>Finding</th>
            <th>Severity</th>
            <th>State</th>
            <th>Control</th>
            {showOwner && <th>Owner</th>}
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr key={f.findingId} data-testid={`row-${f.findingId}`}>
              <td>
                <a href={`#/findings/${f.findingId}`}>{f.findingId}</a>
                <div className="sub">{f.title}</div>
              </td>
              <td>
                <SeverityBadge severity={f.severity} />
              </td>
              <td>
                <StateBadge state={f.state} />
              </td>
              <td>
                {f.frameworkCode} {f.controlId}
              </td>
              {showOwner && <td>{f.ownerName}</td>}
              <td>
                {f.dueDate} {f.escalated && <EscalatedBadge days={f.daysOverdue} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
