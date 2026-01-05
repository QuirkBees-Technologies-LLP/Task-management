export type ColumnAlignment = 'left' | 'center' | 'right';

export interface Client {
  id: number;
  clientName: string;
  contactPerson: string;
  email: string;
  projectsCount: number;
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
  handleSaveClient: (client: Client) => void;
}
