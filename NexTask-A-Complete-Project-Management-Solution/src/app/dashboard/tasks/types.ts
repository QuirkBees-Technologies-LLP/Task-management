import { ColumnAlignment, Project } from '../projects/types';

export type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate: string;
};

export interface ResponsiveTableColumn {
  title: string;
  key: string;
  align?: ColumnAlignment;
  render?: (data: Task) => JSX.Element;
}

export interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task: Task | null;
  projects: Project[];
}

export interface TaskBoardProps {
  tasks: Task[];
  onEditTask: (task: Task | null) => any;
  onDeleteTask: (id: number) => any;
}

export interface SortableItemProps {
  id: any;
  item?: Task | null;
  onEditTask?: (task: Task) => any;
  onDeleteTask?: (taskId: any) => any;
}

// Define the shape of a single task
export type TaskType = {
  id: string;
  title: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
};

// Define the structure of the columns object
export type ColumnsType = {
  Todo: Task[];
  'In Progress': Task[];
  Done: Task[];
};
