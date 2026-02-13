export type ColumnAlignment = 'left' | 'center' | 'right';

export interface Client {
  id?: number | string;
  _id?: string;
  clientName?: string;
  name?: string;
  projectName?: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
  photoUrl?: string;
  projectsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResponsiveTableColumn {
  title: string;
  key: string;
  align?: ColumnAlignment;
  render?: (data: Client) => JSX.Element;
}

export interface ClientListKeys {
  primaryLinkKey?: string;
  primaryKeys: string[];
  secondaryKeys: string[];
}

export interface ClientModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  client: Client | null;
  handleSaveClient: (client: Partial<Client>) => void;
  saving?: boolean;
}
