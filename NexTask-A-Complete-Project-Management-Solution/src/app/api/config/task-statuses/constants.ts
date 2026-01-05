// Task statuses configuration
export const TASK_STATUSES = [
  {
    value: 'pending',
    label: 'Pending',
    order: 0,
    color: 'default' as const,
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    order: 1,
    color: 'warning' as const,
  },
  {
    value: 'completed',
    label: 'Completed',
    order: 2,
    color: 'success' as const,
  },
];

