export interface Contract {
  id?: string | number;
  _id?: string;
  contractNumber?: string;
  title: string;
  client?: string;
  clientName?: string;
  clientEmail?: string;
  startDate: string;
  endDate: string;
  status: string;
  budget?: number;
  value?: number;
  description?: string;
  terms?: string;
  createdAt?: string;
  updatedAt?: string;
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
  onSave: (contract: Partial<Contract>) => void;
  initialContract?: Contract;
  saving?: boolean;
}

export interface ContractDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  contract?: Contract | null;
}
