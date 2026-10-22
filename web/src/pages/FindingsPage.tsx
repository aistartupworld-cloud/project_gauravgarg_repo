import { useState } from 'react';
import { api } from '../api';
import { useLoad } from '../hooks';
import { Card, Empty, Loading } from '../components/ui';
import { SEVERITIES, type Finding } from '../types';
import { FindingsTable } from './FindingsTable';

const STATES = ['OPEN', 'AWAITING_REVIEW', 'RE_OPEN', 'REMEDIATED'];

export function FindingsPage() {
  const [state, setState] = useState('');
  const [severity, setSeverity] = useState('');
  const q = new URLSearchParams({ ...(state && { state }), ...(severity && { severity }) }).toString();
  const { data, error } = useLoad(() => api<Finding[]>(`/findings${q ? `?${q}` : ''}`), [q]);

  return (
    <div className="page">
      <h1>Findings</h1>
      <Card
        actions={
          <div className="filters">
            <select aria-label="Filter by state" value={state} onChange={(e) => setState(e.target.value)} data-testid="filter-state">
              <option value="">All states</option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select aria-label="Filter by severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="">All severities</option>
              {SEVERITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        }
      >
        {error && <p className="error">{error}</p>}
        {!data ? <Loading what="findings" /> : data.length === 0 ? <Empty>No findings match.</Empty> : <FindingsTable findings={data} />}
      </Card>
    </div>
  );
}
