import { ColumnAlignment, Project } from '../projects/types';

export interface TaskAttachment {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  attachmentType: 'file' | 'url' | 'google_drive' | 'onedrive' | 'box' | 'dropbox';
}

export interface Subtask {
  id?: string;
  title: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  dueDate?: string;
  attachments?: TaskAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssigneeInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  photoUrl?: string;
}

export type Task = {
  id: number | string;
  title: string;
  description: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate: string;
  sectionId?: string;
  attachments?: TaskAttachment[];
  subtasks?: Subtask[];
  assignee?: string[]; // Array of user IDs
  assigneeInfo?: AssigneeInfo[]; // Array of assignee information with profile pictures
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
  onSave: (task: Task, keepOpen?: boolean) => void;
  task: Task | null;
  projects: Project[];
  saving?: boolean;
  restrictProjectId?: string; // When provided, only show this project in the dropdown and disable it
}

export interface TaskBoardProps {
  tasks: Task[];
  onEditTask: (task: Task | null) => any;
  onDeleteTask: (id: number | string) => any;
  onStatusChange?: (task: Task) => any;
}

export interface SortableItemProps {
  id: any;
  item?: Task | null;
  onEditTask?: (task: Task) => any;
  onDeleteTask?: (taskId: any) => any;
  onStatusChange?: (task: Task) => any;
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
