import { Project, ResponsiveTableColumn as ProjectColumn } from '@/app/dashboard/projects/types';
import { Task, ResponsiveTableColumn as TaskColumn } from '@/app/dashboard/tasks/types';

export interface FilterState {
  status: string;
  type: 'projects' | 'tasks';
}

export interface ReportFiltersProps {
  onApplyFilter: (filters: FilterState) => void;
}

export interface ExportOptionsProps {
  title: string;
  data: Project[] | Task[];
  columns: ProjectColumn[] | TaskColumn[];
}

export interface PdfTemplateProps {
  data: ExportOptionsProps['data'];
  columns: ExportOptionsProps['columns'];
}

export interface ReportsChartProps {
  data: ExportOptionsProps['data'];
}
