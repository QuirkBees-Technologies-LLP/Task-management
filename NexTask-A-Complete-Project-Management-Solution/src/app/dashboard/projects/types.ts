export type ProjectStatus = 'Completed' | 'In Progress' | 'Pending' | string;

export type ColumnAlignment = 'left' | 'center' | 'right';

export interface Project {
  id?: string | number;
  name?: string;
  clientName?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  dueDate?: string; // Added for task-related project usage
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
