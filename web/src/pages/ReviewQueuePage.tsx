import { api } from '../api';
import { useLoad } from '../hooks';
import { Card, Empty, Loading } from '../components/ui';
import type { Finding } from '../types';
import { FindingsTable } from './FindingsTable';

export function ReviewQueuePage() {
  const { data, error } = useLoad(() => api<Finding[]>('/reviews/queue'));
  return (
    <div className="page">
      <h1>Review queue</h1>
      <Card title="Awaiting your decision" testId="review-queue">
        {error && <p className="error">{error}</p>}
        {!data ? <Loading what="queue" /> : data.length === 0 ? <Empty>The queue is empty.</Empty> : <FindingsTable findings={data} />}
      </Card>
    </div>
  );
}
