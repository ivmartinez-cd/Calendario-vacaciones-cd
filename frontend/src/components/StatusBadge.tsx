import { Badge } from './ui';
import { statusLabels, statusStyles } from '@/lib/utils';
import { RequestStatus } from '@/types';

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>;
}
