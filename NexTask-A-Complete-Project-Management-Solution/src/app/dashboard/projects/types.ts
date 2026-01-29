export type ProjectStatus = 'Completed' | 'In Progress' | 'Pending' | string;

export type ColumnAlignment = 'left' | 'center' | 'right';

import type { TaskAttachment } from '@/app/dashboard/tasks/types';

export interface Project {
  id?: string | number;
  name?: string;
  clientName?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  dueDate?: string; // Added for task-related project usage
  priority?: string;
  assignee?: string[]; // Array of user IDs assigned to the project
  attachments?: TaskAttachment[]; // Reuse task attachment structure for projects
}

export interface ResponsiveTableColumn {
  title: string;
  key: string;
  align?: ColumnAlignment;
  render?: (data: Project) => JSX.Element;
}

export interface ProjectListKeys {
  primaryLinkKey?: string;
  primaryKeys: string[];
  secondaryKeys: string[];
}

export interface ProjectDetail {
  startDate: string | null;
  endDate: string | null;
  progress: number;
  type: string | null;
  customer: string | null;
  description: string | null;
}

export interface DetailsCardProps {
  project: ProjectDetail;
  handleEdit?: () => void;
  setDeleteOpen?: () => void;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
}
