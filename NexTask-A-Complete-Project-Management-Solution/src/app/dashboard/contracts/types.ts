export interface Contract {
  id?: string | number;
  title: string;
  client: string;
  startDate: string;
  endDate: string;
  status: string;
  budget: number;
  description: string;
}

export type ColumnAlignment = 'left' | 'center' | 'right' | undefined;

export interface ResponsiveTableColumn {
  title: string;
  key: string;
  align?: ColumnAlignment;
  render?: (data: Contract) => JSX.Element;
}

export interface ContractFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (contract: Contract) => void;
  initialContract?: Contract;
}

export interface ContractDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  contract?: Contract | null;
}
